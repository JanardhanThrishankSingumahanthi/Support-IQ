import sqlite3
import json
from pathlib import Path

DB_PATH = (Path(__file__).parent / "supportiq.db").resolve()

def audit():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    tables = [
        "users", "roles", "permissions", "user_roles", "role_permissions", "sessions",
        "documents", "document_chunks", "conversations", "messages", "citations", "claims", "evidence",
        "tickets", "experiments", "experiment_runs", "evaluation_datasets", "evaluation_test_cases",
        "evaluation_results", "models", "model_versions"
    ]

    print("=== DATABASE TABLE ROW COUNTS ===")
    for t in tables:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {t}")
            cnt = cursor.fetchone()[0]
            print(f"{t}: {cnt}")
        except Exception as e:
            print(f"{t}: ERROR ({e})")

    print("\n=== RESEARCH EVALUATION RUNS ===")
    cursor.execute("SELECT id, experiment_id, run_number, model_variant, accuracy, faithfulness, latency_sec, peak_vram_gb, execution_mode FROM experiment_runs ORDER BY id ASC")
    runs = cursor.fetchall()
    for r in runs:
        print(f"Run ID {r[0]}: Exp {r[1]} Run #{r[2]} | Variant: {r[3]} | Acc: {r[4]} | Faith: {r[5]} | Latency: {r[6]}s | VRAM: {r[7]}GB | Mode: {r[8]}")

    print("\n=== EVALUATION DATASETS ===")
    cursor.execute("SELECT id, name, description, sample_count FROM evaluation_datasets")
    for d in cursor.fetchall():
        print(f"Dataset ID {d[0]}: {d[1]} (sample_count: {d[3]})")

    print("\n=== EVALUATION TEST CASES PER DATASET ===")
    cursor.execute("SELECT dataset_id, COUNT(*) FROM evaluation_test_cases GROUP BY dataset_id")
    for row in cursor.fetchall():
        print(f"Dataset {row[0]}: {row[1]} test cases")

    print("\n=== VERIFIED MODELS IN DB ===")
    cursor.execute("SELECT id, name, model_family, parameters_million, quantization_bits, memory_footprint_mb, is_active FROM models")
    for m in cursor.fetchall():
        print(f"Model ID {m[0]}: {m[1]} | Params: {m[3]}M | Quant: {m[4]}-bit | Memory: {m[5]}MB | Active: {m[6]}")

    conn.close()

if __name__ == "__main__":
    audit()
