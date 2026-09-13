from __future__ import annotations

from datetime import timedelta
from uuid import uuid4

from fastapi.testclient import TestClient

from app.db.models import Session
from app.db.session import SessionLocal
from app.main import app

client = TestClient(app)


def make_email(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:8]}@example.com"


def test_valid_login_and_protected_endpoint():
    email = make_email("login")
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Login User",
            "password": "StrongPass123!",
            "role_name": "Viewer",
        },
    )
    assert register_response.status_code == 201
    payload = register_response.json()
    assert payload["user"]["email"] == email
    assert "token" in payload

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "StrongPass123!"},
    )
    assert login_response.status_code == 200
    token = login_response.json()["token"]

    me_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_response.status_code == 200
    assert me_response.json()["email"] == email


def test_invalid_login_and_unauthorized_access():
    email = make_email("invalid")
    client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Invalid User",
            "password": "StrongPass123!",
            "role_name": "Viewer",
        },
    )

    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "WrongPassword!"},
    )
    assert response.status_code == 401
    payload = response.json()
    assert payload["status"] == "invalid_credentials"

    protected_response = client.get("/api/v1/auth/admin-check")
    assert protected_response.status_code == 401
    assert protected_response.json()["status"] == "unauthorized"


def test_role_permissions_and_logout():
    admin_email = make_email("admin")
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": admin_email,
            "full_name": "Admin User",
            "password": "StrongPass123!",
            "role_name": "Administrator",
        },
    )
    assert register_response.status_code == 201
    admin_token = register_response.json()["token"]

    admin_check = client.get(
        "/api/v1/auth/admin-check",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert admin_check.status_code == 200

    permission_check = client.get(
        "/api/v1/auth/permission-check",
        params={"permission": "manage_users"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert permission_check.status_code == 200

    logout_response = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert logout_response.status_code == 200
    assert logout_response.json()["status"] == "ok"

    me_after_logout = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert me_after_logout.status_code == 401
    assert me_after_logout.json()["status"] == "unauthorized"


def test_expired_session_is_rejected():
    email = make_email("expired")
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Expired User",
            "password": "StrongPass123!",
            "role_name": "Viewer",
        },
    )
    token = register_response.json()["token"]

    with SessionLocal() as session:
        db_session = session.query(Session).filter_by(token_hash=__import__("hashlib").sha256(token.encode()).hexdigest()).first()
        if db_session is not None:
            db_session.expires_at = db_session.expires_at - timedelta(minutes=30)
            session.commit()

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 401
    assert response.json()["status"] == "session_expired"
