from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.errors import NotImplementedErrorResponse
from app.api.v1 import api_router
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.db.base import Base
from app.db.init_db import ensure_roles_and_permissions, initialize_database, seed_demo_data
from app.db.session import SessionLocal, create_db_engine

settings = get_settings()
logger = configure_logging()

# Ensure the SQLite schema exists before the first request is served, even in tests.
initialize_database()


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    with SessionLocal() as session:
        ensure_roles_and_permissions(session)
        session.commit()
    seed_demo_data()
    yield


app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
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


FRONTEND_DIST = (Path(__file__).resolve().parents[2] / "frontend" / "dist").resolve()

# Mount frontend /assets if the directory exists
if (FRONTEND_DIST / "assets").exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_spa(full_path: str):
    # Never intercept API calls
    if full_path.startswith("api/") or full_path == "api":
        raise HTTPException(
            status_code=404,
            detail={"status": "not_found", "message": f"API endpoint '/{full_path}' was not found."},
        )

    # Serve static assets in dist (e.g. favicon.svg, icons.svg)
    if full_path:
        requested_file = FRONTEND_DIST / full_path
        if requested_file.is_file():
            return FileResponse(requested_file)

    # SPA fallback for root and all client-side routes (/chat, /tickets, /login, etc.)
    index_file = FRONTEND_DIST / "index.html"
    if index_file.is_file():
        return FileResponse(index_file)

    raise HTTPException(status_code=404, detail="Frontend build index.html not found. Please run 'npm run build'.")
