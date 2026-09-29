import sqlite3
from pathlib import Path
from app.core.security import verify_password

DB_PATH = (Path(__file__).parent / "supportiq.db").resolve()

def check_users():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT id, email, password_hash FROM users")
    users = cur.fetchall()
    print("Users in DB:")
    test_passwords = ["admin123", "SupportIQ2026!", "change-me-in-dev", "secret", "password"]
    for u in users:
        matched = []
        for p in test_passwords:
            if u[2] and verify_password(p, u[2]):
                matched.append(p)
        print(f"  ID {u[0]}: {u[1]} -> matched: {matched}")
    conn.close()

if __name__ == "__main__":
    check_users()
