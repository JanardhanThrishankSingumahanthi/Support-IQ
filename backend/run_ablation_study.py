import json
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from app.db.session import SessionLocal
from app.db.models import Experiment, EvaluationDataset
from app.services.evaluation_runner import EvaluationRunner

def run_ablation():
    db = SessionLocal()
    runner = EvaluationRunner(db=db)

    # 1. Fetch or create Experiment 4 for the ablation study
    exp = db.query(Experiment).filter(Experiment.id == 4).first()
    if not exp:
        print("Creating Experiment ID 4: 'SupportIQ Retrieval & Verification Ablation Study'...")
        exp = Experiment(
            id=4,
            name="SupportIQ Retrieval & Verification Ablation Study",
            description="Component-level ablation isolating BM25, Dense Vector, Hybrid without RRF, Hybrid+RRF, Claim Verification, and Full Pipeline.",
            dataset_name="SupportIQ Holdout Test Benchmark v1",
            status="DRAFT",
            created_by_user_id=1,
        )
        db.add(exp)
        db.commit()
        db.refresh(exp)
    else:
        print(f"Using existing Experiment ID 4: '{exp.name}'")

    dataset = db.query(EvaluationDataset).filter(EvaluationDataset.id == 2).first()
    if not dataset:
        raise ValueError("Dataset ID 2 not found.")

    ablation_modes = [
        "BM25 Only",
        "Dense Vector Only",
        "Hybrid without RRF",
        "Hybrid + RRF",
        "Full Retrieval + Verification",
        "Full SupportIQ Pipeline",
    ]

    all_results = {}
    print(f"\n=======================================================")
    print(f"STARTING STAGE 5 ABLATION STUDY ON DATASET ID 2")
    print(f"Dataset: '{dataset.name}' ({len(dataset.test_cases)} cases)")
    print(f"=======================================================\n")

    for mode in ablation_modes:
        print(f"--> Executing Ablation Run: '{mode}'...")
        res = runner.run_ablation_benchmark(
            experiment_id=exp.id,
            dataset_id=2,
            mode_name=mode,
        )
        m = res["metrics"]
        all_results[mode] = {
            "run_id": res["run_id"],
            "metrics": m,
            "case_evaluations": res["case_evaluations"],
        }
        print(f"    Run ID: {res['run_id']} | Acc: {m['accuracy']*100:.1f}% | R@5: {m['recall_at_5']*100:.1f}% | MRR: {m['mrr']:.4f} | Faith: {m['faithfulness']*100:.1f}% | Cit: {m['citation_correctness']*100:.1f}% | Halluc: {m['hallucination_rate']*100:.1f}% | Latency: {m['retrieval_verification_latency']:.4f}s")

    summary_file = os.path.join(os.path.dirname(__file__), "ablation_study_summary.json")
    with open(summary_file, "w", encoding="utf-8") as f:
        json.dump(all_results, f, indent=2)

    print(f"\n[SUCCESS] Ablation study complete. Results saved to SQLite and {summary_file}")
    db.close()

if __name__ == "__main__":
    run_ablation()
