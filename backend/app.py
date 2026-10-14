import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from extensions import init_supabase
from routes import auth_bp, tasks_bp, users_bp, stats_bp, health_bp

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

def create_app():
    """Application factory for Flask task management API."""
    app = Flask(__name__)
    app.config.from_object(Config)

    # Validate config
    Config.validate()

    # Initialize Supabase client
    init_supabase()

    # Configure CORS for Next.js frontend
    CORS(
        app,
        resources={r"/api/*": {"origins": "*"}}, # Allows Next.js frontend locally and on Vercel
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization", "Accept"],
        methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"]
    )

    # Register blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(stats_bp)

    # Root route
    @app.route("/", methods=["GET"])
    def root():
        return jsonify({
            "name": "Hairdrama Task Management API",
            "status": "operational",
            "version": "1.0.0",
            "docs": "/api/health"
        })

    # Global Error Handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "error": "NotFound", "message": "The requested endpoint does not exist."}), 404

    @app.errorhandler(500)
    def internal_error(e):
        logger.error(f"Internal server error: {e}")
        return jsonify({"success": False, "error": "InternalServerError", "message": "An internal server error occurred."}), 500

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = Config.DEBUG
    logger.info(f"Starting Hairdrama Flask server on port {port} (debug={debug})...")
    app.run(host="0.0.0.0", port=port, debug=debug)
