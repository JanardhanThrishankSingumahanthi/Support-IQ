from __future__ import annotations

from fastapi import APIRouter, status

from app.api.errors import not_implemented
from app.api.schemas import ErrorResponse

router = APIRouter(prefix="/retrieval", tags=["retrieval"])


@router.get(
    "/search",
    status_code=status.HTTP_501_NOT_IMPLEMENTED,
    responses={501: {"model": ErrorResponse}},
)
def search_knowledge():
    raise not_implemented(
        "Retrieval search",
        "Retrieval is not implemented in this division. Use the retrieval service directly for evaluation and QA.",
    )
