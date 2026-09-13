from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.errors import NotImplementedErrorResponse
from app.api.v1 import api_router
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.db.base import Base
from app.db.init_db import ensure_roles_and_permissions, initialize_database, seed_demo_data
from app.db.session import SessionLocal, create_db_engine

settings = get_settings()
logger = configure_logging()

app = FastAPI(title=settings.app_name, version="0.1.0")

# Ensure the SQLite schema exists before the first request is served, even in tests.
initialize_database()


@app.on_event("startup")
def startup_event() -> None:
    initialize_database()
    with SessionLocal() as session:
        ensure_roles_and_permissions(session)
        session.commit()
    seed_demo_data()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, dict):
        payload = detail
    else:
        payload = {"status": "error", "message": str(detail)}
    return JSONResponse(status_code=exc.status_code, content=payload)


@app.exception_handler(NotImplementedErrorResponse)
async def not_implemented_handler(request: Request, exc: NotImplementedErrorResponse):
    return JSONResponse(status_code=exc.status_code, content=exc.detail)


app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
def health() -> dict:
    logger.info("Health check requested")
    return {
        "status": "ok",
        "service": settings.app_name,
        "environment": settings.environment,
        "debug": settings.debug,
    }


@app.get("/api/health")
def api_health() -> dict:
    return health()
