import sqlite3
import json
from pathlib import Path

DB_PATH = (Path(__file__).parent / "supportiq.db").resolve()

def inspect_baseline():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT id, name, description FROM evaluation_datasets WHERE id = 2")
    ds2 = cur.fetchone()
    print("Dataset 2:", ds2)

    cur.execute("SELECT is_answerable, COUNT(*) FROM evaluation_test_cases WHERE dataset_id = 2 GROUP BY is_answerable")
    counts = cur.fetchall()
    print("Dataset 2 breakdown:", counts)

    for rid in [42, 54, 59]:
        cur.execute("SELECT id, experiment_id, status, config_json, metrics_json, started_at, finished_at FROM experiment_runs WHERE id = ?", (rid,))
        row = cur.fetchone()
        if row:
            config = json.loads(row[3]) if row[3] else {}
            metrics = json.loads(row[4]) if row[4] else {}
            print(f"\n--- RUN {rid} (Exp {row[1]}) ---")
            print("Status:", row[2])
            print("Config:", json.dumps(config, indent=2))
            print("Metrics:", json.dumps(metrics, indent=2))

    conn.close()

if __name__ == "__main__":
    inspect_baseline()
