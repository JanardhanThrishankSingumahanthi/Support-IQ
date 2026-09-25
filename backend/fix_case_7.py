import sqlite3

def fix():
    conn = sqlite3.connect("backend/supportiq.db")
    cur = conn.cursor()
    # Find completed express replacement doc and chunk
    doc = cur.execute("SELECT id FROM documents WHERE title LIKE '%Express_Replacement%' AND status = 'COMPLETED' ORDER BY id ASC LIMIT 1").fetchone()
    if doc:
        doc_id = doc[0]
        chunk = cur.execute("SELECT id FROM document_chunks WHERE document_id = ? AND chunk_index = 1", (doc_id,)).fetchone()
        chunk_id = chunk[0] if chunk else None
        print(f"Updating Case 7 with expected_document_id={doc_id}, expected_chunk_id={chunk_id}")
        cur.execute("UPDATE evaluation_test_cases SET expected_document_id = ?, expected_chunk_id = ? WHERE id = 7", (doc_id, chunk_id))
        conn.commit()
    conn.close()
    print("Done fixing Case 7.")

if __name__ == "__main__":
    fix()
