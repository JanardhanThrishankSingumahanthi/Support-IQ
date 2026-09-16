from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app

client = TestClient(app)
settings = get_settings()


def get_auth_token():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": settings.dev_admin_email, "password": settings.dev_admin_password},
    )
    assert response.status_code == 200
    return response.json()["token"]


def test_grounded_chat_pipeline():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Ask question related to refund policy
    response = client.post(
        "/api/v1/chat/messages",
        json={"content": "What is the refund policy for annual subscription?", "use_knowledge_base": True},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "assistant_message" in data
    assert len(data["assistant_message"]["content"]) > 10
    assert data["generation_status"] in ["resolved", "low_confidence", "no_evidence"]


def test_knowledge_base_stats_endpoint():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/v1/knowledge-base/stats", headers=headers)
    assert response.status_code == 200
    stats = response.json()
    assert stats["status"] == "ok"
    assert "total_documents" in stats
    assert "indexed_documents" in stats
    assert "storage_used_mb" in stats


def test_users_listing_endpoint():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/v1/users", headers=headers)
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert len(payload["items"]) > 0
