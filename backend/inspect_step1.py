import sqlite3
from pathlib import Path

DB_PATH = (Path(__file__).parent / "supportiq.db").resolve()

def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    print("=== DOCUMENTS >= 21 ===")
    cur.execute("SELECT id, title, status, created_at FROM documents WHERE id >= 21 ORDER BY id ASC")
    docs = cur.fetchall()
    print(f"Total: {len(docs)}")
    for d in docs:
        print(f"  ID {d[0]}: {d[1]} (status={d[2]})")

    print("\n=== CHUNKS FOR DOCS >= 21 ===")
    cur.execute("SELECT MIN(id), MAX(id), COUNT(*) FROM document_chunks WHERE document_id >= 21")
    chunk_info = cur.fetchone()
    print(f"Chunk IDs min={chunk_info[0]}, max={chunk_info[1]}, count={chunk_info[2]}")

    print("\n=== CITATIONS FOR DOCS >= 21 ===")
    cur.execute("SELECT id, message_id, document_id, chunk_id FROM citations WHERE document_id >= 21")
    cits = cur.fetchall()
    print(f"Total citations: {len(cits)}")
    for c in cits:
        print(f"  Citation ID {c[0]}: msg_id={c[1]}, doc_id={c[2]}, chunk_id={c[3]}")

    print("\n=== EVIDENCE FOR DOCS >= 21 ===")
    cur.execute("SELECT id, claim_id, document_id, chunk_id FROM evidence WHERE document_id >= 21")
    evs = cur.fetchall()
    print(f"Total evidence: {len(evs)}")
    for e in evs:
        print(f"  Evidence ID {e[0]}: claim_id={e[1]}, doc_id={e[2]}, chunk_id={e[3]}")

    print("\n=== CONVERSATIONS 185 to 190 ===")
    cur.execute("SELECT id, title, state, created_at FROM conversations WHERE id BETWEEN 185 AND 190 ORDER BY id ASC")
    convs = cur.fetchall()
    print(f"Total conversations: {len(convs)}")
    for c in convs:
        print(f"  Conv ID {c[0]}: {c[1]} (state={c[2]})")

    print("\n=== MESSAGES IN CONVERSATIONS 185 to 190 ===")
    cur.execute("SELECT id, conversation_id, role, content FROM messages WHERE conversation_id BETWEEN 185 AND 190 ORDER BY id ASC")
    msgs = cur.fetchall()
    print(f"Total messages: {len(msgs)}")
    for m in msgs:
        content_preview = (m[3][:60] + "...") if len(m[3]) > 60 else m[3]
        print(f"  Msg ID {m[0]}: conv_id={m[1]}, role={m[2]}, content={repr(content_preview)}")

    print("\n=== CLAIMS IN CONVERSATIONS 185 to 190 ===")
    cur.execute("SELECT id, conversation_id, message_id, claim_text FROM claims WHERE conversation_id BETWEEN 185 AND 190")
    claims = cur.fetchall()
    print(f"Total claims: {len(claims)}")
    for cl in claims:
        print(f"  Claim ID {cl[0]}: conv_id={cl[1]}, msg_id={cl[2]}, text={repr(cl[3][:50])}")

    # Check foreign keys pointing to conversations 185-190
    print("\n=== SUPPORT TICKETS WITH CONVERSATION 185-190 ===")
    cur.execute("SELECT id, conversation_id, title FROM support_tickets WHERE conversation_id BETWEEN 185 AND 190")
    tickets = cur.fetchall()
    print(f"Total tickets: {len(tickets)}")

    print("\n=== EVALUATION DATASETS AND CASES ===")
    cur.execute("SELECT id, name FROM evaluation_datasets")
    for d in cur.fetchall():
        cur.execute("SELECT COUNT(*) FROM evaluation_test_cases WHERE dataset_id = ?", (d[0],))
        cnt = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM evaluation_test_cases WHERE dataset_id = ? AND (expected_document_id >= 21 OR expected_chunk_id >= 83)", (d[0],))
        polluted = cur.fetchone()[0]
        print(f"Dataset {d[0]} ({d[1]}): {cnt} cases, {polluted} referencing test docs/chunks")

    print("\n=== EXPERIMENTS AND RUNS ===")
    cur.execute("SELECT id, name FROM experiments WHERE id IN (1, 2, 3, 4, 7, 12)")
    for ex in cur.fetchall():
        print(f"Experiment {ex[0]}: {ex[1]}")
    for run_id in [42, 54, 59]:
        cur.execute("SELECT id, experiment_id, status FROM experiment_runs WHERE id = ?", (run_id,))
        r = cur.fetchone()
        print(f"Run {run_id}: {r}")

    conn.close()

if __name__ == "__main__":
    main()
