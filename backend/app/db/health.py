from sqlalchemy import text

from app.db.session import SessionLocal


def check_database_health() -> dict:
    try:
        with SessionLocal() as session:
            session.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as exc:  # pragma: no cover - defensive path
        return {"status": "unhealthy", "database": "disconnected", "error": str(exc)}
