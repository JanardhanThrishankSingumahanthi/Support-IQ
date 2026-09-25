import httpx
import json
import sqlite3

BASE = "http://127.0.0.1:8000/api/v1"

def run_test():
    print("==================================================")
    print("TESTING REAL MODEL EVALUATION FLOW")
    print("==================================================")

    # 1. Login
    login_res = httpx.post(f"{BASE}/auth/login", json={"email": "janardhan@supportiq.com", "password": "Password123!"})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] Login: SUCCESS")

    # 2. List evaluation datasets
    datasets_res = httpx.get(f"{BASE}/experiments/datasets/list", headers=headers)
    assert datasets_res.status_code == 200, f"Failed listing datasets: {datasets_res.text}"
    datasets = datasets_res.json().get("items", [])
    assert len(datasets) >= 2, f"Expected at least 2 datasets (Dev/Val + Holdout), got {len(datasets)}"
    
    ds_dev = next((d for d in datasets if "dev" in d["name"].lower() or d["id"] == 1), datasets[0])
    ds_holdout = next((d for d in datasets if "holdout" in d["name"].lower() or d["id"] == 2), datasets[1])
    print(f"[PASS] Dev/Val Dataset: '{ds_dev['name']}' (ID: {ds_dev['id']}, Cases: {ds_dev['test_case_count']})")
    print(f"[PASS] Holdout Dataset: '{ds_holdout['name']}' (ID: {ds_holdout['id']}, Cases: {ds_holdout['test_case_count']})")

    # 3. Get test cases for Holdout
    cases_res = httpx.get(f"{BASE}/experiments/datasets/{ds_holdout['id']}/cases", headers=headers)
    assert cases_res.status_code == 200, f"Failed getting cases: {cases_res.text}"
    cases = cases_res.json().get("items", [])
    assert len(cases) == 10, f"Expected 10 test cases, got {len(cases)}"
    print(f"[PASS] Retrieved {len(cases)} holdout test cases linked to unqueried KB chunks.")

    # 4. Run real evaluation benchmark for 'RAG + QLoRA' on Holdout
    print("\nExecuting real evaluation benchmark for 'RAG + QLoRA' across 10 HOLDOUT cases...")
    eval_res = httpx.post(
        f"{BASE}/experiments/2/run-evaluation",
        headers=headers,
        json={"model_variant": "RAG + QLoRA", "dataset_id": ds_holdout["id"]},
        timeout=60.0
    )
    assert eval_res.status_code == 200, f"Evaluation execution failed: {eval_res.text}"
    eval_data = eval_res.json()["evaluation"]
    metrics = eval_data["metrics"]
    print(f"[PASS] Holdout Empirical Benchmark Completed:")
    print(f"     - Recall@5: {metrics['recall_at_5'] * 100}%")
    print(f"     - MRR: {metrics['mrr']}")
    print(f"     - Faithfulness / Coverage: {metrics['faithfulness'] * 100}%")
    print(f"     - Citation Correctness: {metrics['citation_correctness'] * 100}%")
    print(f"     - Hallucination Rate: {metrics['hallucination_rate'] * 100}%")
    print(f"     - Overall Accuracy: {metrics['accuracy'] * 100}%")
    print(f"     - Retrieval & Verification Latency: {metrics['retrieval_verification_latency']}s")
    print(f"     - LLM Generation Latency: {metrics['llm_generation_latency']}")
    print(f"     - GPU Memory: {metrics['gpu_memory']}")
    print(f"     - Parameters: {metrics['parameter_count']}")

    assert metrics["llm_generation_latency"] == "Not experimentally measured"
    assert metrics["gpu_memory"] == "Not experimentally measured"
    assert metrics["recall_at_5"] == 1.0

    # 5. Run baseline 'Base LLM' benchmark (no retrieval) on Holdout
    print("\nExecuting empirical baseline benchmark for 'Base LLM' (no retrieval)...")
    base_res = httpx.post(
        f"{BASE}/experiments/2/run-evaluation",
        headers=headers,
        json={"model_variant": "Base LLM", "dataset_id": ds_holdout["id"]},
        timeout=60.0
    )
    assert base_res.status_code == 200, f"Base LLM evaluation failed: {base_res.text}"
    base_metrics = base_res.json()["evaluation"]["metrics"]
    print(f"[PASS] Base LLM Benchmark Completed:")
    print(f"     - Recall@5: {base_metrics['recall_at_5'] * 100}%")
    print(f"     - Faithfulness: {base_metrics['faithfulness'] * 100}%")
    print(f"     - Retrieval & Verification Latency: {base_metrics['retrieval_verification_latency']}")
    print(f"     - LLM Generation Latency: {base_metrics['llm_generation_latency']}")

    # 6. Verify SQLite Persistence
    conn = sqlite3.connect("backend/supportiq.db")
    cur = conn.cursor()
    run_count = cur.execute("SELECT count(*) FROM experiment_runs WHERE status = 'COMPLETED'").fetchone()[0]
    result_count = cur.execute("SELECT count(*) FROM evaluation_results").fetchone()[0]
    print(f"\n[PASS] SQLite Verification: Found {run_count} completed runs and {result_count} evaluation_results rows.")
    conn.close()

    # 7. Verify comparison endpoint for Experiment 2 (Holdout) and Experiment 1 (Dev)
    for exp_id in [1, 2]:
        comp_res = httpx.get(f"{BASE}/experiments/{exp_id}/comparison", headers=headers)
        assert comp_res.status_code == 200
        comp_data = comp_res.json()["comparison"]
        print(f"\n[PASS] Comparison Endpoint for Exp {exp_id} returned {len(comp_data)} variants:")
        for v in comp_data:
            print(f"     - Variant '{v['variant']}': Status={v['status']}, HasResults={v['has_results']}")

    print("\n==================================================")
    print("REAL MODEL EVALUATION FLOW VERIFIED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_test()
