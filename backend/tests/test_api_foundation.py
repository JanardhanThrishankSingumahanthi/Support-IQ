from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_openapi_exposes_api_modules():
    response = client.get("/openapi.json")
    assert response.status_code == 200
    data = response.json()
    paths = data["paths"]
    assert "/api/v1/auth/status" in paths
    assert "/api/v1/users" in paths
    assert "/api/v1/conversations" in paths
    assert "/api/v1/chat/messages" in paths
    assert "/api/v1/documents" in paths
    assert "/api/v1/documents/{document_id}" in paths
    assert "/api/v1/knowledge-base" in paths
    assert "/api/v1/retrieval/search" in paths


def test_not_implemented_routes_return_honest_state():
    response = client.get("/api/v1/auth/status")
    assert response.status_code == 501
    payload = response.json()
    assert payload["status"] == "not_implemented"
    assert "message" in payload

    # retrieval/search is now implemented and requires authentication
    response = client.get("/api/v1/retrieval/search")
    assert response.status_code == 401


def test_api_health_and_v1_prefix_are_available():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
