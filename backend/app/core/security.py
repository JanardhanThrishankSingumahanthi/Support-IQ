from __future__ import annotations

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 200_000)
    return f"pbkdf2_sha256$200000${salt}${digest.hex()}"


def verify_password(password: str, password_hash: str | None) -> bool:
    if not password_hash or not password_hash.startswith("pbkdf2_sha256$"):
        return False

    try:
        _, iterations_str, salt, expected = password_hash.split("$")
        iterations = int(iterations_str)
        digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations)
        return hmac.compare_digest(digest.hex(), expected)
    except (TypeError, ValueError):
        return False


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_token(length: int = 32) -> str:
    return secrets.token_urlsafe(length)


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def session_expiration(minutes: int = 480) -> datetime:
    return utcnow() + timedelta(minutes=minutes)
