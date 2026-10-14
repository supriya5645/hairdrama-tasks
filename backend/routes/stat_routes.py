from flask import Blueprint, jsonify, g
from utils.auth_middleware import require_auth
from services.supabase_service import SupabaseService

stats_bp = Blueprint("stats", __name__, url_prefix="/api/stats")

@stats_bp.route("", methods=["GET"])
@require_auth
def get_stats():
    """Returns analytics dashboard metrics for the logged-in user."""
    user_id = g.current_user["id"]
    metrics = SupabaseService.get_metrics(user_id)
    return jsonify({
        "success": True,
        "metrics": metrics
    }), 200
