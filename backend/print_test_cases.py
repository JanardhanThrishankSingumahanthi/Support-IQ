import sqlite3
from pathlib import Path

DB_PATH = (Path(__file__).parent / "supportiq.db").resolve()

def print_test_cases():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    for ds_id in [1, 2]:
        print(f"\n=== DATASET {ds_id} TEST CASES ===")
        cursor.execute("SELECT id, question, is_answerable, created_at FROM evaluation_test_cases WHERE dataset_id = ? ORDER BY id ASC", (ds_id,))
        for r in cursor.fetchall():
            print(f"ID {r[0]} | Ans: {r[2]} | Created: {r[3]} | Q: {r[1]}")
    conn.close()

if __name__ == "__main__":
    print_test_cases()
