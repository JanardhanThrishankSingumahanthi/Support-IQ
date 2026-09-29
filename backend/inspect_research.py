import sqlite3
import json
from pathlib import Path

DB_PATH = (Path(__file__).parent / "supportiq.db").resolve()

def inspect_research():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("=== EVALUATION DATASETS ===")
    cursor.execute("SELECT id, name, description FROM evaluation_datasets")
    for row in cursor.fetchall():
        print(f"ID {row[0]}: {row[1]} | {row[2]}")

    print("\n=== EVALUATION TEST CASES BREAKDOWN ===")
    cursor.execute("SELECT dataset_id, is_answerable, COUNT(*) FROM evaluation_test_cases GROUP BY dataset_id, is_answerable")
    for row in cursor.fetchall():
        print(f"Dataset {row[0]} | is_answerable={row[1]}: {row[2]} cases")

    print("\n=== EXPERIMENTS ===")
    cursor.execute("SELECT id, name, description, dataset_name, status FROM experiments")
    for row in cursor.fetchall():
        print(f"Exp ID {row[0]}: {row[1]} | Dataset: {row[3]} | Status: {row[4]}")

    print("\n=== EXPERIMENT RUNS ===")
    cursor.execute("SELECT id, experiment_id, status, config_json, metrics_json FROM experiment_runs ORDER BY id ASC")
    for row in cursor.fetchall():
        config = json.loads(row[3]) if row[3] else {}
        metrics = json.loads(row[4]) if row[4] else {}
        print(f"Run ID {row[0]}: Exp {row[1]} | Status: {row[2]} | Model: {config.get('model_variant') or config.get('model_name')} | Metrics: {metrics}")

    conn.close()

if __name__ == "__main__":
    inspect_research()
