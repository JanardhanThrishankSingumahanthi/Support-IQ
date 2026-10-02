from __future__ import annotations

from uuid import uuid4
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.db.models import User
from app.db.session import SessionLocal
from app.main import app

client = TestClient(app)
settings = get_settings()


def make_email(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:8]}@example.com"


def test_valid_registration_with_customer_role_succeeds():
    email = make_email("customer")
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Alice Customer",
            "password": "SecurePassword2026!",
            "role_name": "Customer",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "ok"
    assert data["user"]["email"] == email
    assert data["user"]["full_name"] == "Alice Customer"
    assert data["user"]["role"] == "Customer"
    assert "password" not in data["user"]
    assert "password_hash" not in data["user"]
    assert "token" in data


def test_password_is_hashed_and_never_stored_plaintext():
    email = make_email("hashcheck")
    raw_password = "PlaintextPassword2026!"
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Hash Check",
            "password": raw_password,
            "role_name": "Customer",
        },
    )
    assert response.status_code == 201

    with SessionLocal() as session:
        user = session.query(User).filter_by(email=email).first()
        assert user is not None
        assert user.password_hash is not None
        # Must be hashed with PBKDF2
        assert user.password_hash.startswith("pbkdf2_sha256$200000$")
        # Plaintext password must NOT appear anywhere in the database record
        assert raw_password not in user.password_hash


def test_newly_registered_customer_can_log_in():
    email = make_email("loginuser")
    password = "CustomerLogin2026!"
    reg_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Login Customer",
            "password": password,
            "role_name": "Customer",
        },
    )
    assert reg_response.status_code == 201

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert login_data["status"] == "ok"
    assert login_data["user"]["email"] == email
    assert login_data["user"]["role"] == "Customer"
    assert "token" in login_data

    # Verify authenticated session with /me
    me_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {login_data['token']}"},
    )
    assert me_response.status_code == 200
    assert me_response.json()["user"]["email"] == email


def test_existing_seeded_users_can_still_log_in():
    # 1. Dev Admin
    dev_admin_res = client.post(
        "/api/v1/auth/login",
        json={"email": settings.dev_admin_email, "password": settings.dev_admin_password},
    )
    assert dev_admin_res.status_code == 200
    assert dev_admin_res.json()["user"]["role"] == "Administrator"

    # 2. Janardhan Admin
    janardhan_res = client.post(
        "/api/v1/auth/login",
        json={"email": "janardhan@supportiq.com", "password": "SupportIQ2026!"},
    )
    assert janardhan_res.status_code == 200
    assert janardhan_res.json()["user"]["role"] == "Administrator"

    # 3. Priya Support Agent
    priya_res = client.post(
        "/api/v1/auth/login",
        json={"email": "priya@supportiq.com", "password": "SupportIQ2026!"},
    )
    assert priya_res.status_code == 200
    assert priya_res.json()["user"]["role"] == "Support Agent"


def test_duplicate_email_registration_fails():
    email = make_email("duplicate")
    reg1 = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Original User",
            "password": "Password123!",
            "role_name": "Customer",
        },
    )
    assert reg1.status_code == 201

    reg2 = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Duplicate User",
            "password": "Password456!",
            "role_name": "Customer",
        },
    )
    assert reg2.status_code == 409
    data = reg2.json()
    status_val = data.get("status") or data.get("detail", {}).get("status")
    assert status_val == "email_taken"
    msg = data.get("message") or data.get("detail", {}).get("message") or ""
    assert "already exists" in msg


def test_invalid_email_registration_fails():
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "not-a-valid-email",
            "full_name": "Invalid Email User",
            "password": "Password123!",
        },
    )
    assert response.status_code == 422


def test_weak_password_registration_fails():
    email = make_email("weakpass")
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Weak Pass User",
            "password": "short",
        },
    )
    # Pydantic validates min_length=8 and returns 422
    assert response.status_code in [400, 422]


def test_empty_full_name_registration_fails():
    email = make_email("blankname")
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "   ",
            "password": "Password123!",
        },
    )
    assert response.status_code in [400, 422]


def test_unauthorized_user_cannot_register_as_administrator():
    email = make_email("unauthorized_admin")
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Malicious User",
            "password": "Password123!",
            "role_name": "Administrator",
        },
    )
    assert response.status_code == 403
    data = response.json()
    status_val = data.get("status") or data.get("detail", {}).get("status")
    assert status_val == "forbidden"
    msg = data.get("message") or data.get("detail", {}).get("message") or ""
    assert "not permitted" in msg
