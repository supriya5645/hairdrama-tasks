from .auth_routes import auth_bp
from .task_routes import tasks_bp
from .user_routes import users_bp
from .stat_routes import stats_bp
from .health_routes import health_bp

__all__ = ["auth_bp", "tasks_bp", "users_bp", "stats_bp", "health_bp"]
