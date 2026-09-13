from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, get_pagination
from app.api.schemas import ErrorResponse
from app.db.models import Claim, Evidence, User
from app.retrieval.service import RetrievalService

router = APIRouter(prefix="/evidence", tags=["evidence"])


class GroundingRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    answer: str = Field(min_length=1, max_length=12000)
    top_k: int = Field(default=5, ge=1, le=20)


@router.get("")
def list_evidence(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    pagination: dict = Depends(get_pagination),
    source: str | None = Query(default=None),
):
    records = db.query(Evidence).join(Claim).filter(Claim.conversation_id.isnot(None)).all()
    if source:
        records = [item for item in records if item.document and item.document.title.lower().find(source.lower()) >= 0]

    start = (pagination["page"] - 1) * pagination["page_size"]
    end = start + pagination["page_size"]
    return {
        "status": "ok",
        "message": "Evidence records retrieved.",
        "feature": "evidence",
        "items": [
            {
                "id": item.id,
                "claim_id": item.claim_id,
                "document_id": item.document_id,
                "chunk_id": item.chunk_id,
                "evidence_text": item.evidence_text,
                "score": item.score,
            }
            for item in records[start:end]
        ],
        "total": len(records),
    }


@router.post("/grounding")
def analyze_grounding(
    payload: GroundingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    normalized_query = payload.query.strip()
    if not normalized_query:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"status": "empty_query", "message": "A query is required."})

    report = RetrievalService(db=db, user_id=current_user.id).analyze_answer_grounding(
        query=normalized_query,
        answer=payload.answer.strip(),
        top_k=payload.top_k,
    )
    return {
        "status": "ok",
        "message": "Grounding analysis completed.",
        "feature": "grounding",
        **report,
    }
