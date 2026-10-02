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
    supportiq_data_dir: str | None = None
    supportiq_inference_url: str | None = None
    supportiq_inference_api_key: str | None = None
    supportiq_inference_timeout_seconds: float = 30.0
    database_url: str | None = None
    secret_key: str = "change-me-in-production"
    session_ttl_minutes: int = 480
    dev_admin_email: str = "dev-admin@example.com"
    dev_admin_password: str = "change-me-in-dev"

    @property
    def effective_database_url(self) -> str:
        if self.database_url:
            return self.database_url
        if self.supportiq_data_dir:
            data_dir = Path(self.supportiq_data_dir).resolve()
            data_dir.mkdir(parents=True, exist_ok=True)
            db_path = data_dir / "supportiq.db"
            return f"sqlite:///{db_path.as_posix()}"
        return f"sqlite:///{DEFAULT_DATABASE_PATH.as_posix()}"

    @property
    def document_storage_dir(self) -> Path:
        if self.supportiq_data_dir:
            storage = Path(self.supportiq_data_dir).resolve() / "storage" / "documents"
        else:
            storage = Path(__file__).resolve().parents[3] / "storage" / "documents"
        storage.mkdir(parents=True, exist_ok=True)
        return storage

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
