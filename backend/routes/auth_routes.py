from flask import Blueprint, jsonify, request, g
from utils.auth_middleware import require_auth
from services.supabase_service import SupabaseService
import logging

logger = logging.getLogger(__name__)
auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/sync", methods=["POST"])
@require_auth
def sync_user():
    """
    Synchronizes the logged-in Google OAuth user to public.profiles.
    Frontend calls this upon successful Google OAuth callback.
    """
    user_id = g.current_user["id"]
    email = g.current_user["email"]
    meta = g.current_user.get("metadata", {}) or {}

    full_name = meta.get("full_name") or meta.get("name") or email.split("@")[0]
    avatar_url = meta.get("avatar_url") or meta.get("picture") or ""

    profile = SupabaseService.upsert_profile(
        user_id=user_id,
        email=email,
        full_name=full_name,
        avatar_url=avatar_url
    )

    return jsonify({
        "success": True,
        "profile": profile,
        "message": "User profile synchronized successfully."
    }), 200

@auth_bp.route("/me", methods=["GET"])
@require_auth
def get_me():
    """Returns current user details and profile."""
    user_id = g.current_user["id"]
    profile = SupabaseService.get_profile(user_id)
    return jsonify({
        "success": True,
        "user": g.current_user,
        "profile": profile
    }), 200
