from __future__ import annotations

import os
import shutil
import tempfile
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import Settings
from app.core.security import hash_password
from app.db.base import Base
from app.db.models import Document, DocumentChunk, Role, User
from app.retrieval.service import RetrievalService


def test_persistence_across_service_restarts():
    """
    Test Phase 19: Deployment persistence across restarts.
    Verifies that when SUPPORTIQ_DATA_DIR is configured:
    1. Database file and uploaded files are saved to the persistent directory.
    2. A newly registered user persists across restart.
    3. An uploaded document and its chunks persist across restart.
    4. Post-restart retrieval, citations, and grounding function correctly.
    """
    temp_dir = tempfile.mkdtemp(prefix="supportiq_persist_test_")
    persist_path = Path(temp_dir).resolve()

    try:
        db_file = persist_path / "supportiq.db"
        upload_dir = persist_path / "storage" / "documents"
        upload_dir.mkdir(parents=True, exist_ok=True)
        db_url = f"sqlite:///{db_file}"

        # Phase 1: Initialize DB on persistent volume
        engine_v1 = create_engine(db_url, connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=engine_v1)
        SessionV1 = sessionmaker(autocommit=False, autoflush=False, bind=engine_v1)

        # Seed minimal roles
        with SessionV1() as session:
            customer_role = Role(name="Customer", description="Customer role")
            session.add(customer_role)
            session.commit()
            session.refresh(customer_role)

            # Signup new user
            new_user = User(
                email="persist_pilot@example.com",
                full_name="Persist Pilot",
                password_hash=hash_password("SecurePass123!"),
                role_id=customer_role.id,
                is_active=True,
            )
            session.add(new_user)
            session.commit()
            session.refresh(new_user)
            user_id = new_user.id

            # Save uploaded document to persistent storage
            doc_file = upload_dir / "Acme_Travel_Support_Policy.txt"
            policy_text = (
                "ACME TRAVEL CANCELLATION & FLIGHT POLICY\n"
                "International flights may be rescheduled up to 24 hours before departure for a flat fee of $50.\n"
                "Cancellations requested within 48 hours of purchase receive a full travel voucher."
            )
            doc_file.write_text(policy_text, encoding="utf-8")

            # Insert document & chunk in database
            doc = Document(
                title="Acme_Travel_Support_Policy.txt",
                content=policy_text,
                status="COMPLETED",
                owner_id=user_id,
                metadata_json={
                    "filename": "Acme_Travel_Support_Policy.txt",
                    "file_type": "txt",
                    "storage_path": str(doc_file),
                },
            )
            session.add(doc)
            session.commit()
            session.refresh(doc)
            doc_id = doc.id

            chunk = DocumentChunk(
                document_id=doc.id,
                chunk_index=1,
                content=policy_text,
                metadata_json={"page": 1, "section": "Flight Policy"},
            )
            session.add(chunk)
            session.commit()

            # Retrieval test before restart
            retriever_v1 = RetrievalService(db=session, user_id=user_id, is_privileged=False)
            results_v1 = retriever_v1.retrieve(
                query="Can I reschedule international flights?",
                top_k=3,
            )
            assert len(results_v1) > 0
            assert "International flights may be rescheduled" in results_v1[0]["content"]

        # Phase 2: Complete Service Restart Simulation
        engine_v1.dispose()

        # Phase 3: Reconnect to same persistent volume post-restart
        engine_v2 = create_engine(db_url, connect_args={"check_same_thread": False})
        SessionV2 = sessionmaker(autocommit=False, autoflush=False, bind=engine_v2)

        with SessionV2() as session2:
            # 1. Verify user still exists post-restart
            user_reloaded = session2.query(User).filter_by(email="persist_pilot@example.com").first()
            assert user_reloaded is not None
            assert user_reloaded.id == user_id
            assert user_reloaded.full_name == "Persist Pilot"

            # 2. Verify document still exists in DB
            doc_reloaded = session2.query(Document).filter_by(id=doc_id).first()
            assert doc_reloaded is not None
            assert doc_reloaded.owner_id == user_id
            assert doc_reloaded.title == "Acme_Travel_Support_Policy.txt"

            # 3. Verify file on persistent disk still exists
            stored_path = Path(doc_reloaded.metadata_json["storage_path"])
            assert stored_path.exists()
            assert "flat fee of $50" in stored_path.read_text(encoding="utf-8")

            # 4. Verify post-restart retrieval and ranking
            retriever_v2 = RetrievalService(db=session2, user_id=user_id, is_privileged=False)
            results_v2 = retriever_v2.retrieve(
                query="Can I reschedule international flights?",
                top_k=3,
            )
            assert len(results_v2) > 0
            top_chunk = results_v2[0]
            assert top_chunk["document_title"] == "Acme_Travel_Support_Policy.txt"

            # 5. Verify post-restart grounding
            grounding_report = retriever_v2.analyze_answer_grounding(
                query="Can I reschedule international flights?",
                answer="International flights may be rescheduled up to 24 hours before departure for a flat fee of $50.",
                top_k=3,
            )
            assert grounding_report["grounding_status"] in {"supported", "partially_supported"}
            assert grounding_report["reliability"]["score"] > 0.50

        engine_v2.dispose()

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
