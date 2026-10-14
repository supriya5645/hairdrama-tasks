import logging
from supabase import create_client, Client
from config import Config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

supabase_client: Client = None

def init_supabase() -> Client:
    """Initializes and returns the Supabase client."""
    global supabase_client
    if not Config.SUPABASE_URL:
        logger.warning("SUPABASE_URL is not configured yet.")
        return None

    # Prefer SERVICE_ROLE_KEY for administrative backend operations if available, else anon key
    key = Config.SUPABASE_SERVICE_ROLE_KEY or Config.SUPABASE_KEY
    if not key:
        logger.warning("Neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_KEY is configured.")
        return None

    try:
        supabase_client = create_client(Config.SUPABASE_URL, key)
        logger.info("Supabase client initialized successfully.")
        return supabase_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None

def get_supabase() -> Client:
    """Returns the initialized Supabase client."""
    global supabase_client
    if supabase_client is None:
        supabase_client = init_supabase()
    return supabase_client
