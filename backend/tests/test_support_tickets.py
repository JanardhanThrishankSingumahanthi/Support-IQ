from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def make_email(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:8]}@example.com"


def test_ticket_creation_and_escalation_workflow():
    email = make_email("support")
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Support Agent",
            "password": "StrongPass123!",
            "role_name": "Support Agent",
        },
    )
    assert register_response.status_code == 201
    token = register_response.json()["token"]

    create_response = client.post(
        "/api/v1/support-tickets",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "customer_name": "Alicia Gomez",
            "customer_email": "alicia@example.com",
            "subject": "Billing question",
            "description": "The user cannot access the invoice history page.",
            "category": "Billing",
            "priority": "High",
            "source": "chat",
            "context": {
                "question": "Why is my invoice history unavailable?",
                "answer": "The system has been updated and the invoice section should work.",
                "reliability": {"score": 0.32, "label": "low"},
                "escalation_reason": "insufficient_evidence",
            },
        },
    )
    assert create_response.status_code == 201, create_response.text
    ticket = create_response.json()
    assert ticket["status"] == "Open"
    assert ticket["customer_name"] == "Alicia Gomez"

    escalate_response = client.post(
        f"/api/v1/support-tickets/{ticket['id']}/escalate",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "reason": "insufficient_evidence",
            "conversation_id": 1,
            "question": "Why is my invoice history unavailable?",
            "answer": "The system has been updated and the invoice section should work.",
            "reliability": {"score": 0.32, "label": "low"},
            "evidence": [
                {"document_id": 1, "document_title": "Billing policy", "content": "Billing history is available after account verification."}
            ],
        },
    )
    assert escalate_response.status_code == 200, escalate_response.text
    escalated = escalate_response.json()
    assert escalated["status"] == "Escalated"
    assert escalated["reason"] == "insufficient_evidence"

    response = client.get(
        "/api/v1/support-tickets",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] >= 1

    patch_response = client.patch(
        f"/api/v1/support-tickets/{ticket['id']}",
        headers={"Authorization": f"Bearer {token}"},
        json={"status": "Resolved", "resolution_note": "Customer was guided through account verification. Issue resolved."},
    )
    assert patch_response.status_code == 200, patch_response.text
    assert patch_response.json()["status"] == "Resolved"
