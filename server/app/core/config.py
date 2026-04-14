from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional
import json

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/designh"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if not isinstance(value, str):
            return value

        url = value.strip()
        if url.startswith("postgres://"):
            url = f"postgresql://{url[len('postgres://') :]}"

        if url.startswith("postgresql://"):
            url = f"postgresql+asyncpg://{url[len('postgresql://') :]}"

        return url
    
    # JWT
    JWT_SECRET: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    
    # App
    APP_NAME: str = "Design Editor API"
    DEBUG: bool = True

    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001"
    ADMIN_EMAILS: str = ""

    def cors_origins_list(self) -> list[str]:
        raw = (self.CORS_ORIGINS or "").strip()
        if not raw:
            return []

        # Support either JSON list syntax or a simple comma-separated string.
        if raw.startswith("["):
            try:
                parsed = json.loads(raw)
                if isinstance(parsed, list):
                    return [str(origin).strip() for origin in parsed if str(origin).strip()]
            except json.JSONDecodeError:
                pass

        return [origin.strip() for origin in raw.split(",") if origin.strip()]

    def admin_emails_set(self) -> set[str]:
        raw = (self.ADMIN_EMAILS or "").strip()
        if not raw:
            return set()
        return {email.strip().lower() for email in raw.split(",") if email.strip()}
    
    # File Upload
    MAX_FILE_SIZE: int = 10485760  # 10MB
    UPLOAD_DIR: str = "uploads"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
