from __future__ import annotations

from sqlalchemy import text

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.base import Base
from app.db.models import Permission, Role, User
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
        ensure_roles_and_permissions(session)

        admin_role = session.query(Role).filter_by(name="Administrator").first()
        existing_user = session.query(User).filter_by(email=settings.dev_admin_email).first()
        if existing_user is None:
            user = User(
                email=settings.dev_admin_email,
                full_name="Development Admin",
                password_hash=hash_password(settings.dev_admin_password),
                role_id=admin_role.id,
                is_active=True,
            )
            session.add(user)

        session.execute(text("SELECT 1"))
        session.commit()

        # The development seed user intentionally uses environment-controlled credentials.
        # This is isolated to local development and must not be used in production.
