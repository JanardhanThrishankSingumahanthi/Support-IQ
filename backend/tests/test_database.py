from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import Session

from app.db.base import Base


def sqlite_url(database_path: Path) -> str:
    return f"sqlite:///{database_path.resolve().as_posix()}"
from app.db.models import (
    Conversation,
    Document,
    Feedback,
    Message,
    Model,
    Permission,
    Role,
    Session as UserSession,
    SupportTicket,
    User,
)


def test_database_schema_can_be_created(tmp_path):
    database_path = tmp_path / "supportiq.db"
    engine = create_engine(sqlite_url(database_path))

    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    assert {"users", "roles", "permissions", "documents", "conversations", "messages", "support_tickets"}.issubset(tables)


def testDatabaseRelationshipsAndBasicCrud(tmp_path):
    database_path = tmp_path / "supportiq_crud.db"
    engine = create_engine(sqlite_url(database_path))
    Base.metadata.create_all(bind=engine)

    with Session(engine) as session:
        role = Role(name="admin", description="Administrator")
        permission = Permission(name="read:documents", description="Read documents")
        role.permissions.append(permission)

        user = User(email="admin@example.com", full_name="Admin User", role=role)
        session.add_all([role, permission, user])
        session.commit()

        document = Document(title="Knowledge Base", content="Root docs", owner_id=user.id)
        session.add(document)
        session.commit()

        conversation = Conversation(user_id=user.id, title="Customer issue")
        session.add(conversation)
        session.commit()

        message = Message(conversation_id=conversation.id, role="user", content="Hello")
        session.add(message)
        session.commit()

        ticket = SupportTicket(title="Billing issue", description="Need help", user_id=user.id)
        session.add(ticket)
        session.commit()

        model = Model(name="Support-Model", version="1.0.0")
        session.add(model)
        session.commit()

        feedback = Feedback(record_type="message", record_id=message.id, user_id=user.id, rating=5, comment="Helpful")
        session.add(feedback)
        session.commit()

        assert user.role.name == "admin"
        assert user.documents[0].title == "Knowledge Base"
        assert conversation.messages[0].content == "Hello"
        assert ticket.user_id == user.id
        assert model.name == "Support-Model"
        assert feedback.rating == 5


def test_alembic_upgrade_head_works(tmp_path):
    database_path = tmp_path / "alembic.db"
    alembic_dir = Path(__file__).resolve().parents[1] / "app" / "db" / "migrations"
    config = Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))
    config.set_main_option("script_location", str(alembic_dir))
    config.set_main_option("sqlalchemy.url", sqlite_url(database_path))

    command.upgrade(config, "head")

    engine = create_engine(sqlite_url(database_path))
    inspector = inspect(engine)
    assert "support_tickets" in inspector.get_table_names()
