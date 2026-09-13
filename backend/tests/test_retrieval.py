from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.models import Document, DocumentChunk, User, Role
from app.retrieval.service import RetrievalService, compute_mrr, compute_recall_at_k


def _create_user(session: Session, email: str = "retrieval@example.com") -> User:
    role = session.query(Role).filter_by(name="Viewer").first()
    if role is None:
        role = Role(name="Viewer", description="Viewer role")
        session.add(role)
        session.commit()
        session.refresh(role)

    user = User(email=email, full_name="Retrieval User", role_id=role.id, is_active=True)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def test_hybrid_retrieval_returns_relevant_chunks_for_real_documents(tmp_path):
    database_path = tmp_path / "retrieval.db"
    engine = create_engine(f"sqlite:///{database_path.resolve().as_posix()}")
    Base.metadata.create_all(bind=engine)

    with Session(engine) as session:
        user = _create_user(session, email="retrieval_user@example.com")

        policies = Document(
            title="Refund Policy",
            owner_id=user.id,
            status="COMPLETED",
            content="Refunds are granted within 30 days for eligible purchases. Customers can request a refund through billing support.",
            metadata_json={"filename": "refund-policy.txt", "category": "Policies", "version": 1},
        )
        session.add(policies)
        session.commit()
        session.refresh(policies)

        document_chunk = DocumentChunk(
            document_id=policies.id,
            chunk_index=0,
            content="Refunds are granted within 30 days for eligible purchases. Customers can request a refund through billing support.",
            metadata_json={"embedding": [0.8, 0.2, 0.1, 0.0]},
        )
        session.add(document_chunk)
        session.commit()

        support = Document(
            title="Password Reset",
            owner_id=user.id,
            status="COMPLETED",
            content="Password resets require identity verification and a secure confirmation message.",
            metadata_json={"filename": "password-reset.txt", "category": "Support", "version": 1},
        )
        session.add(support)
        session.commit()
        session.refresh(support)

        support_chunk = DocumentChunk(
            document_id=support.id,
            chunk_index=0,
            content="Password resets require identity verification and a secure confirmation message.",
            metadata_json={"embedding": [0.1, 0.1, 0.9, 0.0]},
        )
        session.add(support_chunk)
        session.commit()

        service = RetrievalService(db=session, user_id=user.id)
        results = service.retrieve("refund policy billing support", top_k=3, retrieval_method="hybrid")

        assert results
        assert results[0]["document_id"] == policies.id
        assert results[0]["retrieval_method"] in {"hybrid", "lexical", "vector"}
        assert results[0]["rank"] == 1
        assert results[0]["similarity_score"] >= 0.0


def test_retrieval_evaluation_framework_computes_metrics():
    relevant = [101, 202]
    retrieved = [202, 999, 101]

    assert compute_recall_at_k(relevant, retrieved, 3) == 1.0
    assert compute_mrr(relevant, retrieved) == 1.0


def test_grounding_verification_returns_claims_evidence_and_reliability(tmp_path):
    database_path = tmp_path / "grounding.db"
    engine = create_engine(f"sqlite:///{database_path.resolve().as_posix()}")
    Base.metadata.create_all(bind=engine)

    with Session(engine) as session:
        user = _create_user(session, email="grounding_user@example.com")

        policy = Document(
            title="Refund Policy",
            owner_id=user.id,
            status="COMPLETED",
            content="Refunds are granted within 30 days for eligible purchases. Customers can request a refund through billing support.",
            metadata_json={"filename": "refund-policy.txt", "category": "Policies", "version": 1},
        )
        session.add(policy)
        session.commit()
        session.refresh(policy)

        chunk = DocumentChunk(
            document_id=policy.id,
            chunk_index=0,
            content="Refunds are granted within 30 days for eligible purchases. Customers can request a refund through billing support.",
            metadata_json={"embedding": [0.8, 0.2, 0.1, 0.0]},
        )
        session.add(chunk)
        session.commit()

        service = RetrievalService(db=session, user_id=user.id)
        report = service.analyze_answer_grounding(
            query="How can I request a refund?",
            answer="Refunds are available within 30 days for eligible purchases. Customers can request a refund through billing support.",
            top_k=3,
        )

        assert report["claim_count"] >= 2
        assert report["grounding_status"] in {"supported", "partially_supported"}
        assert report["reliability"]["score"] > 0.0
        assert any(claim["supported"] for claim in report["claims"])
        assert any(item["matched_evidence"] for item in report["claim_evidence"])
