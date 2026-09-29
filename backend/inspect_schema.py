import sqlite3
from pathlib import Path

DB_PATH = (Path(__file__).parent / "supportiq.db").resolve()

def inspect():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [r[0] for r in cursor.fetchall()]
    print("Tables:", tables)

    for t in tables:
        cursor.execute(f"PRAGMA table_info({t})")
        cols = [c[1] for c in cursor.fetchall()]
        print(f"\n{t} columns: {cols}")

    conn.close()

if __name__ == "__main__":
    inspect()
