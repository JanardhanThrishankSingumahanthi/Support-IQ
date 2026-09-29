import sqlite3
import os
from pathlib import Path

DB_PATH = (Path(__file__).parent / "supportiq.db").resolve()
STORAGE_DIR = (Path(__file__).parent / "app" / "storage" / "documents").resolve()

def clean_test_data():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    print("=== STARTING CLEANUP OF TEMPORARY TEST DATA ===")

    # 1. Evidence
    cur.execute("""
        DELETE FROM evidence 
        WHERE document_id >= 21 
           OR claim_id IN (SELECT id FROM claims WHERE conversation_id BETWEEN 185 AND 190)
    """)
    deleted_evidence = cur.rowcount
    print(f"1. Deleted evidence records: {deleted_evidence}")

    # 2. Citations
    cur.execute("""
        DELETE FROM citations 
        WHERE document_id >= 21 
           OR message_id IN (SELECT id FROM messages WHERE conversation_id BETWEEN 185 AND 190)
    """)
    deleted_citations = cur.rowcount
    print(f"2. Deleted citation records: {deleted_citations}")

    # 3. Claims
    cur.execute("DELETE FROM claims WHERE conversation_id BETWEEN 185 AND 190")
    deleted_claims = cur.rowcount
    print(f"3. Deleted claims records: {deleted_claims}")

    # 4. Messages
    cur.execute("DELETE FROM messages WHERE conversation_id BETWEEN 185 AND 190")
    deleted_messages = cur.rowcount
    print(f"4. Deleted messages records: {deleted_messages}")

    # 5. Conversations
    cur.execute("DELETE FROM conversations WHERE id BETWEEN 185 AND 190")
    deleted_conversations = cur.rowcount
    print(f"5. Deleted conversations records: {deleted_conversations}")

    # 6. Document chunks
    cur.execute("DELETE FROM document_chunks WHERE document_id >= 21")
    deleted_chunks = cur.rowcount
    print(f"6. Deleted document_chunks: {deleted_chunks}")

    # 7. Documents
    cur.execute("DELETE FROM documents WHERE id >= 21")
    deleted_docs = cur.rowcount
    print(f"7. Deleted documents: {deleted_docs}")

    # Commit DB changes
    conn.commit()

    # 8. Physical files
    deleted_files = []
    if STORAGE_DIR.exists():
        for f in STORAGE_DIR.iterdir():
            if f.is_file():
                prefix = f.name.split("-")[0]
                if prefix.isdigit() and 21 <= int(prefix) <= 35:
                    f.unlink()
                    deleted_files.append(f.name)
    print(f"8. Deleted physical files: {len(deleted_files)}")
    for fn in deleted_files:
        print(f"   Removed: {fn}")

    # === POST-CLEANUP VERIFICATIONS ===
    print("\n=== POST-CLEANUP VERIFICATIONS ===")

    cur.execute("SELECT COUNT(*) FROM documents WHERE id >= 21")
    docs_remaining = cur.fetchone()[0]
    print(f"Documents with ID >= 21: {docs_remaining} (Expected: 0)")

    cur.execute("SELECT COUNT(*) FROM document_chunks WHERE document_id >= 21")
    chunks_remaining = cur.fetchone()[0]
    print(f"Chunks with document_id >= 21: {chunks_remaining} (Expected: 0)")

    cur.execute("SELECT COUNT(*) FROM conversations WHERE id BETWEEN 185 AND 190")
    convs_remaining = cur.fetchone()[0]
    print(f"Conversations 185-190: {convs_remaining} (Expected: 0)")

    cur.execute("SELECT COUNT(*) FROM messages WHERE conversation_id BETWEEN 185 AND 190")
    msgs_remaining = cur.fetchone()[0]
    print(f"Messages in 185-190: {msgs_remaining} (Expected: 0)")

    cur.execute("SELECT COUNT(*) FROM citations WHERE document_id >= 21")
    cits_remaining = cur.fetchone()[0]
    print(f"Citations for doc >= 21: {cits_remaining} (Expected: 0)")

    cur.execute("SELECT COUNT(*) FROM evidence WHERE document_id >= 21")
    ev_remaining = cur.fetchone()[0]
    print(f"Evidence for doc >= 21: {ev_remaining} (Expected: 0)")

    # Verify Research Datasets
    print("\n--- RESEARCH INTEGRITY CHECKS ---")
    cur.execute("SELECT COUNT(*) FROM evaluation_test_cases WHERE dataset_id = 1")
    ds1_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM evaluation_test_cases WHERE dataset_id = 2")
    ds2_count = cur.fetchone()[0]
    print(f"Dataset 1 test cases: {ds1_count} (Expected: 10)")
    print(f"Dataset 2 test cases: {ds2_count} (Expected: 10)")

    # Verify Experiments
    cur.execute("SELECT id, name, status FROM experiments WHERE id IN (1, 2, 3, 4, 7, 12) ORDER BY id ASC")
    experiments = cur.fetchall()
    print(f"Verified Experiments count: {len(experiments)} (Expected: 6)")
    for exp in experiments:
        print(f"  Exp {exp[0]}: {exp[1]} [{exp[2]}]")

    # Verify Key Runs
    for rid in [42, 54, 59]:
        cur.execute("SELECT id, experiment_id, status FROM experiment_runs WHERE id = ?", (rid,))
        r = cur.fetchone()
        print(f"  Run {rid}: {r}")

    conn.close()

if __name__ == "__main__":
    clean_test_data()
