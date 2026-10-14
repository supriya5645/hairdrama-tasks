import logging
from typing import Optional, List, Dict, Any
from extensions import get_supabase

logger = logging.getLogger(__name__)

class SupabaseService:
    @staticmethod
    def upsert_profile(user_id: str, email: str, full_name: Optional[str] = None, avatar_url: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Ensures the user profile exists in public.profiles."""
        supabase = get_supabase()
        if not supabase:
            return None

        data = {
            "id": user_id,
            "email": email,
            "full_name": full_name or email.split("@")[0],
            "avatar_url": avatar_url or ""
        }
        try:
            res = supabase.table("profiles").upsert(data).execute()
            if res.data:
                return res.data[0]
            return data
        except Exception as e:
            logger.error(f"Error upserting profile for {user_id}: {e}")
            return None

    @staticmethod
    def get_profile(user_id: str) -> Optional[Dict[str, Any]]:
        """Fetches a single profile by id."""
        supabase = get_supabase()
        if not supabase:
            return None
        try:
            res = supabase.table("profiles").select("*").eq("id", user_id).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
            return None
        except Exception as e:
            logger.error(f"Error fetching profile {user_id}: {e}")
            return None

    @staticmethod
    def list_profiles() -> List[Dict[str, Any]]:
        """Returns all registered user profiles for assignment dropdowns."""
        supabase = get_supabase()
        if not supabase:
            return []
        try:
            res = supabase.table("profiles").select("id, email, full_name, avatar_url").order("full_name").execute()
            return res.data or []
        except Exception as e:
            logger.error(f"Error listing profiles: {e}")
            return []

    @staticmethod
    def list_tasks(
        status: Optional[str] = None,
        priority: Optional[str] = None,
        assigned_to: Optional[str] = None,
        created_by: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Lists tasks with creator and assignee profile joins and optional filters.
        """
        supabase = get_supabase()
        if not supabase:
            return []

        try:
            query = supabase.table("tasks").select(
                "*, creator:created_by(id, email, full_name, avatar_url), assignee:assigned_to(id, email, full_name, avatar_url)"
            ).order("created_at", desc=True)

            if status and status != "all":
                query = query.eq("status", status)
            if priority and priority != "all":
                query = query.eq("priority", priority)
            if assigned_to:
                query = query.eq("assigned_to", assigned_to)
            if created_by:
                query = query.eq("created_by", created_by)
            if search:
                query = query.ilike("title", f"%{search}%")

            res = query.execute()
            return res.data or []
        except Exception as e:
            logger.error(f"Error listing tasks: {e}")
            return []

    @staticmethod
    def get_task(task_id: str) -> Optional[Dict[str, Any]]:
        """Fetches a single task by ID with creator and assignee data."""
        supabase = get_supabase()
        if not supabase:
            return None
        try:
            res = supabase.table("tasks").select(
                "*, creator:created_by(id, email, full_name, avatar_url), assignee:assigned_to(id, email, full_name, avatar_url)"
            ).eq("id", task_id).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
            return None
        except Exception as e:
            logger.error(f"Error getting task {task_id}: {e}")
            return None

    @staticmethod
    def create_task(task_payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Inserts a new task and returns created record with joined profiles."""
        supabase = get_supabase()
        if not supabase:
            return None
        try:
            res = supabase.table("tasks").insert(task_payload).execute()
            if res.data and len(res.data) > 0:
                created_id = res.data[0]["id"]
                return SupabaseService.get_task(created_id)
            return None
        except Exception as e:
            logger.error(f"Error creating task: {e}")
            raise e

    @staticmethod
    def update_task(task_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Updates a task by ID."""
        supabase = get_supabase()
        if not supabase:
            return None
        try:
            res = supabase.table("tasks").update(updates).eq("id", task_id).execute()
            if res.data and len(res.data) > 0:
                return SupabaseService.get_task(task_id)
            return None
        except Exception as e:
            logger.error(f"Error updating task {task_id}: {e}")
            raise e

    @staticmethod
    def delete_task(task_id: str) -> bool:
        """Deletes a task by ID."""
        supabase = get_supabase()
        if not supabase:
            return False
        try:
            res = supabase.table("tasks").delete().eq("id", task_id).execute()
            return bool(res.data)
        except Exception as e:
            logger.error(f"Error deleting task {task_id}: {e}")
            return False

    @staticmethod
    def log_activity(task_id: str, actor_id: str, action_type: str, details: Dict[str, Any]):
        """Logs an activity event in public.task_activities."""
        supabase = get_supabase()
        if not supabase:
            return
        try:
            supabase.table("task_activities").insert({
                "task_id": task_id,
                "actor_id": actor_id,
                "action_type": action_type,
                "details": details
            }).execute()
        except Exception as e:
            logger.error(f"Failed to log task activity for {task_id}: {e}")

    @staticmethod
    def get_task_activities(task_id: str) -> List[Dict[str, Any]]:
        """Fetches activity timeline for a task."""
        supabase = get_supabase()
        if not supabase:
            return []
        try:
            res = supabase.table("task_activities").select(
                "*, actor:actor_id(id, email, full_name, avatar_url)"
            ).eq("task_id", task_id).order("created_at", desc=True).execute()
            return res.data or []
        except Exception as e:
            logger.error(f"Error fetching task activities for {task_id}: {e}")
            return []

    @staticmethod
    def get_metrics(user_id: str) -> Dict[str, Any]:
        """Calculates dashboard metrics."""
        supabase = get_supabase()
        if not supabase:
            return {}
        try:
            # Attempt to call postgres function or compute via queries
            tasks_res = supabase.table("tasks").select("id, status, priority, due_date, created_by, assigned_to").execute()
            all_tasks = tasks_res.data or []

            total = len(all_tasks)
            todo = sum(1 for t in all_tasks if t.get("status") == "todo")
            in_progress = sum(1 for t in all_tasks if t.get("status") == "in_progress")
            completed = sum(1 for t in all_tasks if t.get("status") == "completed")
            assigned_to_me = sum(1 for t in all_tasks if t.get("assigned_to") == user_id)
            created_by_me = sum(1 for t in all_tasks if t.get("created_by") == user_id)

            return {
                "total": total,
                "todo": todo,
                "in_progress": in_progress,
                "completed": completed,
                "assigned_to_me": assigned_to_me,
                "created_by_me": created_by_me
            }
        except Exception as e:
            logger.error(f"Error calculating metrics: {e}")
            return {"total": 0, "todo": 0, "in_progress": 0, "completed": 0, "assigned_to_me": 0, "created_by_me": 0}
