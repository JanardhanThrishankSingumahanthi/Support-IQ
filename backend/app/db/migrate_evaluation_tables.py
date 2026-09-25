import sys
import os

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.db.base import Base
from app.db.session import create_db_engine, SessionLocal
from app.db.models import EvaluationDataset, EvaluationTestCase, Document, DocumentChunk, User

def init_evaluation_schema():
    print("Creating evaluation tables in SQLite if not present...")
    engine = create_db_engine()
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

    session = SessionLocal()
    try:
        # Check if benchmark dataset already exists
        dataset = session.query(EvaluationDataset).filter(EvaluationDataset.name == "SupportIQ Golden Evaluation Benchmark v1").first()
        if not dataset:
            admin_user = session.query(User).filter(User.email == "janardhan@supportiq.com").first()
            admin_id = admin_user.id if admin_user else 1

            dataset = EvaluationDataset(
                name="SupportIQ Golden Evaluation Benchmark v1",
                description="Empirical benchmark suite linked to verified Knowledge Base documents and chunks, evaluating retrieval, grounding, citation accuracy, and hallucination resistance.",
                version="1.0.0",
                created_by_user_id=admin_id,
            )
            session.add(dataset)
            session.flush()
            print(f"Created EvaluationDataset ID: {dataset.id}")

            # Verify document and chunk IDs from database
            doc_return = session.query(Document).filter(Document.title.ilike("%Return_Policy%")).first()
            doc_terms = session.query(Document).filter(Document.title.ilike("%Terms_of_Service%")).first()
            doc_warranty = session.query(Document).filter(Document.title.ilike("%Product_Warranty%")).first()
            doc_faq = session.query(Document).filter(Document.title.ilike("%Customer_FAQ%")).first()
            doc_payment = session.query(Document).filter(Document.title.ilike("%Payment_Guide%")).first()
            doc_replacement = session.query(Document).filter(
                Document.title.ilike("%Express_Replacement%"),
                Document.status == "COMPLETED"
            ).first()

            def get_chunk(doc, index=1):
                if not doc:
                    return None
                chunk = session.query(DocumentChunk).filter(
                    DocumentChunk.document_id == doc.id,
                    DocumentChunk.chunk_index == index
                ).first()
                return chunk.id if chunk else None

            test_cases_data = [
                # 1. Return Policy
                {
                    "question": "Within how many days can annual subscriptions be refunded?",
                    "expected_answer": "Annual subscriptions may be refunded within 14 days of purchase, provided the service has not been extensively utilized.",
                    "expected_document_id": doc_return.id if doc_return else 1,
                    "expected_chunk_id": get_chunk(doc_return, 1),
                    "category": "Policy",
                    "is_answerable": True,
                },
                # 2. Return Eligibility
                {
                    "question": "What are the eligibility requirements to return a product?",
                    "expected_answer": "To be eligible for a return, the product must be unused, in the same condition that you received it, and in the original packaging.",
                    "expected_document_id": doc_return.id if doc_return else 1,
                    "expected_chunk_id": get_chunk(doc_return, 2),
                    "category": "Policy",
                    "is_answerable": True,
                },
                # 3. SLA
                {
                    "question": "What is the guaranteed uptime SLA for the SupportIQ platform?",
                    "expected_answer": "SupportIQ provides 99.9% uptime availability for all cloud-hosted customer support and enterprise services.",
                    "expected_document_id": doc_terms.id if doc_terms else 2,
                    "expected_chunk_id": get_chunk(doc_terms, 2),
                    "category": "SLA",
                    "is_answerable": True,
                },
                # 4. Warranty Coverage
                {
                    "question": "What is the standard warranty period for Dell hardware?",
                    "expected_answer": "Dell hardware typically comes with a 1-year limited hardware warranty covering manufacturing and component defects.",
                    "expected_document_id": doc_warranty.id if doc_warranty else 3,
                    "expected_chunk_id": get_chunk(doc_warranty, 1),
                    "category": "Warranty",
                    "is_answerable": True,
                },
                # 5. Password Reset
                {
                    "question": "How do I reset my account password if I forgot my credentials?",
                    "expected_answer": "Click 'Forgot password?' on the login page and enter your registered email address to receive reset instructions.",
                    "expected_document_id": doc_faq.id if doc_faq else 4,
                    "expected_chunk_id": get_chunk(doc_faq, 1),
                    "category": "Account",
                    "is_answerable": True,
                },
                # 6. Payment Methods
                {
                    "question": "Which credit cards are accepted for subscription payments?",
                    "expected_answer": "We support major credit cards including Visa, MasterCard, and American Express with automated processing.",
                    "expected_document_id": doc_payment.id if doc_payment else 5,
                    "expected_chunk_id": get_chunk(doc_payment, 1),
                    "category": "Billing",
                    "is_answerable": True,
                },
                # 7. Express Replacement
                {
                    "question": "What is the window for requesting an express replacement for defective equipment?",
                    "expected_answer": "Customers may request an express replacement within 14 days of receiving damaged or defective equipment with a valid RMA number.",
                    "expected_document_id": doc_replacement.id if doc_replacement else None,
                    "expected_chunk_id": get_chunk(doc_replacement, 1),
                    "category": "Warranty & Replacement",
                    "is_answerable": True,
                },
                # 8. Unsupported Query 1
                {
                    "question": "What is the SupportIQ policy on intergalactic quantum teleportation insurance?",
                    "expected_answer": None,
                    "expected_document_id": None,
                    "expected_chunk_id": None,
                    "category": "Unsupported",
                    "is_answerable": False,
                },
                # 9. Unsupported Query 2
                {
                    "question": "Can I use cryptocurrency to purchase orbital satellite launch slots?",
                    "expected_answer": None,
                    "expected_document_id": None,
                    "expected_chunk_id": None,
                    "category": "Unsupported",
                    "is_answerable": False,
                },
                # 10. Unsupported Query 3
                {
                    "question": "What are the reimbursement rates for time-travel paradox liabilities?",
                    "expected_answer": None,
                    "expected_document_id": None,
                    "expected_chunk_id": None,
                    "category": "Unsupported",
                    "is_answerable": False,
                },
            ]

            for tc in test_cases_data:
                case = EvaluationTestCase(
                    dataset_id=dataset.id,
                    question=tc["question"],
                    expected_answer=tc["expected_answer"],
                    expected_document_id=tc["expected_document_id"],
                    expected_chunk_id=tc["expected_chunk_id"],
                    category=tc["category"],
                    is_answerable=tc["is_answerable"],
                    metadata_json={"ground_truth_verified": True},
                )
                session.add(case)

            session.commit()
            print(f"Successfully populated {len(test_cases_data)} golden evaluation test cases.")
        else:
            print(f"Dataset already exists: {dataset.name} (ID: {dataset.id})")
    finally:
        session.close()

if __name__ == "__main__":
    init_evaluation_schema()
