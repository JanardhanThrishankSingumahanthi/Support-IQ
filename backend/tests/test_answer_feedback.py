from __future__ import annotations

from uuid import uuid4
from fastapi.testclient import TestClient

from app.db.models import Conversation, Message, User
from app.db.session import SessionLocal
from app.main import app

client = TestClient(app)


def make_email(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:8]}@example.com"


def register_and_get_token(role: str = "Customer", prefix: str = "user") -> tuple[str, int]:
    email = make_email(prefix)
    res = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": f"{prefix.capitalize()} User",
            "password": "Password123!",
            "role_name": role,
        },
    )
    assert res.status_code == 201, res.text
    data = res.json()
    return data["token"], data["user"]["id"]


def create_test_conversation_and_messages(user_id: int) -> tuple[int, int, int]:
    """Helper to create a conversation with a user query and assistant response."""
    with SessionLocal() as db:
        conv = Conversation(user_id=user_id, title="Test Conversation", state="open")
        db.add(conv)
        db.commit()
        db.refresh(conv)

        user_msg = Message(
            conversation_id=conv.id,
            role="user",
            content="What is the refund policy?",
            metadata_json={},
        )
        db.add(user_msg)
        db.commit()
        db.refresh(user_msg)

        asst_msg = Message(
            conversation_id=conv.id,
            role="assistant",
            content="Refunds are granted within 30 days of purchase per policy.",
            metadata_json={"status": "resolved", "model": "SupportIQ QLoRA (4-bit NF4)"},
        )
        db.add(asst_msg)
        db.commit()
        db.refresh(asst_msg)

        return conv.id, user_msg.id, asst_msg.id


def test_positive_feedback_creation():
    token, user_id = register_and_get_token(role="Customer", prefix="pos")
    _, _, asst_msg_id = create_test_conversation_and_messages(user_id)

    res = client.post(
        "/api/v1/feedback",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "message_id": asst_msg_id,
            "feedback_type": "positive",
            "comment": "Very accurate answer!",
        },
    )
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["status"] == "created"
    assert data["feedback"]["feedback_type"] == "positive"
    assert data["feedback"]["message_id"] == asst_msg_id
    assert data["feedback"]["comment"] == "Very accurate answer!"


def test_negative_feedback_creation_with_valid_reason():
    token, user_id = register_and_get_token(role="Customer", prefix="neg")
    _, _, asst_msg_id = create_test_conversation_and_messages(user_id)

    res = client.post(
        "/api/v1/feedback",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "message_id": asst_msg_id,
            "feedback_type": "negative",
            "reason": "Answer is incomplete",
            "comment": "Did not mention annual plan rules.",
        },
    )
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["status"] == "created"
    assert data["feedback"]["feedback_type"] == "negative"
    assert data["feedback"]["reason"] == "Answer is incomplete"
    assert data["feedback"]["comment"] == "Did not mention annual plan rules."


def test_invalid_feedback_type_rejected():
    token, user_id = register_and_get_token(role="Customer", prefix="inv_type")
    _, _, asst_msg_id = create_test_conversation_and_messages(user_id)

    res = client.post(
        "/api/v1/feedback",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "message_id": asst_msg_id,
            "feedback_type": "super_good",
        },
    )
    assert res.status_code == 400
    assert "feedback_type" in str(res.json()).lower()


def test_invalid_negative_reason_rejected():
    token, user_id = register_and_get_token(role="Customer", prefix="inv_rsn")
    _, _, asst_msg_id = create_test_conversation_and_messages(user_id)

    res = client.post(
        "/api/v1/feedback",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "message_id": asst_msg_id,
            "feedback_type": "negative",
            "reason": "Random non-standard reason not in allowed list",
        },
    )
    assert res.status_code == 400
    assert "invalid negative feedback reason" in str(res.json()).lower()


def test_unauthorized_feedback_rejected():
    res = client.post(
        "/api/v1/feedback",
        json={"message_id": 1, "feedback_type": "positive"},
    )
    assert res.status_code in [401, 403]


def test_user_cannot_submit_feedback_for_another_users_message():
    token_a, user_a_id = register_and_get_token(role="Customer", prefix="usera")
    token_b, _ = register_and_get_token(role="Customer", prefix="userb")

    _, _, asst_msg_id_a = create_test_conversation_and_messages(user_a_id)

    # User B tries to submit feedback for User A's assistant message
    res = client.post(
        "/api/v1/feedback",
        headers={"Authorization": f"Bearer {token_b}"},
        json={
            "message_id": asst_msg_id_a,
            "feedback_type": "negative",
            "reason": "Answer is incorrect",
        },
    )
    assert res.status_code == 403, res.text
    assert "not authorized" in str(res.json()).lower()


def test_duplicate_submission_updates_existing_feedback():
    token, user_id = register_and_get_token(role="Customer", prefix="dup")
    _, _, asst_msg_id = create_test_conversation_and_messages(user_id)

    # 1. First submission: positive
    res1 = client.post(
        "/api/v1/feedback",
        headers={"Authorization": f"Bearer {token}"},
        json={"message_id": asst_msg_id, "feedback_type": "positive"},
    )
    assert res1.status_code == 201
    feedback_id_1 = res1.json()["feedback"]["id"]

    # 2. Second submission: user changes mind to negative
    res2 = client.post(
        "/api/v1/feedback",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "message_id": asst_msg_id,
            "feedback_type": "negative",
            "reason": "Citation is incorrect",
            "comment": "Page cited was wrong.",
        },
    )
    assert res2.status_code == 201
    data2 = res2.json()
    assert data2["status"] == "updated"
    assert data2["feedback"]["id"] == feedback_id_1
    assert data2["feedback"]["feedback_type"] == "negative"
    assert data2["feedback"]["reason"] == "Citation is incorrect"


def test_feedback_retrieval_and_deletion():
    token, user_id = register_and_get_token(role="Customer", prefix="retr")
    conv_id, _, asst_msg_id = create_test_conversation_and_messages(user_id)

    # Submit feedback
    sub_res = client.post(
        "/api/v1/feedback",
        headers={"Authorization": f"Bearer {token}"},
        json={"message_id": asst_msg_id, "feedback_type": "positive", "comment": "Great!"},
    )
    assert sub_res.status_code == 201
    feedback_id = sub_res.json()["feedback"]["id"]

    # Retrieve via /feedback/my
    my_res = client.get(
        f"/api/v1/feedback/my?conversation_id={conv_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert my_res.status_code == 200
    my_data = my_res.json()
    assert my_data["total"] >= 1
    assert any(item["id"] == feedback_id for item in my_data["items"])

    # Retrieve via /feedback/message/{id}
    msg_res = client.get(
        f"/api/v1/feedback/message/{asst_msg_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert msg_res.status_code == 200
    assert msg_res.json()["has_feedback"] is True
    assert msg_res.json()["feedback"]["id"] == feedback_id

    # Delete feedback
    del_res = client.delete(
        f"/api/v1/feedback/{feedback_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert del_res.status_code == 200

    # Verify deleted
    msg_res_after = client.get(
        f"/api/v1/feedback/message/{asst_msg_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert msg_res_after.json()["has_feedback"] is False


def test_feedback_analytics_privileged_vs_forbidden():
    # Customer user
    cust_token, _ = register_and_get_token(role="Customer", prefix="cust_ana")
    res_cust = client.get(
        "/api/v1/feedback/analytics",
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert res_cust.status_code == 403

    # Admin user login using seeded admin account
    admin_login = client.post(
        "/api/v1/auth/login",
        json={"email": "janardhan@supportiq.com", "password": "SupportIQ2026!"},
    )
    assert admin_login.status_code == 200, admin_login.text
    admin_token = admin_login.json()["token"]

    res_admin = client.get(
        "/api/v1/feedback/analytics",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_admin.status_code == 200
    ana_data = res_admin.json()
    assert "total_feedback" in ana_data
    assert "positive_count" in ana_data
    assert "negative_count" in ana_data
    assert "reasons" in ana_data
    assert "recent_feedback" in ana_data
    assert ana_data["metric_scope"] == "Operational User Sentiment"


def test_chat_regenerate_endpoint():
    token, user_id = register_and_get_token(role="Customer", prefix="regen")
    conv_id, _, asst_msg_id = create_test_conversation_and_messages(user_id)

    res = client.post(
        "/api/v1/chat/regenerate",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "conversation_id": conv_id,
            "message_id": asst_msg_id,
            "model_name": "Extractive Synthesizer",
        },
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["status"] == "ok"
    assert "assistant_message" in data
    assert data["assistant_message"]["role"] == "assistant"
    assert data["assistant_message"]["content"]
    assert "citations" in data
