from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_db, get_pagination
from app.api.errors import not_implemented
from app.api.schemas import ErrorResponse, NoteResponse

router = APIRouter(prefix="/knowledge-base", tags=["knowledge-base"])


@router.get("", response_model=NoteResponse, status_code=status.HTTP_501_NOT_IMPLEMENTED, responses={501: {"model": ErrorResponse}})
def list_knowledge_base(
    db=Depends(get_db),
    pagination: dict = Depends(get_pagination),
    category: str | None = Query(default=None),
):
    raise not_implemented("Knowledge base listing", "knowledge base management is not implemented yet.")


@router.post("", response_model=NoteResponse, status_code=status.HTTP_501_NOT_IMPLEMENTED, responses={501: {"model": ErrorResponse}})
def create_knowledge_entry():
    raise not_implemented("Knowledge base creation", "knowledge base creation is not implemented yet.")
