from flask import Blueprint, jsonify, request, g
from utils.auth_middleware import require_auth
from services.supabase_service import SupabaseService
from services.email_service import EmailService
import logging

logger = logging.getLogger(__name__)
tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/tasks")

@tasks_bp.route("", methods=["GET"])
@require_auth
def get_tasks():
    """
    List tasks with optional filters:
    - status ('all', 'todo', 'in_progress', 'completed')
    - priority ('all', 'low', 'medium', 'high', 'urgent')
    - assigned_to (UUID string)
    - created_by (UUID string)
    - search (text query)
    """
    status = request.args.get("status")
    priority = request.args.get("priority")
    assigned_to = request.args.get("assigned_to")
    created_by = request.args.get("created_by")
    search = request.args.get("search")

    tasks = SupabaseService.list_tasks(
        status=status,
        priority=priority,
        assigned_to=assigned_to,
        created_by=created_by,
        search=search
    )

    return jsonify({
        "success": True,
        "count": len(tasks),
        "tasks": tasks
    }), 200

@tasks_bp.route("", methods=["POST"])
@require_auth
def create_task():
    """
    Creates a new task and dispatches email notification to assignee via Gmail.
    """
    data = request.get_json() or {}
    title = data.get("title", "").strip()

    if not title:
        return jsonify({
            "success": False,
            "error": "ValidationError",
            "message": "Task title is required."
        }), 400

    current_user_id = g.current_user["id"]
    description = data.get("description", "").strip()
    priority = data.get("priority", "medium").lower()
    status = data.get("status", "todo").lower()
    due_date = data.get("due_date") or None
    assigned_to = data.get("assigned_to") or None

    # Validate enums
    if priority not in ("low", "medium", "high", "urgent"):
        priority = "medium"
    if status not in ("todo", "in_progress", "completed"):
        status = "todo"

    task_payload = {
        "title": title,
        "description": description,
        "priority": priority,
        "status": status,
        "due_date": due_date,
        "created_by": current_user_id,
        "assigned_to": assigned_to
    }

    try:
        created_task = SupabaseService.create_task(task_payload)
        if not created_task:
            return jsonify({
                "success": False,
                "error": "DatabaseError",
                "message": "Failed to create task in Supabase."
            }), 500

        task_id = created_task["id"]

        # Log activity
        SupabaseService.log_activity(
            task_id=task_id,
            actor_id=current_user_id,
            action_type="created",
            details={"title": title, "priority": priority, "assigned_to": assigned_to}
        )

        # Trigger Gmail Notification
        creator_profile = SupabaseService.get_profile(current_user_id) or {
            "email": g.current_user["email"],
            "full_name": g.current_user.get("metadata", {}).get("full_name")
        }
        assignee_profile = None
        if assigned_to:
            assignee_profile = SupabaseService.get_profile(assigned_to)

        EmailService.send_task_created_notification(
            task=created_task,
            creator=creator_profile,
            assignee=assignee_profile or creator_profile
        )

        return jsonify({
            "success": True,
            "task": created_task,
            "message": "Task created successfully and email notification queued."
        }), 201

    except Exception as e:
        logger.error(f"Error creating task: {e}")
        return jsonify({
            "success": False,
            "error": "InternalServerError",
            "message": str(e)
        }), 500

@tasks_bp.route("/<task_id>", methods=["GET"])
@require_auth
def get_task_details(task_id: str):
    """Fetches task details along with audit activity logs."""
    task = SupabaseService.get_task(task_id)
    if not task:
        return jsonify({
            "success": False,
            "error": "NotFound",
            "message": "Task not found."
        }), 404

    activities = SupabaseService.get_task_activities(task_id)

    return jsonify({
        "success": True,
        "task": task,
        "activities": activities
    }), 200

@tasks_bp.route("/<task_id>", methods=["PATCH"])
@require_auth
def update_task(task_id: str):
    """
    Updates task properties (status, priority, assignee, due_date, description, title).
    If status transitions to 'completed', sends completion email notification via Gmail.
    """
    existing_task = SupabaseService.get_task(task_id)
    if not existing_task:
        return jsonify({
            "success": False,
            "error": "NotFound",
            "message": "Task not found."
        }), 404

    data = request.get_json() or {}
    updates = {}
    allowed_fields = ["title", "description", "status", "priority", "due_date", "assigned_to"]

    for field in allowed_fields:
        if field in data:
            val = data[field]
            if field in ("status", "priority") and val:
                val = str(val).lower()
            updates[field] = val

    if not updates:
        return jsonify({
            "success": False,
            "error": "BadRequest",
            "message": "No valid fields provided to update."
        }), 400

    current_user_id = g.current_user["id"]
    old_status = existing_task.get("status")
    new_status = updates.get("status")
    old_assigned_to = existing_task.get("assigned_to")
    new_assigned_to = updates.get("assigned_to")

    try:
        updated_task = SupabaseService.update_task(task_id, updates)

        # 1. Check for Status Change
        if new_status and new_status != old_status:
            SupabaseService.log_activity(
                task_id=task_id,
                actor_id=current_user_id,
                action_type="status_changed",
                details={"from": old_status, "to": new_status}
            )

            # If task marked as completed, send completion email notification
            if new_status == "completed":
                completer_profile = SupabaseService.get_profile(current_user_id) or {
                    "email": g.current_user["email"],
                    "full_name": g.current_user.get("metadata", {}).get("full_name")
                }
                creator_profile = SupabaseService.get_profile(existing_task.get("created_by"))
                assignee_profile = SupabaseService.get_profile(existing_task.get("assigned_to")) if existing_task.get("assigned_to") else None

                EmailService.send_task_completed_notification(
                    task=updated_task,
                    completer=completer_profile,
                    creator=creator_profile,
                    assignee=assignee_profile
                )

        # 2. Check for Reassignment
        if "assigned_to" in updates and new_assigned_to != old_assigned_to:
            SupabaseService.log_activity(
                task_id=task_id,
                actor_id=current_user_id,
                action_type="reassigned",
                details={"from": old_assigned_to, "to": new_assigned_to}
            )

            if new_assigned_to:
                new_assignee_profile = SupabaseService.get_profile(new_assigned_to)
                creator_profile = SupabaseService.get_profile(existing_task.get("created_by"))
                EmailService.send_task_created_notification(
                    task=updated_task,
                    creator=creator_profile,
                    assignee=new_assignee_profile
                )

        return jsonify({
            "success": True,
            "task": updated_task,
            "message": "Task updated successfully."
        }), 200

    except Exception as e:
        logger.error(f"Error updating task {task_id}: {e}")
        return jsonify({
            "success": False,
            "error": "InternalServerError",
            "message": str(e)
        }), 500

@tasks_bp.route("/<task_id>", methods=["DELETE"])
@require_auth
def delete_task(task_id: str):
    """Deletes a task. Only the creator or assignee can delete."""
    existing_task = SupabaseService.get_task(task_id)
    if not existing_task:
        return jsonify({
            "success": False,
            "error": "NotFound",
            "message": "Task not found."
        }), 404

    current_user_id = g.current_user["id"]
    if existing_task.get("created_by") != current_user_id:
        return jsonify({
            "success": False,
            "error": "Forbidden",
            "message": "You can only delete tasks that you created."
        }), 403

    success = SupabaseService.delete_task(task_id)
    if success:
        return jsonify({
            "success": True,
            "message": "Task deleted successfully."
        }), 200
    else:
        return jsonify({
            "success": False,
            "error": "DatabaseError",
            "message": "Could not delete task."
        }), 500
