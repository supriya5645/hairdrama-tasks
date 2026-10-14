from flask import Blueprint, jsonify
from config import Config
from extensions import get_supabase
from services.email_service import EmailService

health_bp = Blueprint("health", __name__, url_prefix="/api")

@health_bp.route("/health", methods=["GET"])
def health_check():
    """Application health and configuration status check."""
    supabase = get_supabase()
    db_status = "connected" if supabase is not None else "not_configured"
    email_status = "configured" if EmailService.is_configured() else "mock_mode"

    return jsonify({
        "status": "healthy",
        "service": "Hairdrama Task Management API",
        "environment": Config.FLASK_ENV,
        "database": db_status,
        "gmail_integration": email_status
    }), 200
