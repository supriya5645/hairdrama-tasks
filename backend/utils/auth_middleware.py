from functools import wraps
from flask import request, jsonify, g
import logging
from extensions import get_supabase

logger = logging.getLogger(__name__)

def extract_token_from_header() -> str:
    """Extracts bearer token from Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header:
        return None
    parts = auth_header.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return None

def require_auth(f):
    """
    Decorator to protect Flask routes.
    Validates Supabase JWT access token and attaches user information to Flask's request context `g.current_user`.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = extract_token_from_header()
        if not token:
            return jsonify({
                "success": False,
                "error": "Unauthorized",
                "message": "Authorization Bearer token is missing."
            }), 401

        supabase = get_supabase()
        if not supabase:
            return jsonify({
                "success": False,
                "error": "ConfigurationError",
                "message": "Supabase client is not configured on backend."
            }), 500

        try:
            # Validate token using Supabase Auth
            user_response = supabase.auth.get_user(token)
            if not user_response or not user_response.user:
                return jsonify({
                    "success": False,
                    "error": "Unauthorized",
                    "message": "Invalid or expired access token."
                }), 401

            user = user_response.user
            # Attach to Flask context
            g.current_user = {
                "id": user.id,
                "email": user.email,
                "metadata": getattr(user, "user_metadata", {}) or {}
            }
        except Exception as e:
            logger.error(f"Token verification failed: {e}")
            return jsonify({
                "success": False,
                "error": "Unauthorized",
                "message": f"Authentication failed: {str(e)}"
            }), 401

        return f(*args, **kwargs)
    return decorated_function
