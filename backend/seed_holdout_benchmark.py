import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from app.db.session import SessionLocal
from app.db.models import EvaluationDataset, EvaluationTestCase, Document, DocumentChunk, User

def seed():
    session = SessionLocal()
    try:
        # 1. Update Dataset 1 to explicitly reflect Dev/Validation role
        ds1 = session.query(EvaluationDataset).filter(EvaluationDataset.id == 1).first()
        if ds1:
            ds1.name = "SupportIQ Golden Dev/Validation Benchmark v1"
            ds1.description = "Development & validation benchmark suite used for threshold calibration and parameter tuning."
            session.commit()
            print(f"[OK] Renamed Dataset 1 to: '{ds1.name}'")

        # 2. Check if Holdout Test Benchmark v1 exists
        ds_holdout = session.query(EvaluationDataset).filter(EvaluationDataset.name == "SupportIQ Holdout Test Benchmark v1").first()
        if not ds_holdout:
            admin_user = session.query(User).filter(User.email == "janardhan@supportiq.com").first()
            admin_id = admin_user.id if admin_user else 1

            ds_holdout = EvaluationDataset(
                name="SupportIQ Holdout Test Benchmark v1",
                description="Independent, unobserved holdout test benchmark suite created from previously unused Knowledge Base chunks and novel unanswerable queries for unbiased empirical reporting.",
                version="1.0.0",
                created_by_user_id=admin_id,
            )
            session.add(ds_holdout)
            session.flush()
            print(f"[OK] Created Holdout Dataset ID: {ds_holdout.id}")

            # Define the 10 holdout test cases
            holdout_cases = [
                # Case 1: Refund Processing Timeline (Doc 1, Chunk 3)
                {
                    "question": "How long does it take for an approved refund to be processed after inspection?",
                    "expected_answer": "Once we receive and inspect your return, we will notify you of the approval or rejection of your refund. If approved, the refund will be processed within 5-7 business days.",
                    "doc_id": 1,
                    "chunk_id": 3,
                    "category": "Policy",
                    "is_answerable": True,
                },
                # Case 2: Administrative Security & MFA (Doc 2, Chunk 4)
                {
                    "question": "What security measures does SupportIQ enforce for administrative account credentials?",
                    "expected_answer": "SupportIQ enforces session timeout and multi-factor authentication for administrative accounts.",
                    "doc_id": 2,
                    "chunk_id": 4,
                    "category": "Security & Access",
                    "is_answerable": True,
                },
                # Case 3: Hardware Warranty Claims Pre-requisites (Doc 3, Chunk 7)
                {
                    "question": "What is required before dispatching an RMA for hardware warranty claims?",
                    "expected_answer": "Warranty claims require proof of purchase, serial service tag verification, and pre-diagnostic hardware triage before RMA dispatch.",
                    "doc_id": 3,
                    "chunk_id": 7,
                    "category": "Warranty",
                    "is_answerable": True,
                },
                # Case 4: Third-Party Ticketing Integrations (Doc 4, Chunk 9)
                {
                    "question": "How can SupportIQ be integrated with third-party ticketing platforms?",
                    "expected_answer": "SupportIQ can be connected with third-party ticketing platforms and internal documentation via our REST API and webhooks.",
                    "doc_id": 4,
                    "chunk_id": 9,
                    "category": "Integration",
                    "is_answerable": True,
                },
                # Case 5: Invoice Downloads (Doc 5, Chunk 11)
                {
                    "question": "Where can customers download their monthly subscription invoices?",
                    "expected_answer": "Invoices are automatically emailed on monthly renewal and can also be downloaded from the account settings portal.",
                    "doc_id": 5,
                    "chunk_id": 11,
                    "category": "Billing",
                    "is_answerable": True,
                },
                # Case 6: Data Encryption Standards (Doc 6, Chunk 12)
                {
                    "question": "What encryption standards are used to protect customer support conversations and documents?",
                    "expected_answer": "All customer support conversations and indexed knowledge documents are encrypted at rest using AES-256 and in transit via TLS 1.3.",
                    "doc_id": 6,
                    "chunk_id": 12,
                    "category": "Security",
                    "is_answerable": True,
                },
                # Case 7: Knowledge Manager Role Permissions (Doc 6, Chunk 13)
                {
                    "question": "What responsibilities do knowledge managers have in SupportIQ?",
                    "expected_answer": "Knowledge managers upload and curate verified documents.",
                    "doc_id": 6,
                    "chunk_id": 13,
                    "category": "Account & Roles",
                    "is_answerable": True,
                },
                # Case 8: Novel Unsupported Query 1
                {
                    "question": "Does SupportIQ offer holographic telepathic customer support?",
                    "expected_answer": None,
                    "doc_id": None,
                    "chunk_id": None,
                    "category": "Unsupported",
                    "is_answerable": False,
                },
                # Case 9: Novel Unsupported Query 2
                {
                    "question": "Can I pay for my enterprise subscription with Martian mineral mining credits?",
                    "expected_answer": None,
                    "doc_id": None,
                    "chunk_id": None,
                    "category": "Unsupported",
                    "is_answerable": False,
                },
                # Case 10: Novel Unsupported Query 3
                {
                    "question": "What is the warranty coverage for warp drive antimatter core containment breaches?",
                    "expected_answer": None,
                    "doc_id": None,
                    "chunk_id": None,
                    "category": "Unsupported",
                    "is_answerable": False,
                },
            ]

            for tc in holdout_cases:
                case = EvaluationTestCase(
                    dataset_id=ds_holdout.id,
                    question=tc["question"],
                    expected_answer=tc["expected_answer"],
                    expected_document_id=tc["doc_id"],
                    expected_chunk_id=tc["chunk_id"],
                    category=tc["category"],
                    is_answerable=tc["is_answerable"],
                    metadata_json={"is_holdout_test_set": True},
                )
                session.add(case)

            session.commit()
            print(f"[OK] Seeded {len(holdout_cases)} holdout test cases into Dataset {ds_holdout.id}.")
        else:
            print(f"[OK] Holdout dataset already exists (ID: {ds_holdout.id}, Cases: {len(ds_holdout.test_cases)}).")
    finally:
        session.close()

if __name__ == "__main__":
    seed()
