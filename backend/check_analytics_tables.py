import sqlite3
from pathlib import Path

DB_PATH = (Path(__file__).parent / "supportiq.db").resolve()

def check_analytics_tables():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM analytics_events")
    print("analytics_events count:", cur.fetchone()[0])

    cur.execute("SELECT COUNT(*) FROM audit_logs WHERE created_at >= '2026-09-28'")
    print("audit_logs today count:", cur.fetchone()[0])

    cur.execute("SELECT COUNT(*) FROM security_events WHERE created_at >= '2026-09-28'")
    print("security_events today count:", cur.fetchone()[0])

    conn.close()

if __name__ == "__main__":
    check_analytics_tables()
