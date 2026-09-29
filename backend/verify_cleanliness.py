import sqlite3
import json
from pathlib import Path

DB_PATH = (Path(__file__).parent / "supportiq.db").resolve()

def verify_research_cleanliness():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("--- 1. EVALUATION DATASETS ---")
    cursor.execute("SELECT id, name, description FROM evaluation_datasets ORDER BY id ASC")
    for row in cursor.fetchall():
        print(f"Dataset {row[0]}: {row[1]} | {row[2]}")

    print("\n--- 2. EVALUATION TEST CASES ---")
    cursor.execute("SELECT dataset_id, COUNT(*), SUM(is_answerable), SUM(CASE WHEN is_answerable = 0 THEN 1 ELSE 0 END) FROM evaluation_test_cases GROUP BY dataset_id")
    for row in cursor.fetchall():
        print(f"Dataset {row[0]}: Total={row[1]}, Answerable={row[2]}, Unanswerable={row[3]}")

    print("\n--- 3. EXPERIMENTS ---")
    cursor.execute("SELECT id, name, dataset_name, status, created_at FROM experiments ORDER BY id ASC")
    for row in cursor.fetchall():
        print(f"Exp {row[0]}: {row[1]} | Dataset: {row[2]} | Status: {row[3]} | Created: {row[4]}")

    print("\n--- 4. KEY BENCHMARK RUNS ---")
    target_runs = [42, 54, 59]
    for rid in target_runs:
        cursor.execute("SELECT id, experiment_id, status, config_json, metrics_json, created_at FROM experiment_runs WHERE id = ?", (rid,))
        r = cursor.fetchone()
        if r:
            config = json.loads(r[3]) if r[3] else {}
            metrics = json.loads(r[4]) if r[4] else {}
            print(f"Run ID {r[0]} (Exp {r[1]}): Status={r[2]}")
            print(f"   Model: {config.get('model_variant') or config.get('model_name')}")
            print(f"   Accuracy: {metrics.get('accuracy')}")
            print(f"   Faithfulness: {metrics.get('faithfulness')}")
            print(f"   Latency: {metrics.get('llm_generation_latency_sec') or metrics.get('retrieval_verification_latency')}s")
            print(f"   VRAM: {metrics.get('peak_vram_gb')} GB")
        else:
            print(f"Run ID {rid}: NOT FOUND!")

    print("\n--- 5. CHECK FOR TEST POLLUTION IN RESEARCH TABLES ---")
    cursor.execute("SELECT COUNT(*) FROM evaluation_test_cases WHERE question LIKE '%SLA%' OR question LIKE '%malicious%'")
    print(f"Test queries in evaluation_test_cases: {cursor.fetchone()[0]}")

    cursor.execute("SELECT COUNT(*) FROM experiment_runs WHERE experiment_id NOT IN (1, 2, 3, 4, 7, 12)")
    print(f"Unapproved experiment runs: {cursor.fetchone()[0]}")

    conn.close()

if __name__ == "__main__":
    verify_research_cleanliness()
