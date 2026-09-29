from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.main import app
from app.retrieval.service import (
    INTENT_CANONICAL_GROUPS,
    RetrievalService,
    check_intent_consistency,
    extract_query_intents,
    tokenize,
)

client = TestClient(app)
settings = get_settings()


def get_auth_token():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": settings.dev_admin_email, "password": settings.dev_admin_password},
    )
    assert response.status_code == 200
    return response.json()["token"]


# ==============================================================================
# TESTS 1 - 8: Intent Consistency & Morphological Variant Regression Suite
# ==============================================================================

def test_intent_test_1_cancellation_query_with_refund_evidence():
    """
    TEST 1:
    Query: 'What is the cancellation policy for annual subscriptions?'
    Evidence: refund policy
    Expected: no_evidence / unsupported (intent check fails)
    """
    query = "What is the cancellation policy for annual subscriptions?"
    evidence = [
        {
            "chunk_id": 1,
            "content": "3. REFUND POLICY Annual subscriptions may be refunded within 14 days of purchase, provided the service has not been substantially used.",
        }
    ]
    is_ok, q_intents, matched = check_intent_consistency(query, evidence)
    assert "cancel" in q_intents
    assert len(matched) == 0
    assert is_ok is False


def test_intent_test_2_refund_query_with_refund_evidence():
    """
    TEST 2:
    Query: 'What is the refund policy for annual subscriptions?'
    Evidence: refund policy
    Expected: supported (intent check passes)
    """
    query = "What is the refund policy for annual subscriptions?"
    evidence = [
        {
            "chunk_id": 1,
            "content": "3. REFUND POLICY Annual subscriptions may be refunded within 14 days of purchase, provided the service has not been substantially used.",
        }
    ]
    is_ok, q_intents, matched = check_intent_consistency(query, evidence)
    assert "refund" in q_intents
    assert "refund" in matched
    assert is_ok is True


def test_intent_test_3_cancel_query_with_cancellation_evidence():
    """
    TEST 3:
    Query: 'How do I cancel my annual subscription?'
    Evidence: cancellation policy
    Expected: supported
    """
    query = "How do I cancel my annual subscription?"
    evidence = [
        {
            "chunk_id": 2,
            "content": "To cancel your annual subscription, go to billing settings and select cancel subscription.",
        }
    ]
    is_ok, q_intents, matched = check_intent_consistency(query, evidence)
    assert "cancel" in q_intents
    assert "cancel" in matched
    assert is_ok is True


def test_intent_test_4_can_i_get_a_refund_query_with_refund_evidence():
    """
    TEST 4:
    Query: 'Can I get a refund for my annual subscription?'
    Evidence: refund policy
    Expected: supported
    """
    query = "Can I get a refund for my annual subscription?"
    evidence = [
        {
            "chunk_id": 1,
            "content": "3. REFUND POLICY Annual subscriptions may be refunded within 14 days of purchase.",
        }
    ]
    is_ok, q_intents, matched = check_intent_consistency(query, evidence)
    assert "refund" in q_intents
    assert "refund" in matched
    assert is_ok is True


def test_intent_test_5_query_uses_canceled_evidence_uses_cancellation():
    """
    TEST 5:
    Query uses 'canceled'
    Evidence uses 'cancellation'
    Expected: supported (morphological equivalence)
    """
    query = "My subscription was canceled yesterday, what happens next?"
    evidence = [
        {
            "chunk_id": 3,
            "content": "The cancellation terms apply immediately upon termination of service.",
        }
    ]
    is_ok, q_intents, matched = check_intent_consistency(query, evidence)
    assert "cancel" in q_intents
    assert "cancel" in matched
    assert is_ok is True


def test_intent_test_6_query_uses_cancellation_evidence_uses_cancel():
    """
    TEST 6:
    Query uses 'cancellation'
    Evidence uses 'cancel'
    Expected: supported (morphological equivalence)
    """
    query = "What are the cancellation requirements for enterprise plans?"
    evidence = [
        {
            "chunk_id": 4,
            "content": "Enterprise administrators can cancel plans anytime by notifying their account manager.",
        }
    ]
    is_ok, q_intents, matched = check_intent_consistency(query, evidence)
    assert "cancel" in q_intents
    assert "cancel" in matched
    assert is_ok is True


def test_intent_test_7_valid_benchmark_query_without_intent_term():
    """
    TEST 7:
    Valid benchmark-style query where the exact query wording does not appear in the evidence
    Expected: preserve support when the intent is genuinely represented (no intent blocking).
    """
    query = "How can SupportIQ be integrated with third-party ticketing platforms?"
    evidence = [
        {
            "chunk_id": 5,
            "content": "SupportIQ connects with external ticketing tools and incident trackers via REST webhooks.",
        }
    ]
    is_ok, q_intents, matched = check_intent_consistency(query, evidence)
    # No action/intent keyword present, so consistency check passes by default
    assert len(q_intents) == 0
    assert is_ok is True


def test_intent_test_8_intent_distributed_across_top_3_chunks():
    """
    TEST 8:
    Query intent is distributed across multiple retrieved chunks
    Expected: supported when the combined top-3 evidence supports the query.
    """
    query = "What is the replacement policy for express defective equipment?"
    chunks = [
        {"content": "Express equipment is delivered via priority freight."},
        {"content": "Replacement of defective items is covered under section 2."},
        {"content": "General terms and conditions apply."},
    ]
    is_ok, q_intents, matched = check_intent_consistency(query, chunks)
    assert "replace" in q_intents
    assert "replace" in matched
    assert is_ok is True


# ==============================================================================
# GROUNDING SERVICE TESTS (Requirement C & E)
# ==============================================================================

def test_grounding_analysis_downgrades_copied_irrelevant_answer():
    """
    Requirement C:
    If the answer is copied from an irrelevant-but-related document
    (e.g., refund answer to a cancellation query), the result must be downgraded
    to unsupported and reliability to 0.0 / low.
    """
    with SessionLocal() as session:
        service = RetrievalService(db=session, user_id=None)
        # Query asks about cancellation, but answer contains the refund text
        report = service.analyze_answer_grounding(
            query="What is the cancellation policy for annual subscriptions?",
            answer="Annual subscriptions may be refunded within 14 days of purchase provided the service has not been substantially used.",
            top_k=4,
        )
        assert report["grounding_status"] == "unsupported"
        assert report["reliability"]["score"] == 0.0
        assert report["reliability"]["label"] == "low"
        assert report["supported_claim_count"] == 0


def test_grounding_analysis_supports_matching_refund_query():
    """
    Requirement C & E:
    Refund query + refund answer + refund evidence is supported with high reliability.
    """
    with SessionLocal() as session:
        service = RetrievalService(db=session, user_id=None)
        report = service.analyze_answer_grounding(
            query="What is the refund policy for annual subscriptions?",
            answer="Annual subscriptions may be refunded within 14 days of purchase provided the service has not been substantially used.",
            top_k=4,
        )
        assert report["grounding_status"] == "supported"
        assert report["reliability"]["score"] >= 0.70
        assert report["supported_claim_count"] >= 1


# ==============================================================================
# FULL LIVE-CHAT ENDPOINT REGRESSION TESTS
# ==============================================================================

def test_live_chat_cancellation_query_safely_refuses_when_only_refund_evidence_exists():
    """
    Live Chat Test:
    Query: 'What is the cancellation policy for annual subscriptions?'
    Knowledge base only contains Return_Policy.pdf (refund terms).
    Expected:
      - generation_status: 'no_evidence'
      - grounding_status: 'unsupported'
      - reliability.score: 0.0
      - citations: empty
    """
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/chat/messages",
        json={
            "content": "What is the cancellation policy for annual subscriptions?",
            "use_knowledge_base": True,
            "model_name": "SupportIQ QLoRA (4-bit NF4)",
        },
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["generation_status"] == "no_evidence"
    assert "No relevant information was found" in data["assistant_message"]["content"]
    assert data["assistant_message"]["metadata_json"]["grounding_status"] == "unsupported"
    assert data["reliability"]["score"] == 0.0
    assert len(data["citations"]) == 0


def test_live_chat_refund_query_resolves_and_is_supported_with_refund_evidence():
    """
    Live Chat Test:
    Query: 'What is the refund policy for annual subscriptions?'
    Knowledge base contains Return_Policy.pdf (refund terms).
    Expected:
      - generation_status: 'resolved'
      - grounding_status: 'supported'
      - reliability.score >= 0.70
      - citations: contains Return_Policy.pdf
    """
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/chat/messages",
        json={
            "content": "What is the refund policy for annual subscriptions?",
            "use_knowledge_base": True,
            "model_name": "SupportIQ QLoRA (4-bit NF4)",
        },
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["generation_status"] == "resolved"
    assert data["assistant_message"]["metadata_json"]["grounding_status"] == "supported"
    assert data["reliability"]["score"] >= 0.70
    assert len(data["citations"]) > 0
    assert any("Return_Policy" in c["document_title"] for c in data["citations"])


def test_live_chat_cancel_subscription_query_safely_refuses_when_no_cancel_doc_exists():
    """
    Live Chat Test:
    Query: 'How do I cancel my annual subscription?'
    Expected:
      - generation_status: 'no_evidence'
      - grounding_status: 'unsupported'
    """
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/chat/messages",
        json={
            "content": "How do I cancel my annual subscription?",
            "use_knowledge_base": True,
            "model_name": "SupportIQ QLoRA (4-bit NF4)",
        },
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["generation_status"] == "no_evidence"
    assert data["assistant_message"]["metadata_json"]["grounding_status"] == "unsupported"
