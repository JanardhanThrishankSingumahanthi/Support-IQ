from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.db.models import User
from app.retrieval.service import RetrievalService

router = APIRouter(prefix="/retrieval", tags=["retrieval"])


@router.get("/search")
def search_knowledge(
    q: str = Query(..., min_length=1, max_length=2000, alias="q"),
    top_k: int = Query(default=5, ge=1, le=20),
    method: str = Query(default="hybrid"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    cleaned_query = q.strip()
    if not cleaned_query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"status": "empty_query", "message": "Search query cannot be empty."},
        )

    service = RetrievalService(db=db, user_id=current_user.id)
    results = service.retrieve(query=cleaned_query, top_k=top_k, retrieval_method=method)

    return {
        "status": "ok",
        "query": cleaned_query,
        "method": method,
        "top_k": top_k,
        "items": results,
        "total": len(results),
    }
