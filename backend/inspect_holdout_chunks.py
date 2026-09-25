import sqlite3

def inspect():
    conn = sqlite3.connect("backend/supportiq.db")
    cur = conn.cursor()
    chunk_ids = [3, 4, 7, 9, 11, 12, 13]
    for cid in chunk_ids:
        row = cur.execute("SELECT c.id, c.document_id, d.title, c.chunk_index, c.content FROM document_chunks c JOIN documents d ON c.document_id = d.id WHERE c.id = ?", (cid,)).fetchone()
        if row:
            print(f"--- Chunk ID {row[0]}: Doc ID {row[1]} ('{row[2]}'), Index {row[3]} ---")
            print(row[4].strip())
            print()
    conn.close()

if __name__ == "__main__":
    inspect()
