from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, relationship, mapped_column

from app.db.base import Base


role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.id"), primary_key=True),
    Index("ix_role_permissions_permission_id", "permission_id"),
)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class Role(Base, TimestampMixin):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)

    users: Mapped[list["User"]] = relationship(back_populates="role")
    permissions: Mapped[list["Permission"]] = relationship(
        secondary=role_permissions,
        back_populates="roles",
    )


class Permission(Base, TimestampMixin):
    __tablename__ = "permissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)

    roles: Mapped[list[Role]] = relationship(secondary=role_permissions, back_populates="permissions")


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    role_id: Mapped[int | None] = mapped_column(ForeignKey("roles.id"), index=True)

    role: Mapped[Role | None] = relationship(back_populates="users")
    sessions: Mapped[list["Session"]] = relationship(back_populates="user")
    documents: Mapped[list["Document"]] = relationship(back_populates="owner")
    conversations: Mapped[list["Conversation"]] = relationship(back_populates="user")
    support_tickets: Mapped[list["SupportTicket"]] = relationship(back_populates="user")
    feedback: Mapped[list["Feedback"]] = relationship(back_populates="user")
    analytics_events: Mapped[list["AnalyticsEvent"]] = relationship(back_populates="user")
    audit_logs: Mapped[list["AuditLog"]] = relationship(back_populates="user")
    security_events: Mapped[list["SecurityEvent"]] = relationship(back_populates="user")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="user")


class Session(Base, TimestampMixin):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    refresh_token_hash: Mapped[str | None] = mapped_column(String(255))
    is_valid: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    user: Mapped[User] = relationship(back_populates="sessions")


class Document(Base, TimestampMixin):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    content: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(50), default="draft", nullable=False)
    metadata_json: Mapped[dict | None] = mapped_column(JSON)
    owner_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True)

    owner: Mapped[User | None] = relationship(back_populates="documents")
    versions: Mapped[list["DocumentVersion"]] = relationship(back_populates="document")
    chunks: Mapped[list["DocumentChunk"]] = relationship(back_populates="document")
    citations: Mapped[list["Citation"]] = relationship(back_populates="document")
    evidence: Mapped[list["Evidence"]] = relationship(back_populates="document")


class DocumentVersion(Base, TimestampMixin):
    __tablename__ = "document_versions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id"), nullable=False, index=True)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    content_snapshot: Mapped[str | None] = mapped_column(Text)
    summary: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[str | None] = mapped_column(String(255))

    document: Mapped[Document] = relationship(back_populates="versions")

    __table_args__ = (UniqueConstraint("document_id", "version_number", name="uq_document_version_number"),)


class DocumentChunk(Base, TimestampMixin):
    __tablename__ = "document_chunks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id"), nullable=False, index=True)
    version_id: Mapped[int | None] = mapped_column(ForeignKey("document_versions.id"), index=True)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_json: Mapped[dict | None] = mapped_column(JSON)

    document: Mapped[Document] = relationship(back_populates="chunks")
    citations: Mapped[list["Citation"]] = relationship(back_populates="chunk")
    evidence: Mapped[list["Evidence"]] = relationship(back_populates="chunk")

    __table_args__ = (Index("ix_document_chunks_document_version_idx", "document_id", "version_id"),)


class Conversation(Base, TimestampMixin):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str | None] = mapped_column(String(255))
    state: Mapped[str] = mapped_column(String(50), default="open", nullable=False)

    user: Mapped[User | None] = relationship(back_populates="conversations")
    messages: Mapped[list["Message"]] = relationship(back_populates="conversation")
    claims: Mapped[list["Claim"]] = relationship(back_populates="conversation")


class Message(Base, TimestampMixin):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey("conversations.id"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_json: Mapped[dict | None] = mapped_column(JSON)

    conversation: Mapped[Conversation] = relationship(back_populates="messages")
    citations: Mapped[list["Citation"]] = relationship(back_populates="message")
    claims: Mapped[list["Claim"]] = relationship(back_populates="message")


class Citation(Base, TimestampMixin):
    __tablename__ = "citations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    message_id: Mapped[int | None] = mapped_column(ForeignKey("messages.id"), index=True)
    document_id: Mapped[int | None] = mapped_column(ForeignKey("documents.id"), index=True)
    chunk_id: Mapped[int | None] = mapped_column(ForeignKey("document_chunks.id"), index=True)
    quote: Mapped[str | None] = mapped_column(Text)
    start_char: Mapped[int | None] = mapped_column(Integer)
    end_char: Mapped[int | None] = mapped_column(Integer)

    message: Mapped[Message | None] = relationship(back_populates="citations")
    document: Mapped[Document | None] = relationship(back_populates="citations")
    chunk: Mapped[DocumentChunk | None] = relationship(back_populates="citations")


class Claim(Base, TimestampMixin):
    __tablename__ = "claims"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    conversation_id: Mapped[int | None] = mapped_column(ForeignKey("conversations.id"), index=True)
    message_id: Mapped[int | None] = mapped_column(ForeignKey("messages.id"), index=True)
    claim_text: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float | None] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)

    conversation: Mapped[Conversation | None] = relationship(back_populates="claims")
    message: Mapped[Message | None] = relationship(back_populates="claims")
    evidence: Mapped[list["Evidence"]] = relationship(back_populates="claim")


class Evidence(Base, TimestampMixin):
    __tablename__ = "evidence"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    claim_id: Mapped[int] = mapped_column(ForeignKey("claims.id"), nullable=False, index=True)
    document_id: Mapped[int | None] = mapped_column(ForeignKey("documents.id"), index=True)
    chunk_id: Mapped[int | None] = mapped_column(ForeignKey("document_chunks.id"), index=True)
    evidence_text: Mapped[str] = mapped_column(Text, nullable=False)
    score: Mapped[float | None] = mapped_column(String(50))

    claim: Mapped[Claim] = relationship(back_populates="evidence")
    document: Mapped[Document | None] = relationship(back_populates="evidence")
    chunk: Mapped[DocumentChunk | None] = relationship(back_populates="evidence")


class SupportTicket(Base, TimestampMixin):
    __tablename__ = "support_tickets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True)
    assigned_agent_id: Mapped[int | None] = mapped_column(Integer, index=True)
    conversation_id: Mapped[int | None] = mapped_column(Integer, index=True)
    customer_name: Mapped[str | None] = mapped_column(String(255), index=True)
    customer_email: Mapped[str | None] = mapped_column(String(255), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(String(100), index=True)
    status: Mapped[str] = mapped_column(String(50), default="Open", nullable=False, index=True)
    priority: Mapped[str] = mapped_column(String(50), default="Medium", nullable=False)
    source: Mapped[str | None] = mapped_column(String(100))
    reason: Mapped[str | None] = mapped_column(String(200), index=True)
    issue_question: Mapped[str | None] = mapped_column(Text)
    ai_answer: Mapped[str | None] = mapped_column(Text)
    escalation_reason: Mapped[str | None] = mapped_column(String(200), index=True)
    reliability_json: Mapped[dict | None] = mapped_column(JSON)
    evidence_json: Mapped[dict | None] = mapped_column(JSON)
    resolution_note: Mapped[str | None] = mapped_column(Text)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user: Mapped[User | None] = relationship(back_populates="support_tickets")
    messages: Mapped[list["TicketMessage"]] = relationship(back_populates="ticket")
    events: Mapped[list["TicketEvent"]] = relationship(back_populates="ticket")


class TicketMessage(Base, TimestampMixin):
    __tablename__ = "ticket_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    ticket_id: Mapped[int] = mapped_column(ForeignKey("support_tickets.id"), nullable=False, index=True)
    sender_type: Mapped[str] = mapped_column(String(50), nullable=False)
    sender_id: Mapped[int | None] = mapped_column(Integer)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    ticket: Mapped[SupportTicket] = relationship(back_populates="messages")


class TicketEvent(Base, TimestampMixin):
    __tablename__ = "ticket_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    ticket_id: Mapped[int] = mapped_column(ForeignKey("support_tickets.id"), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    details_json: Mapped[dict | None] = mapped_column(JSON)

    ticket: Mapped[SupportTicket] = relationship(back_populates="events")


class Model(Base, TimestampMixin):
    __tablename__ = "models"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    version: Mapped[str | None] = mapped_column(String(100), default="1.0.0", index=True)
    provider: Mapped[str | None] = mapped_column(String(100))
    model_type: Mapped[str | None] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)
    metadata_json: Mapped[dict | None] = mapped_column(JSON)

    versions: Mapped[list["ModelVersion"]] = relationship(back_populates="model")
    experiments: Mapped[list["Experiment"]] = relationship(back_populates="model")


class ModelVersion(Base, TimestampMixin):
    __tablename__ = "model_versions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    model_id: Mapped[int] = mapped_column(ForeignKey("models.id"), nullable=False, index=True)
    version: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="draft", nullable=False)
    config_json: Mapped[dict | None] = mapped_column(JSON)

    model: Mapped[Model] = relationship(back_populates="versions")
    experiment_runs: Mapped[list["ExperimentRun"]] = relationship(back_populates="model_version")

    __table_args__ = (UniqueConstraint("model_id", "version", name="uq_model_versions_model_version"),)


class Experiment(Base, TimestampMixin):
    __tablename__ = "experiments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    model_id: Mapped[int | None] = mapped_column(ForeignKey("models.id"), index=True)
    dataset_name: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(50), default="draft", nullable=False)
    created_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True)

    model: Mapped[Model | None] = relationship(back_populates="experiments")
    runs: Mapped[list["ExperimentRun"]] = relationship(back_populates="experiment")


class ExperimentRun(Base, TimestampMixin):
    __tablename__ = "experiment_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    experiment_id: Mapped[int] = mapped_column(ForeignKey("experiments.id"), nullable=False, index=True)
    model_version_id: Mapped[int | None] = mapped_column(ForeignKey("model_versions.id"), index=True)
    status: Mapped[str] = mapped_column(String(50), default="queued", nullable=False)
    config_json: Mapped[dict | None] = mapped_column(JSON)
    metrics_json: Mapped[dict | None] = mapped_column(JSON)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    experiment: Mapped[Experiment] = relationship(back_populates="runs")
    model_version: Mapped[ModelVersion | None] = relationship(back_populates="experiment_runs")
    evaluation_results: Mapped[list["EvaluationResult"]] = relationship(back_populates="run")


class EvaluationResult(Base, TimestampMixin):
    __tablename__ = "evaluation_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    run_id: Mapped[int] = mapped_column(ForeignKey("experiment_runs.id"), nullable=False, index=True)
    metric_name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    metric_value: Mapped[float | None] = mapped_column(String(50))
    details_json: Mapped[dict | None] = mapped_column(JSON)

    run: Mapped[ExperimentRun] = relationship(back_populates="evaluation_results")


class Feedback(Base, TimestampMixin):
    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True)
    record_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    record_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text)

    user: Mapped[User | None] = relationship(back_populates="feedback")

    __table_args__ = (Index("ix_feedback_user_record", "user_id", "record_type", "record_id"),)


class AnalyticsEvent(Base, TimestampMixin):
    __tablename__ = "analytics_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    event_name: Mapped[str | None] = mapped_column(String(150), index=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSON)

    user: Mapped[User | None] = relationship(back_populates="analytics_events")


class AuditLog(Base, TimestampMixin):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True)
    action: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    entity_id: Mapped[str | None] = mapped_column(String(255), index=True)
    details_json: Mapped[dict | None] = mapped_column(JSON)

    user: Mapped[User | None] = relationship(back_populates="audit_logs")


class SecurityEvent(Base, TimestampMixin):
    __tablename__ = "security_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True)
    event_type: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    severity: Mapped[str] = mapped_column(String(50), default="info", nullable=False)
    ip_address: Mapped[str | None] = mapped_column(String(100), index=True)
    details_json: Mapped[dict | None] = mapped_column(JSON)

    user: Mapped[User | None] = relationship(back_populates="security_events")


class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str | None] = mapped_column(Text)
    notification_type: Mapped[str] = mapped_column(String(80), default="info", nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped[User] = relationship(back_populates="notifications")


__all__ = [
    "AnalyticsEvent",
    "AuditLog",
    "Citation",
    "Claim",
    "Conversation",
    "Document",
    "DocumentChunk",
    "DocumentVersion",
    "EvaluationResult",
    "Evidence",
    "Experiment",
    "ExperimentRun",
    "Feedback",
    "Message",
    "Model",
    "ModelVersion",
    "Notification",
    "Permission",
    "Role",
    "SecurityEvent",
    "Session",
    "SupportTicket",
    "TicketEvent",
    "TicketMessage",
    "User",
]
