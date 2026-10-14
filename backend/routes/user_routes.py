from flask import Blueprint, jsonify
from utils.auth_middleware import require_auth
from services.supabase_service import SupabaseService
import logging

logger = logging.getLogger(__name__)
users_bp = Blueprint("users", __name__, url_prefix="/api/users")

@users_bp.route("", methods=["GET"])
@require_auth
def get_users():
    """
    Returns the list of all registered team member profiles
    so that tasks can be assigned to other users.
    """
    profiles = SupabaseService.list_profiles()
    return jsonify({
        "success": True,
        "count": len(profiles),
        "users": profiles
    }), 200
