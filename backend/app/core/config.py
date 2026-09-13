from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]
DEFAULT_DATABASE_PATH = (BASE_DIR / "supportiq.db").resolve()


class Settings(BaseSettings):
    app_name: str = "SupportIQ"
    environment: str = "development"
    debug: bool = True
    api_prefix: str = "/api"
    frontend_url: str = "http://localhost:5173"
    database_url: str = f"sqlite:///{DEFAULT_DATABASE_PATH.as_posix()}"
    secret_key: str = "change-me-in-production"
    session_ttl_minutes: int = 30
    dev_admin_email: str = "dev-admin@example.com"
    dev_admin_password: str = "change-me-in-dev"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
