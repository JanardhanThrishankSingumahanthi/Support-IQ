from __future__ import annotations

import os
import shutil
import tempfile
from pathlib import Path
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# 1. Create a dedicated temporary directory and database file for pytest
TEST_DIR = tempfile.mkdtemp(prefix="supportiq_pytest_")
TEST_DB_PATH = Path(TEST_DIR) / "test_supportiq.db"
TEST_DB_URL = f"sqlite:///{TEST_DB_PATH.resolve().as_posix()}"

# Set DATABASE_URL environment variable BEFORE importing app or settings
os.environ["DATABASE_URL"] = TEST_DB_URL

from app.core.config import get_settings
get_settings.cache_clear()

from app.db.base import Base
from app.db.session import SessionLocal, create_db_engine
from app.db.init_db import initialize_database, seed_demo_data
from app.api.deps import get_db
from app.main import app

# Create test engine and bind SessionLocal to it
test_engine = create_engine(TEST_DB_URL, future=True, pool_pre_ping=True)
SessionLocal.configure(bind=test_engine)

# Initialize schema and seed data once for test suite
Base.metadata.create_all(bind=test_engine)
seed_demo_data()

# Override get_db FastAPI dependency so app routes use the isolated test database
def override_get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session", autouse=True)
def isolated_test_database():
    """Ensure the entire test suite operates against an isolated temporary SQLite database."""
    yield
    # Cleanup on session end
    try:
        test_engine.dispose()
        shutil.rmtree(TEST_DIR, ignore_errors=True)
    except Exception:
        pass
