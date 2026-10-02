import pytest
from sqlalchemy.orm import Session
from app.db.models import User, Role, Document, DocumentChunk
from app.api.v1.routers.documents.routes import run_document_pipeline
from app.retrieval.service import RetrievalService
from app.api.v1.routers.chat.routes import chat_message, ChatMessageRequest
from app.db.session import SessionLocal

@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

def test_new_document_upload_and_indexing(db: Session):
    customer_role = db.query(Role).filter(Role.name == "Customer").first()
    user_a = User(email="customer_a@example.com", full_name="Customer A", password_hash="dummy", role_id=customer_role.id)
    db.add(user_a)
    db.commit()
    db.refresh(user_a)

    doc_content = (
        b"Acme Travel allows cancellation of standard bookings up to 48 hours before departure. "
        b"Premium bookings can be cancelled up to 12 hours before departure. "
        b"Cancellation requests must be submitted through the customer portal."
    )

    doc = Document(
        title="Acme Travel Support Policy",
        content="",
        status="UPLOADING",
        owner_id=user_a.id,
        metadata_json={
            "filename": "Acme_Travel_Support_Policy.txt",
            "file_type": "txt",
            "size": len(doc_content),
            "category": "Policy",
            "version": 1,
            "chunk_count": 0,
        }
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    import asyncio
    asyncio.run(run_document_pipeline(doc, doc_content, "Acme_Travel_Support_Policy.txt", db=db))
    doc.status = "COMPLETED"
    db.commit()
    db.refresh(doc)

    assert doc.status == "COMPLETED"
    assert len(doc.chunks) >= 1
    chunk = doc.chunks[0]
    assert "48 hours before departure" in chunk.content
    assert chunk.metadata_json is not None
    assert "embedding" in chunk.metadata_json
    assert len(chunk.metadata_json["embedding"]) == 32

def test_new_document_retrieval_and_answer(db: Session):
    customer_role = db.query(Role).filter(Role.name == "Customer").first()
    user = db.query(User).filter(User.email == "customer_a@example.com").first()
    if not user:
        user = User(email="customer_a@example.com", full_name="Customer A", password_hash="dummy", role_id=customer_role.id)
        db.add(user)
        db.commit()
        db.refresh(user)

    doc = db.query(Document).filter(Document.title == "Acme Travel Support Policy", Document.owner_id == user.id).first()
    if not doc:
        doc_content = (
            b"Acme Travel allows cancellation of standard bookings up to 48 hours before departure. "
            b"Premium bookings can be cancelled up to 12 hours before departure. "
            b"Cancellation requests must be submitted through the customer portal."
        )
        doc = Document(
            title="Acme Travel Support Policy",
            content="",
            status="UPLOADING",
            owner_id=user.id,
            metadata_json={"filename": "Acme_Travel_Support_Policy.txt", "file_type": "txt", "size": len(doc_content)}
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        import asyncio
        asyncio.run(run_document_pipeline(doc, doc_content, "Acme_Travel_Support_Policy.txt", db=db))
        doc.status = "COMPLETED"
        db.commit()
        db.refresh(doc)

    query = "What is the cancellation window for a standard Acme Travel booking?"
    req = ChatMessageRequest(
        content=query,
        use_knowledge_base=True,
        model_name="extractive",
    )
    res = chat_message(payload=req, db=db, current_user=user)

    assert res["generation_status"] == "resolved"
    assert "48 hours before departure" in res["assistant_message"]["content"]
    assert res["reliability"]["score"] >= 0.8
    assert res["reliability"]["label"] == "high"

def test_new_document_citation_and_evidence(db: Session):
    user = db.query(User).filter(User.email == "customer_a@example.com").first()
    query = "What is the cancellation window for a standard Acme Travel booking?"
    req = ChatMessageRequest(
        content=query,
        use_knowledge_base=True,
        model_name="extractive",
    )
    res = chat_message(payload=req, db=db, current_user=user)

    assert len(res["citations"]) >= 1
    top_citation = res["citations"][0]
    assert top_citation["document_title"] == "Acme Travel Support Policy"
    assert top_citation["page"] == 1
    assert "48 hours before departure" in top_citation["quote"]

def test_unsupported_question_safe_refusal(db: Session):
    user = db.query(User).filter(User.email == "customer_a@example.com").first()
    req = ChatMessageRequest(
        content="What is the warranty policy for quantum widgets?",
        use_knowledge_base=True,
        model_name="extractive",
    )
    res = chat_message(payload=req, db=db, current_user=user)

    assert res["generation_status"] == "no_evidence"
    assert len(res["citations"]) == 0
    assert "No relevant information was found" in res["assistant_message"]["content"]

def test_user_isolation_between_customers(db: Session):
    customer_role = db.query(Role).filter(Role.name == "Customer").first()
    user_b = db.query(User).filter(User.email == "customer_b@example.com").first()
    if not user_b:
        user_b = User(email="customer_b@example.com", full_name="Customer B", password_hash="dummy", role_id=customer_role.id)
        db.add(user_b)
        db.commit()
        db.refresh(user_b)

    # User B queries User A's private Acme Travel document
    query = "What is the cancellation window for a standard Acme Travel booking?"
    req = ChatMessageRequest(
        content=query,
        use_knowledge_base=True,
        model_name="extractive",
    )
    res = chat_message(payload=req, db=db, current_user=user_b)

    assert res["generation_status"] == "no_evidence"
    assert len(res["citations"]) == 0
    assert "No relevant information was found" in res["assistant_message"]["content"]

def test_shared_seeded_documents_accessible_to_all(db: Session):
    user_b = db.query(User).filter(User.email == "customer_b@example.com").first()
    query = "What is the refund policy for annual subscriptions?"
    req = ChatMessageRequest(
        content=query,
        use_knowledge_base=True,
        model_name="extractive",
    )
    res = chat_message(payload=req, db=db, current_user=user_b)

    assert res["generation_status"] == "resolved"
    assert "14 days" in res["assistant_message"]["content"]
    assert len(res["citations"]) >= 1
    assert res["citations"][0]["document_title"] == "Return_Policy.pdf"
