import sqlite3

def main():
    conn = sqlite3.connect('backend/supportiq.db')
    cursor = conn.cursor()

    rows = cursor.execute('''
        SELECT c.id, c.document_id, d.title, c.chunk_index, c.content
        FROM document_chunks c
        JOIN documents d ON c.document_id = d.id
        WHERE c.id <= 15
        ORDER BY c.id ASC
    ''').fetchall()

    for cid, did, dtitle, cidx, content in rows:
        print(f"\n--- Chunk ID: {cid} | Doc ID: {did} ('{dtitle}') | Chunk Index: {cidx} ---")
        print(content.strip())

    conn.close()

if __name__ == "__main__":
    main()
