from fastapi import APIRouter

from app.api.v1.routers.analytics.routes import router as analytics_router
from app.api.v1.routers.auth.routes import router as auth_router
from app.api.v1.routers.chat.routes import router as chat_router
from app.api.v1.routers.conversations.routes import router as conversations_router
from app.api.v1.routers.documents.routes import router as documents_router
from app.api.v1.routers.evidence.routes import router as evidence_router
from app.api.v1.routers.experiments.routes import router as experiments_router
from app.api.v1.routers.knowledge_base.routes import router as knowledge_base_router
from app.api.v1.routers.retrieval.routes import router as retrieval_router
from app.api.v1.routers.support_tickets.routes import router as support_tickets_router
from app.api.v1.routers.users.routes import router as users_router

api_router = APIRouter()
api_router.include_router(analytics_router)
api_router.include_router(auth_router)
api_router.include_router(chat_router)
api_router.include_router(conversations_router)
api_router.include_router(documents_router)
api_router.include_router(evidence_router)
api_router.include_router(experiments_router)
api_router.include_router(knowledge_base_router)
api_router.include_router(retrieval_router)
api_router.include_router(support_tickets_router)
api_router.include_router(users_router)


from fastapi import Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.config import get_settings


@api_router.get("/health")
def v1_health(db: Session = Depends(get_db)) -> dict:
    # 1. Database check
    db_status = "ok"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    # 2. Model runtime check
    try:
        from app.services.model_runtime import get_model_runtime
        runtime = get_model_runtime()
        device = runtime._device
        cuda_available = runtime._is_cuda_available()
        models = runtime.get_models_metadata()
        active_models = [m["id"] for m in models if m.get("available")]
        model_status = "ready" if active_models else "unavailable"
    except Exception as e:
        device = "unknown"
        cuda_available = False
        active_models = []
        model_status = f"unavailable: {str(e)}"

    overall_status = "ok" if db_status == "ok" else "degraded"

    return {
        "status": overall_status,
        "service": "SupportIQ",
        "environment": get_settings().environment,
        "database": db_status,
        "device": device,
        "cuda_available": cuda_available,
        "model_status": model_status,
        "available_models": active_models,
    }


__all__ = ["api_router"]
