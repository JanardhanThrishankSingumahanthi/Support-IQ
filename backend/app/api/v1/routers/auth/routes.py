from datetime import timedelta

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_permission, require_role
from app.api.errors import not_implemented
from app.api.schemas import EmptyResponse, ErrorResponse, NoteResponse
from app.core.config import get_settings
from app.core.security import generate_token, hash_password, hash_token, session_expiration, verify_password
from app.db.init_db import ensure_roles_and_permissions
from app.db.models import Role, Session as UserSession, User

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=8)
    role_name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(min_length=8)
    new_password: str = Field(min_length=8)


def user_payload(user: User) -> dict:
    permissions = sorted({permission.name for permission in (user.role.permissions if user.role else [])})
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.name if user.role else None,
        "permissions": permissions,
        "is_active": user.is_active,
    }


def create_session_for_user(db: Session, user: User) -> str:
    ttl_minutes = get_settings().session_ttl_minutes
    token = generate_token(36)
    db.add(
        UserSession(
            user_id=user.id,
            token_hash=hash_token(token),
            expires_at=session_expiration(ttl_minutes),
            refresh_token_hash=None,
            is_valid=True,
        )
    )
    db.commit()
    return token


@router.get("/status", response_model=NoteResponse, status_code=status.HTTP_501_NOT_IMPLEMENTED, responses={501: {"model": ErrorResponse}})
def auth_status(
    db=Depends(get_db),
    include_details: bool = Query(default=False),
):
    raise not_implemented("Authentication", "Authentication is implemented in Division 4.")


@router.get("/health", response_model=EmptyResponse, status_code=status.HTTP_200_OK)
def auth_health():
    return {"status": "ok", "message": "Authentication service is available in Division 4."}


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    normalized_email = payload.email.lower()
    ensure_roles_and_permissions(db)

    if db.query(User).filter(User.email == normalized_email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"status": "email_taken", "message": "An account with this email already exists."},
        )

    role_name = payload.role_name or "Viewer"
    role = db.query(Role).filter(Role.name == role_name).first()
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"status": "invalid_role", "message": f"Role '{role_name}' is not recognized."},
        )

    user = User(
        email=normalized_email,
        full_name=payload.full_name.strip(),
        password_hash=hash_password(payload.password),
        role_id=role.id,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_session_for_user(db, user)
    return {
        "status": "ok",
        "message": "Registration successful.",
        "token": token,
        "expires_in_minutes": get_settings().session_ttl_minutes,
        "user": user_payload(user),
    }


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    normalized_email = payload.email.lower()
    user = db.query(User).filter(User.email == normalized_email).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"status": "invalid_credentials", "message": "The email or password is incorrect."},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"status": "account_disabled", "message": "This account is disabled."},
        )

    token = create_session_for_user(db, user)
    return {
        "status": "ok",
        "message": "Login successful.",
        "token": token,
        "expires_in_minutes": get_settings().session_ttl_minutes,
        "user": user_payload(user),
    }


@router.post("/logout")
def logout(
    authorization: str | None = Header(default=None, alias="Authorization"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"status": "unauthorized", "message": "Authentication token is missing or invalid."},
        )

    token = authorization.split(" ", 1)[1].strip()
    if token:
        session = db.query(UserSession).filter_by(token_hash=hash_token(token)).first()
        if session is not None:
            session.is_valid = False
            db.commit()

    return {"status": "ok", "message": "Logout successful."}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.refresh(current_user)
    return {
        "status": "ok",
        "email": current_user.email,
        "user": user_payload(current_user),
    }


@router.post("/password-change")
def change_password(
    payload: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"status": "invalid_credentials", "message": "The current password is incorrect."},
        )

    current_user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"status": "ok", "message": "Password updated successfully."}


@router.get("/admin-check")
def admin_check(current_user: User = Depends(require_role("Administrator"))):
    return {"status": "ok", "message": "Access granted.", "role": current_user.role.name if current_user.role else None}


@router.get("/permission-check")
def permission_check(
    permission: str,
    current_user: User = Depends(require_permission("manage_users")),
):
    return {
        "status": "ok",
        "message": f"Permission '{permission}' check passed.",
        "role": current_user.role.name if current_user.role else None,
    }


@router.get("/session-status")
def session_status(current_user: User = Depends(get_current_user)):
    return {"status": "ok", "message": "Session is active.", "user": user_payload(current_user)}
