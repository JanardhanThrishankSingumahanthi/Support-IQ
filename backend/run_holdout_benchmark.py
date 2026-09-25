import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from app.db.session import SessionLocal
from app.db.models import Experiment, EvaluationDataset, ExperimentRun
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

        print(f"==================================================")
        print(f"RUNNING EMPIRICAL HOLDOUT BENCHMARK (UNSEEN DATA)")
        print(f"Dataset: '{holdout_ds.name}' ({len(holdout_ds.test_cases)} cases)")
        print(f"==================================================")

        # 2. Create or find Experiment for Holdout
        exp_holdout = db.query(Experiment).filter(Experiment.name == "SupportIQ Holdout Test Benchmark").first()
        if not exp_holdout:
            exp_holdout = Experiment(
                name="SupportIQ Holdout Test Benchmark",
                description="Independent empirical evaluation on previously unqueried Knowledge Base chunks and novel unsupported queries.",
                dataset_name=holdout_ds.name,
                status="RUNNING",
                created_by_user_id=1,
            )
            db.add(exp_holdout)
            db.commit()
            db.refresh(exp_holdout)

        # Also run on Experiment 1 so Experiment 1 has runs on dataset 2 if queried
        variants = ["Base LLM", "RAG Base", "LoRA", "QLoRA", "RAG + LoRA", "RAG + QLoRA"]
        holdout_results = {}

        for variant in variants:
            print(f"\n--- Evaluating Variant: '{variant}' on Holdout Test Set ---")
            res = runner.run_benchmark(
                experiment_id=exp_holdout.id,
                dataset_id=holdout_ds.id,
                model_variant=variant,
            )
            metrics = res["metrics"]
            holdout_results[variant] = {
                "metrics": metrics,
                "case_evaluations": res["case_evaluations"],
            }
            print(f"  Accuracy: {metrics['accuracy'] * 100:.1f}%")
            print(f"  Faithfulness: {metrics['faithfulness'] * 100:.1f}%")
            print(f"  Recall@5: {metrics['recall_at_5'] * 100:.1f}%")
            print(f"  MRR: {metrics['mrr']:.4f}")
            print(f"  Hallucination Rate: {metrics['hallucination_rate'] * 100:.1f}%")
            print(f"  Citation Correctness: {metrics['citation_correctness'] * 100:.1f}%")
            print(f"  Retrieval & Verification Latency: {metrics['retrieval_verification_latency']}")
            print(f"  LLM Generation Latency: {metrics['llm_generation_latency']}")

        # Print detailed per-case breakdown for proposed model (RAG + QLoRA)
        print("\n==================================================")
        print("PER-CASE BREAKDOWN FOR 'RAG + QLoRA' (HOLDOUT TEST)")
        print("==================================================")
        for idx, ce in enumerate(holdout_results["RAG + QLoRA"]["case_evaluations"], start=1):
            q_type = "ANSWERABLE" if ce.get("is_answerable") else "UNSUPPORTED"
            print(f"\nCase #{idx} [ID {ce.get('test_case_id')}] ({q_type}) Cat: {ce.get('category')}")
            print(f"  Question: {ce.get('question')}")
            print(f"  Answer / Refusal: {ce.get('answer')[:120]}...")
            print(f"  Status: {ce.get('generation_status')}")
            print(f"  Retrieved Chunks: {ce.get('retrieved_chunk_count')}")
            if ce.get("is_answerable"):
                print(f"  Recall@5: {ce.get('recall_at_5')}, MRR: {ce.get('mrr')}, Coverage: {ce.get('coverage')}, Citation Correct: {ce.get('citation_correct')}")
            else:
                print(f"  Hallucinated: {ce.get('hallucinated')}, Correct Refusal: {ce.get('correct_refusal')}")
            print(f"  Retrieval/Verification Latency: {ce.get('retrieval_verification_latency_sec')}s | LLM Gen Latency: {ce.get('llm_generation_latency_sec')}")
            print(f"  Overall Accurate: {ce.get('accurate')}")

        # Save summary report to JSON
        with open("backend/holdout_benchmark_summary.json", "w") as f:
            json.dump(holdout_results, f, indent=2)
        print("\n[OK] Saved holdout benchmark summary to backend/holdout_benchmark_summary.json")

    finally:
        db.close()

if __name__ == "__main__":
    run()
