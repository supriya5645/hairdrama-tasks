import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Base application configuration loaded from environment variables."""
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")
    PORT = int(os.getenv("PORT", 5000))

    # Supabase Configuration
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # Gmail SMTP Configuration
    GMAIL_USER = os.getenv("GMAIL_USER", "")
    GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")
    SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
    EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "Hairdrama Tasks")

    # Frontend URL for CORS and email links
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
    ALLOWED_ORIGINS = [
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    # Allow extra origins if specified (comma-separated)
    extra_origins = os.getenv("ALLOWED_ORIGINS")
    if extra_origins:
        ALLOWED_ORIGINS.extend([origin.strip() for origin in extra_origins.split(",") if origin.strip()])

    @classmethod
    def validate(cls):
        """Validates critical environment configurations and prints warnings if missing."""
        missing = []
        if not cls.SUPABASE_URL:
            missing.append("SUPABASE_URL")
        if not cls.SUPABASE_KEY and not cls.SUPABASE_SERVICE_ROLE_KEY:
            missing.append("SUPABASE_KEY / SUPABASE_SERVICE_ROLE_KEY")

        if missing:
            print(f"[CONFIG WARNING] Missing required environment variables: {', '.join(missing)}")
        
        if not cls.GMAIL_USER or not cls.GMAIL_APP_PASSWORD:
            print("[CONFIG NOTE] Gmail SMTP credentials not set. Email notifications will run in mock/log mode.")
