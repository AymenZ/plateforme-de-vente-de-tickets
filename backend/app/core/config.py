import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:@localhost/eventdb")
SECRET_KEY = os.getenv("SECRET_KEY", "CHANGE_ME")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "").strip()
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "").strip()
STRIPE_CURRENCY = os.getenv("STRIPE_CURRENCY", "usd").strip().lower()
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173").strip()
BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://localhost:8000").strip()

GEMINI_API_KEY = (
	os.getenv("app.gemini.api-key")
	or os.getenv("APP_GEMINI_API_KEY")
	or ""
).strip()

GEMINI_API_KEY_NAME = (
	os.getenv("app.gemini.api-key-name")
	or os.getenv("APP_GEMINI_API_KEY_NAME")
	or ""
).strip()

GEMINI_PROJECT_NAME = (
	os.getenv("app.gemini.project-name")
	or os.getenv("APP_GEMINI_PROJECT_NAME")
	or ""
).strip()

GEMINI_PROJECT_NUMBER = (
	os.getenv("app.gemini.project-number")
	or os.getenv("APP_GEMINI_PROJECT_NUMBER")
	or ""
).strip()

GEMINI_MODEL = (
	os.getenv("app.gemini.model")
	or os.getenv("APP_GEMINI_MODEL")
	or "gemini-2.5-flash"
).strip() or "gemini-2.5-flash"

GEMINI_ENABLED = (
	(os.getenv("app.gemini.enabled") or os.getenv("APP_GEMINI_ENABLED") or "true")
	.strip()
	.lower()
	in {"1", "true", "yes", "on"}
)

GEMINI_ENDPOINT_BASE = (
	os.getenv("app.gemini.endpoint-base")
	or os.getenv("APP_GEMINI_ENDPOINT_BASE")
	or "https://generativelanguage.googleapis.com/v1beta/models"
).strip().rstrip("/")
