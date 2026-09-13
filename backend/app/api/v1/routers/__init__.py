from fastapi import APIRouter

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


@api_router.get("/health")
def v1_health() -> dict:
    return {"status": "ok", "service": "SupportIQ", "environment": "development", "debug": True}


__all__ = ["api_router"]
