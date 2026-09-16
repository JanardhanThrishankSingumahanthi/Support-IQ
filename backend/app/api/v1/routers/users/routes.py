from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Path as FastPath, Query, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, get_pagination, require_permission, require_role
from app.api.errors import not_implemented
from app.core.security import hash_password
from app.db.models import Role, User

router = APIRouter(prefix="/users", tags=["users"])


class UserCreateRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=255)
    role_name: str = "Support Agent"
    password: str = Field(default="temporary-password-123", min_length=8)


class UserUpdateRequest(BaseModel):
    full_name: str | None = Field(default=None, max_length=255)
    role_name: str | None = None
    is_active: bool | None = None


def serialize_user(user: User) -> dict[str, Any]:
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.name if user.role else "Viewer",
        "is_active": user.is_active,
        "is_superuser": user.is_superuser,
        "created_at": user.created_at.isoformat(),
        "updated_at": user.updated_at.isoformat(),
        "permissions": sorted([p.name for p in (user.role.permissions if user.role else [])]),
    }


@router.get("")
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    pagination: dict = Depends(get_pagination),
    email: str | None = Query(default=None),
    role: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    search: str | None = Query(default=None),
) -> dict[str, Any]:
    query = db.query(User)

    if email:
        query = query.filter(User.email.ilike(f"%{email.strip()}%"))
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if role:
        query = query.join(Role).filter(Role.name == role)
    if search:
        search_term = f"%{search.strip().lower()}%"
        query = query.filter((User.full_name.ilike(search_term)) | (User.email.ilike(search_term)))

    total = query.count()
    users = (
        query.order_by(User.id.asc())
        .offset((pagination["page"] - 1) * pagination["page_size"])
        .limit(pagination["page_size"])
        .all()
    )

    return {
        "status": "ok",
        "items": [serialize_user(u) for u in users],
        "meta": {
            "page": pagination["page"],
            "page_size": pagination["page_size"],
            "total": total,
            "has_next": (pagination["page"] * pagination["page_size"]) < total,
            "has_previous": pagination["page"] > 1,
        },
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("manage_users")),
) -> dict[str, Any]:
    normalized_email = payload.email.lower().strip()
    if db.query(User).filter(User.email == normalized_email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"status": "conflict", "message": f"User with email '{normalized_email}' already exists."},
        )

    role = db.query(Role).filter(Role.name == payload.role_name).first()
    if not role:
        role = db.query(Role).filter(Role.name == "Viewer").first()

    user = User(
        email=normalized_email,
        full_name=payload.full_name.strip(),
        password_hash=hash_password(payload.password),
        role_id=role.id if role else None,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "status": "ok",
        "message": "User created successfully.",
        "user": serialize_user(user),
    }


@router.get("/{user_id}")
def get_user(
    user_id: int = FastPath(..., gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"status": "not_found", "message": f"User with ID {user_id} was not found."},
        )
    return {"status": "ok", "user": serialize_user(user)}


@router.patch("/{user_id}")
def update_user(
    payload: UserUpdateRequest,
    user_id: int = FastPath(..., gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("manage_users")),
) -> dict[str, Any]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"status": "not_found", "message": f"User with ID {user_id} was not found."},
        )

    if payload.full_name is not None:
        user.full_name = payload.full_name.strip()
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.role_name is not None:
        role = db.query(Role).filter(Role.name == payload.role_name).first()
        if role:
            user.role_id = role.id

    db.commit()
    db.refresh(user)

    return {"status": "ok", "message": "User updated successfully.", "user": serialize_user(user)}
