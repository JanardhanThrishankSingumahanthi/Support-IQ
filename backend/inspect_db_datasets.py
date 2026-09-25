import sqlite3

def main():
    conn = sqlite3.connect('backend/supportiq.db')
    cursor = conn.cursor()

    print("=== EVALUATION DATASETS ===")
    for row in cursor.execute('SELECT id, name, description, version FROM evaluation_datasets').fetchall():
        print(f"Dataset {row[0]}: {row[1]} (v{row[3]}) - {row[2]}")

    print("\n=== TEST CASES PER DATASET ===")
    for row in cursor.execute('SELECT dataset_id, count(*) FROM evaluation_test_cases GROUP BY dataset_id').fetchall():
        print(f"Dataset {row[0]}: {row[1]} cases")

    print("\n=== DEV/VALIDATION CASES (DATASET 1) ===")
    for row in cursor.execute('SELECT id, question, expected_answer, category, is_answerable, expected_chunk_id FROM evaluation_test_cases WHERE dataset_id = 1').fetchall():
        ans = (row[2] or '<NONE/UNANSWERABLE>')[:80]
        print(f"Case {row[0]}: [{row[3]}] (Answerable: {row[4]}, Chunk: {row[5]})\n  Q: {row[1]}\n  A: {ans}...")

    print("\n=== HOLDOUT CASES (DATASET 2) ===")
    holdout_questions = []
    for row in cursor.execute('SELECT id, question, expected_answer, category, is_answerable, expected_chunk_id FROM evaluation_test_cases WHERE dataset_id = 2').fetchall():
        ans = (row[2] or '<NONE/UNANSWERABLE>')[:80]
        holdout_questions.append((row[0], row[1]))
        print(f"Holdout Case {row[0]}: [{row[3]}] (Answerable: {row[4]}, Chunk: {row[5]})\n  Q: {row[1]}\n  A: {ans}...")

    print("\n=== KNOWLEDGE BASE DOCUMENTS ===")
    for row in cursor.execute('SELECT id, title, status, length(content) FROM documents').fetchall():
        print(f"Doc {row[0]}: '{row[1]}' | status={row[2]} | length={row[3]} chars")

    chunk_count = cursor.execute('SELECT count(*) FROM document_chunks').fetchone()[0]
    print(f"\nTotal document chunks in database: {chunk_count}")

    print("\n=== DOCUMENT CHUNKS SUMMARY BY DOCUMENT ===")
    for row in cursor.execute('SELECT document_id, count(*), min(chunk_index), max(chunk_index) FROM document_chunks GROUP BY document_id').fetchall():
        print(f"Doc {row[0]}: {row[1]} chunks (indices {row[2]}..{row[3]})")

    conn.close()

if __name__ == "__main__":
    main()
