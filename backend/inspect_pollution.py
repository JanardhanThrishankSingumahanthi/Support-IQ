import sqlite3
from pathlib import Path

DB_PATH = (Path(__file__).parent / "supportiq.db").resolve()

def inspect_pollution():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Documents
    cursor.execute("SELECT id, title, status, created_at FROM documents WHERE id >= 21 ORDER BY id ASC")
    test_docs = cursor.fetchall()
    print(f"1. Test Documents (IDs >= 21): {len(test_docs)}")
    for d in test_docs:
        print(f"   ID {d[0]}: {d[1]} (status={d[2]}, created={d[3]})")

    # 2. Chunks
    cursor.execute("SELECT COUNT(*) FROM document_chunks WHERE document_id >= 21")
    chunk_count = cursor.fetchone()[0]
    print(f"\n2. Associated Document Chunks: {chunk_count}")

    # 3. Citations & Evidence
    cursor.execute("SELECT COUNT(*) FROM citations WHERE document_id >= 21")
    cit_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM evidence WHERE document_id >= 21")
    evi_count = cursor.fetchone()[0]
    print(f"\n3. Citations referencing test docs: {cit_count}")
    print(f"   Evidence referencing test docs: {evi_count}")

    # 4. Conversations created today
    cursor.execute("SELECT id, title, created_at FROM conversations WHERE created_at >= '2026-09-28' ORDER BY id ASC")
    convs = cursor.fetchall()
    print(f"\n4. Conversations created today (2026-09-28): {len(convs)}")
    for c in convs:
        print(f"   Conv ID {c[0]}: {c[1]} (created={c[2]})")

    # 5. Check if any research datasets reference documents >= 21
    cursor.execute("SELECT COUNT(*) FROM evaluation_test_cases WHERE expected_document_id >= 21")
    ds_test_case_refs = cursor.fetchone()[0]
    print(f"\n5. Evaluation Test Cases referencing test docs: {ds_test_case_refs}")

    # 6. Check if any experiments or experiment_runs were modified or created today
    cursor.execute("SELECT COUNT(*) FROM experiments WHERE created_at >= '2026-09-28'")
    exp_today = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM experiment_runs WHERE created_at >= '2026-09-28'")
    runs_today = cursor.fetchone()[0]
    print(f"\n6. Experiments created today: {exp_today}")
    print(f"   Experiment runs created today: {runs_today}")

    conn.close()

if __name__ == "__main__":
    inspect_pollution()
