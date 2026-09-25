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


def test_download_document_workflow():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Fetch document list to find an existing document ID
    docs_res = client.get("/api/v1/documents", headers=headers)
    assert docs_res.status_code == 200
    docs = docs_res.json()["items"]
    assert len(docs) > 0

    target_doc = docs[0]
    doc_id = target_doc["id"]

    # 2. Download existing document
    download_res = client.get(f"/api/v1/documents/{doc_id}/download", headers=headers)
    assert download_res.status_code == 200
    assert len(download_res.content) > 0
    assert "Content-Disposition" in download_res.headers
    assert "filename" in download_res.headers["Content-Disposition"]

    # 3. Test non-existent document ID -> 404
    non_existent = client.get("/api/v1/documents/999999/download", headers=headers)
    assert non_existent.status_code == 404

    # 4. Test unauthorized access without token -> 401
    unauth = client.get(f"/api/v1/documents/{doc_id}/download")
    assert unauth.status_code == 401
