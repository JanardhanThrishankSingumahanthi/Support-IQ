import sqlite3
from pathlib import Path

DB_PATH = (Path(__file__).parent / "supportiq.db").resolve()

def inspect_all_convs():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT id, title, created_at FROM conversations ORDER BY id DESC LIMIT 20")
    print("Latest 20 conversations:")
    for row in cur.fetchall():
        print(f"  ID {row[0]}: {row[1]} (created={row[2]})")

    cur.execute("SELECT COUNT(*) FROM conversations")
    print("Total conversations in DB:", cur.fetchone()[0])

    cur.execute("SELECT COUNT(*) FROM messages")
    print("Total messages in DB:", cur.fetchone()[0])

    # Check if any messages exist that were NOT part of conversations 185-190 created today
    cur.execute("SELECT id, conversation_id, role, created_at FROM messages WHERE conversation_id NOT BETWEEN 185 AND 190 AND created_at >= '2026-09-28'")
    other_msgs_today = cur.fetchall()
    print(f"Other messages created today outside convs 185-190: {len(other_msgs_today)}")

    conn.close()

if __name__ == "__main__":
    inspect_all_convs()
