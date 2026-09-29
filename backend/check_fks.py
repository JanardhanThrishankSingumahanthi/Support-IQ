import sqlite3
from pathlib import Path

DB_PATH = (Path(__file__).parent / "supportiq.db").resolve()

def check_fks():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM document_versions WHERE document_id >= 21")
    print("document_versions for doc >= 21:", cur.fetchone()[0])

    cur.execute("SELECT COUNT(*) FROM audit_logs WHERE entity_type = 'document' AND CAST(entity_id AS INTEGER) >= 21")
    print("audit_logs for doc >= 21:", cur.fetchone()[0])

    cur.execute("SELECT COUNT(*) FROM feedback WHERE (record_type = 'document' AND record_id >= 21) OR (record_type = 'conversation' AND record_id BETWEEN 185 AND 190)")
    print("feedback for test records:", cur.fetchone()[0])

    cur.execute("SELECT COUNT(*) FROM ticket_messages WHERE ticket_id IN (SELECT id FROM support_tickets WHERE conversation_id BETWEEN 185 AND 190)")
    print("ticket_messages for test convs:", cur.fetchone()[0])

    cur.execute("SELECT COUNT(*) FROM ticket_events WHERE ticket_id IN (SELECT id FROM support_tickets WHERE conversation_id BETWEEN 185 AND 190)")
    print("ticket_events for test convs:", cur.fetchone()[0])

    conn.close()

if __name__ == "__main__":
    check_fks()
