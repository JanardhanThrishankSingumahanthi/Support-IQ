import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from app.db.session import SessionLocal
from app.db.models import Experiment, EvaluationDataset, ExperimentRun, EvaluationResult
from app.services.evaluation_runner import EvaluationRunner

def run():
    db = SessionLocal()
    try:
        runner = EvaluationRunner(db=db)

        # 1. Fetch Holdout Dataset (ID 2)
        holdout_ds = db.query(EvaluationDataset).filter(EvaluationDataset.id == 2).first()
        if not holdout_ds:
            print("[ERROR] Holdout dataset ID 2 not found!")
            return

        print("==================================================")
        print("RUNNING FINAL FROZEN HOLDOUT EVALUATION")
        print(f"Dataset: '{holdout_ds.name}' (ID: {holdout_ds.id}, {len(holdout_ds.test_cases)} cases)")
        print("Rules: STRICTLY FROZEN from Dev/Validation calibration")
        print("==================================================")

        # 2. Create new Experiment 3 for the Frozen Final Holdout (preserving Exp 2 historical)
        exp_final = Experiment(
            name="SupportIQ Frozen Final Holdout Benchmark",
            description="Final frozen empirical evaluation on unobserved Holdout Test Benchmark v1 with rules locked from Dev/Validation tuning.",
            dataset_name=holdout_ds.name,
            status="RUNNING",
            created_by_user_id=1,
        )
        db.add(exp_final)
        db.commit()
        db.refresh(exp_final)
        print(f"[OK] Created Experiment #{exp_final.id}: '{exp_final.name}'")

        # 3. Benchmark all 6 model variants
        variants = ["Base LLM", "RAG Base", "LoRA", "QLoRA", "RAG + LoRA", "RAG + QLoRA"]
        final_benchmark_results = {}

        for variant in variants:
            print(f"\n--- Running Frozen Benchmark: '{variant}' ---")
            res = runner.run_benchmark(
                experiment_id=exp_final.id,
                dataset_id=holdout_ds.id,
                model_variant=variant,
            )
            m = res["metrics"]
            final_benchmark_results[variant] = {
                "run_id": res["run_id"],
                "metrics": m,
                "case_evaluations": res["case_evaluations"],
            }
            print(f"  Accuracy: {m['accuracy'] * 100:.1f}%")
            print(f"  Recall@5: {m['recall_at_5'] * 100:.1f}%")
            print(f"  MRR: {m['mrr']:.4f}")
            print(f"  Faithfulness: {m['faithfulness'] * 100:.1f}%")
            print(f"  Citation Correctness: {m['citation_correctness'] * 100:.1f}%")
            print(f"  Hallucination Rate: {m['hallucination_rate'] * 100:.1f}%")
            print(f"  Retrieval & Verification Latency: {m['retrieval_verification_latency']}s")
            print(f"  LLM Generation Latency: {m['llm_generation_latency']}")

        exp_final.status = "COMPLETED"
        db.commit()

        # 4. Detailed Per-Case Results for Proposed System (RAG + QLoRA)
        print("\n==================================================")
        print("PER-CASE RESULTS FOR 'RAG + QLoRA' (FROZEN HOLDOUT)")
        print("==================================================")
        qlora_cases = final_benchmark_results["RAG + QLoRA"]["case_evaluations"]
        for idx, ce in enumerate(qlora_cases, start=1):
            q_type = "ANSWERABLE" if ce.get("is_answerable") else "UNSUPPORTED"
            print(f"\nCase #{idx} [ID {ce.get('test_case_id')}] ({q_type}) Cat: {ce.get('category')}")
            print(f"  Question: {ce.get('question')}")
            print(f"  Status: {ce.get('generation_status')}")
            print(f"  Answer/Refusal: {ce.get('answer')[:120]}...")
            if ce.get("is_answerable"):
                print(f"  Recall@5: {ce.get('recall_at_5')}, MRR: {ce.get('mrr')}, Coverage: {ce.get('coverage')}, Citation Valid: {ce.get('citation_correct')}")
            else:
                print(f"  Hallucinated: {ce.get('hallucinated')}, Correct Refusal: {ce.get('correct_refusal')}")
            print(f"  Retrieval/Verification Latency: {ce.get('retrieval_verification_latency_sec')}s | LLM Gen Latency: {ce.get('llm_generation_latency_sec')}")
            print(f"  Accurate: {ce.get('accurate')}")

        # 5. Verify SQLite Persistence
        exp_count = db.query(Experiment).count()
        run_count = db.query(ExperimentRun).filter(ExperimentRun.status == "COMPLETED").count()
        result_count = db.query(EvaluationResult).count()
        print("\n==================================================")
        print("SQLITE PERSISTENCE VERIFICATION")
        print("==================================================")
        print(f"Experiments in DB: {exp_count}")
        print(f"Completed Experiment Runs in DB: {run_count}")
        print(f"Evaluation Results Rows in DB: {result_count}")

        # Save summary report
        with open("backend/final_frozen_holdout_summary.json", "w") as f:
            json.dump(final_benchmark_results, f, indent=2)
        print("\n[OK] Summary persisted to backend/final_frozen_holdout_summary.json")

    finally:
        db.close()

if __name__ == "__main__":
    run()
