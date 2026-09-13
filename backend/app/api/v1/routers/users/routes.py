from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_db, get_pagination
from app.api.errors import not_implemented
from app.api.schemas import ErrorResponse, PaginatedResponse, NoteResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=NoteResponse, status_code=status.HTTP_501_NOT_IMPLEMENTED, responses={501: {"model": ErrorResponse}})
def list_users(
    db=Depends(get_db),
    pagination: dict = Depends(get_pagination),
    email: str | None = Query(default=None),
    role: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
):
    raise not_implemented("User listing", "User management is not implemented yet in this division.")


@router.get("/{user_id}", response_model=NoteResponse, status_code=status.HTTP_501_NOT_IMPLEMENTED, responses={501: {"model": ErrorResponse}})
def get_user(user_id: int, db=Depends(get_db)):
    raise not_implemented("User retrieval", f"User {user_id} is not implemented yet.")
