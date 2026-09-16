from __future__ import annotations

from datetime import datetime, timezone
from sqlalchemy import text

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.base import Base
from app.db.models import (
    Document,
    DocumentChunk,
    Experiment,
    ExperimentRun,
    EvaluationResult,
    Model,
    Permission,
    Role,
    SupportTicket,
    TicketEvent,
    User,
)
from app.db.session import SessionLocal, create_db_engine


ROLE_DEFINITIONS = {
    "Administrator": [
        "manage_users",
        "manage_support_tickets",
        "manage_knowledge_base",
        "run_analytics",
        "read_documents",
        "write_documents",
        "view_reports",
        "access_admin",
    ],
    "Support Agent": [
        "manage_support_tickets",
        "read_documents",
        "write_documents",
        "view_reports",
    ],
    "Knowledge Manager": [
        "manage_knowledge_base",
        "read_documents",
        "write_documents",
        "view_reports",
    ],
    "Data Scientist": [
        "run_analytics",
        "read_documents",
        "view_reports",
    ],
    "Viewer": [
        "read_documents",
        "view_reports",
    ],
}


def initialize_database() -> None:
    engine = create_db_engine()
    Base.metadata.create_all(bind=engine)


def ensure_roles_and_permissions(session) -> dict[str, Role]:
    created_roles: dict[str, Role] = {}

    for role_name, permission_names in ROLE_DEFINITIONS.items():
        role = session.query(Role).filter_by(name=role_name).first()
        if role is None:
            role = Role(name=role_name, description=f"{role_name} role")
            session.add(role)
            session.flush()
        created_roles[role_name] = role

        for permission_name in permission_names:
            permission = session.query(Permission).filter_by(name=permission_name).first()
            if permission is None:
                permission = Permission(name=permission_name, description=f"Permission to {permission_name.replace('_', ' ')}")
                session.add(permission)
                session.flush()
            if permission not in role.permissions:
                role.permissions.append(permission)

    return created_roles


def seed_demo_data() -> None:
    settings = get_settings()
    with SessionLocal() as session:
        roles = ensure_roles_and_permissions(session)
        admin_role = roles["Administrator"]
        agent_role = roles["Support Agent"]
        ds_role = roles["Data Scientist"]
        viewer_role = roles["Viewer"]

        # 1. Seed standard users
        user_specs = [
            (settings.dev_admin_email, "Development Admin", settings.dev_admin_password, admin_role.id),
            ("janardhan@supportiq.com", "Janardhan", "SupportIQ2026!", admin_role.id),
            ("priya@supportiq.com", "Priya Sharma", "SupportIQ2026!", agent_role.id),
            ("mohit@supportiq.com", "Mohit Jain", "SupportIQ2026!", agent_role.id),
            ("sneha@supportiq.com", "Sneha Nair", "SupportIQ2026!", ds_role.id),
            ("rahul@customer.com", "Rahul Kumar", "SupportIQ2026!", viewer_role.id),
        ]

        seeded_users = {}
        for email, full_name, password, role_id in user_specs:
            user = session.query(User).filter_by(email=email).first()
            if user is None:
                user = User(
                    email=email,
                    full_name=full_name,
                    password_hash=hash_password(password),
                    role_id=role_id,
                    is_active=True,
                )
                session.add(user)
                session.flush()
            seeded_users[email] = user

        # 2. Seed Knowledge Base Documents & Chunks if none exist
        if session.query(Document).count() == 0:
            doc_specs = [
                {
                    "title": "Return_Policy.pdf",
                    "category": "Policy",
                    "size": 2400000,
                    "file_type": "pdf",
                    "chunks": [
                        "3. REFUND POLICY\nAnnual subscriptions may be refunded within 14 days of purchase, provided the service has not been substantially used. Refund requests are typically processed within 5-7 business days to the original payment method.",
                        "4. RETURN ELIGIBILITY\nTo be eligible for a return, the product must be unused, in the same condition that you received it, and in the original packaging.",
                        "5. REFUND PROCESS\nOnce we receive and inspect your return, we will notify you of the approval or rejection of your refund. If approved, the refund will be processed within 5-7 business days."
                    ],
                },
                {
                    "title": "Terms_of_Service.pdf",
                    "category": "Policy",
                    "size": 1800000,
                    "file_type": "pdf",
                    "chunks": [
                        "SECTION 4. ACCOUNT ACCESS & CREDENTIALS\nUsers are responsible for safeguarding password credentials. SupportIQ enforces session timeout and multi-factor authentication for administrative accounts.",
                        "SECTION 8. SERVICE LEVEL AGREEMENT (SLA)\nSupportIQ provides 99.9% uptime availability for all cloud-hosted automated customer support retrieval endpoints."
                    ],
                },
                {
                    "title": "Product_Warranty.pdf",
                    "category": "Product",
                    "size": 3100000,
                    "file_type": "pdf",
                    "chunks": [
                        "WARRANTY COVERAGE\nDell laptops typically come with a 1-year limited hardware warranty covering manufacturing defects. You can also extend it with Premium Support.",
                        "HARDWARE CLAIMS\nWarranty claims require proof of purchase, serial service tag verification, and pre-diagnostic hardware triage before RMA dispatch."
                    ],
                },
                {
                    "title": "Customer_FAQ.pdf",
                    "category": "FAQ",
                    "size": 1200000,
                    "file_type": "pdf",
                    "chunks": [
                        "PASSWORD RESET INSTRUCTIONS\nTo reset your account password, click 'Forgot password?' on the login page. Enter your registered email address to receive a secure one-time reset link valid for 15 minutes.",
                        "INTEGRATION QUESTIONS\nSupportIQ can be connected with third-party ticketing platforms and internal documentation via our REST API and webhooks."
                    ],
                },
                {
                    "title": "Payment_Guide.docx",
                    "category": "Billing",
                    "size": 980000,
                    "file_type": "docx",
                    "chunks": [
                        "BILLING & PAYMENTS\nWe support major credit cards (Visa, MasterCard, Amex) and automated bank clearing. If you were billed twice, our billing team can issue an instant reversal upon receiving transaction IDs.",
                        "INVOICE DOWNLOADS\nInvoices are automatically emailed on monthly renewal and can also be downloaded from the account settings portal."
                    ],
                },
                {
                    "title": "Account_Management.pdf",
                    "category": "Technical",
                    "size": 2000000,
                    "file_type": "pdf",
                    "chunks": [
                        "SECURITY & PRIVACY CONTROLS\nAll customer support conversations and indexed knowledge documents are encrypted at rest using AES-256 and in transit via TLS 1.3.",
                        "USER ROLE PERMISSIONS\nAdministrators manage users and models. Support agents respond to escalations. Knowledge managers upload and curate verified documents."
                    ],
                },
            ]

            admin_user = seeded_users["janardhan@supportiq.com"]
            for spec in doc_specs:
                doc = Document(
                    title=spec["title"],
                    content="\n\n".join(spec["chunks"]),
                    status="COMPLETED",
                    owner_id=admin_user.id,
                    metadata_json={
                        "filename": spec["title"],
                        "file_type": spec["file_type"],
                        "size": spec["size"],
                        "category": spec["category"],
                        "version": 1,
                        "chunk_count": len(spec["chunks"]),
                        "indexed_at": datetime.now(timezone.utc).isoformat(),
                    },
                )
                session.add(doc)
                session.flush()

                for index, chunk_text in enumerate(spec["chunks"], start=1):
                    chunk = DocumentChunk(
                        document_id=doc.id,
                        version_id=None,
                        chunk_index=index,
                        content=chunk_text,
                        metadata_json={
                            "page": index,
                            "section": f"Section {index}",
                            "tokens": len(chunk_text.split()),
                        },
                    )
                    session.add(chunk)

        # 3. Seed Support Tickets if none exist
        if session.query(SupportTicket).count() == 0:
            ticket_specs = [
                {
                    "subject": "Refund for annual subscription",
                    "customer_name": "Rahul Kumar",
                    "customer_email": "rahul.kumar@example.com",
                    "description": "I purchased an annual plan yesterday but our team decided on a different tier. Requesting a full refund within the 14-day window.",
                    "category": "Billing & Payments",
                    "priority": "High",
                    "status": "Open",
                    "reason": "Customer requested refund within 14-day window.",
                },
                {
                    "subject": "Unable to login to account",
                    "customer_name": "Priya Sharma",
                    "customer_email": "priya.s@domain.com",
                    "description": "Password reset email is not arriving in inbox or spam folder.",
                    "category": "Account Access",
                    "priority": "Medium",
                    "status": "In Progress",
                    "reason": "Email delivery check required.",
                },
                {
                    "subject": "Warranty claim for laptop",
                    "customer_name": "Sneha Nair",
                    "customer_email": "sneha.n@domain.com",
                    "description": "Dell laptop screen flickering intermittently under warranty period.",
                    "category": "Technical Issues",
                    "priority": "Medium",
                    "status": "Open",
                    "reason": "Hardware diagnostics requested.",
                },
                {
                    "subject": "Product delivery delay",
                    "customer_name": "Mohit Jain",
                    "customer_email": "mohit.j@domain.com",
                    "description": "Shipment has been delayed by customs for 3 days.",
                    "category": "Orders & Shipping",
                    "priority": "Low",
                    "status": "Resolved",
                    "resolution_note": "Tracking number updated and carrier expedited shipment.",
                },
                {
                    "subject": "Payment failed",
                    "customer_name": "Rahul Kumar",
                    "customer_email": "rahul.kumar@example.com",
                    "description": "Card was declined twice due to 3D-secure verification error.",
                    "category": "Billing & Payments",
                    "priority": "High",
                    "status": "In Progress",
                    "reason": "Payment gateway timeout.",
                },
            ]

            admin_user = seeded_users["janardhan@supportiq.com"]
            for spec in ticket_specs:
                ticket = SupportTicket(
                    user_id=admin_user.id,
                    customer_name=spec["customer_name"],
                    customer_email=spec["customer_email"],
                    title=spec["subject"],
                    description=spec["description"],
                    category=spec["category"],
                    status=spec["status"],
                    priority=spec["priority"],
                    source="web",
                    reason=spec.get("reason"),
                    resolution_note=spec.get("resolution_note"),
                )
                session.add(ticket)
                session.flush()
                session.add(TicketEvent(ticket_id=ticket.id, event_type="created", details_json={"seeded": True}))

        # 4. Seed Models & Baseline Research Experiment
        if session.query(Model).count() == 0:
            models_to_create = [
                ("Llama-3-8B-Instruct", "Base LLM", "1.0", "Meta"),
                ("RAG (Base)", "RAG", "1.1", "SupportIQ RAG"),
                ("LoRA (Fine-tuned)", "Fine-tuned", "1.2", "PEFT LoRA"),
                ("QLoRA (Proposed)", "Fine-tuned", "2.1", "PEFT 4-bit QLoRA"),
            ]
            for name, m_type, ver, prov in models_to_create:
                session.add(
                    Model(
                        name=name,
                        version=ver,
                        model_type=m_type,
                        provider=prov,
                        status="active",
                        metadata_json={"supported": True},
                    )
                )

        if session.query(Experiment).count() == 0:
            admin_user = seeded_users["janardhan@supportiq.com"]
            exp = Experiment(
                name="RAG + QLoRA (Customer Support v1)",
                description="Comparative evaluation of Parameter-efficient Fine-tuning (QLoRA) combined with Retrieval-Augmented Generation.",
                dataset_name="Customer Support QA Dataset",
                status="COMPLETED",
                created_by_user_id=admin_user.id,
            )
            session.add(exp)
            session.flush()

            # Add runs for baseline comparison with real benchmark values from research study
            runs_data = [
                {
                    "variant": "Base LLM",
                    "status": "COMPLETED",
                    "metrics": {
                        "accuracy": 0.52,
                        "faithfulness": 0.48,
                        "recall_at_5": 0.41,
                        "mrr": 0.42,
                        "hallucination_rate": 0.18,
                        "response_time": 1.2,
                        "gpu_memory": "7.1 GB",
                        "parameter_count": "7B",
                    },
                },
                {
                    "variant": "RAG Base",
                    "status": "COMPLETED",
                    "metrics": {
                        "accuracy": 0.68,
                        "faithfulness": 0.72,
                        "recall_at_5": 0.67,
                        "mrr": 0.68,
                        "hallucination_rate": 0.12,
                        "response_time": 1.9,
                        "gpu_memory": "7.3 GB",
                        "parameter_count": "7B",
                    },
                },
                {
                    "variant": "LoRA",
                    "status": "COMPLETED",
                    "metrics": {
                        "accuracy": 0.71,
                        "faithfulness": 0.76,
                        "recall_at_5": 0.70,
                        "mrr": 0.71,
                        "hallucination_rate": 0.10,
                        "response_time": 2.1,
                        "gpu_memory": "7.5 GB",
                        "parameter_count": "7B + 8M",
                    },
                },
                {
                    "variant": "QLoRA",
                    "status": "COMPLETED",
                    "metrics": {
                        "accuracy": 0.78,
                        "faithfulness": 0.82,
                        "recall_at_5": 0.79,
                        "mrr": 0.78,
                        "hallucination_rate": 0.08,
                        "response_time": 1.7,
                        "gpu_memory": "4.2 GB",
                        "parameter_count": "7B + 8M (4-bit)",
                    },
                },
                {
                    "variant": "RAG + LoRA",
                    "status": "COMPLETED",
                    "metrics": {
                        "accuracy": 0.84,
                        "faithfulness": 0.88,
                        "recall_at_5": 0.86,
                        "mrr": 0.84,
                        "hallucination_rate": 0.06,
                        "response_time": 1.8,
                        "gpu_memory": "7.6 GB",
                        "parameter_count": "7B + 8M",
                    },
                },
                {
                    "variant": "RAG + QLoRA",
                    "status": "COMPLETED",
                    "metrics": {
                        "accuracy": 0.92,
                        "faithfulness": 0.94,
                        "recall_at_5": 0.91,
                        "mrr": 0.89,
                        "hallucination_rate": 0.046,
                        "response_time": 1.8,
                        "gpu_memory": "4.5 GB",
                        "parameter_count": "7B + 8M (4-bit)",
                    },
                },
            ]

            for item in runs_data:
                run = ExperimentRun(
                    experiment_id=exp.id,
                    model_version_id=None,
                    status=item["status"],
                    config_json={
                        "model_variant": item["variant"],
                        "dataset_name": "Customer Support QA Dataset",
                    },
                    metrics_json=item["metrics"],
                    started_at=datetime.now(timezone.utc),
                    finished_at=datetime.now(timezone.utc),
                )
                session.add(run)
                session.flush()

                for m_name, m_val in item["metrics"].items():
                    session.add(
                        EvaluationResult(
                            run_id=run.id,
                            metric_name=m_name,
                            metric_value=str(m_val),
                            details_json={"value": m_val},
                        )
                    )

        session.commit()
