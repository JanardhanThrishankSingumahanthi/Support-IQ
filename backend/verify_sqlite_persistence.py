import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from app.db.session import SessionLocal
from app.db.models import Experiment, ExperimentRun, EvaluationResult

def verify():
    db = SessionLocal()
    print("=== Experiments ===")
    experiments = db.query(Experiment).all()
    for e in experiments:
        run_ids = [r.id for r in db.query(ExperimentRun).filter(ExperimentRun.experiment_id == e.id).all()]
        runs_count = len(run_ids)
        results_count = db.query(EvaluationResult).filter(EvaluationResult.run_id.in_(run_ids)).count() if run_ids else 0
        print(f"ID={e.id} | Name='{e.name}' | Dataset='{e.dataset_name}' | Runs={runs_count} | Results={results_count}")

    print("\n=== Experiment 3 (Final Frozen Holdout) Runs ===")
    exp3_runs = db.query(ExperimentRun).filter(ExperimentRun.experiment_id == 3).all()
    for r in exp3_runs:
        cfg = r.config_json or {}
        m = r.metrics_json or {}
        variant = cfg.get("model_variant", "Unknown")
        print(f"RunID={r.id:2d} | Variant={variant:12s} | Acc={m.get('accuracy', 0):.2f} | R@5={m.get('recall_at_5', 0):.2f} | MRR={m.get('mrr', 0):.4f} | Faith={m.get('faithfulness', 0):.4f} | Cit={m.get('citation_correctness', 0):.2f} | Halluc={m.get('hallucination_rate', 0):.2f} | Latency={m.get('retrieval_verification_latency')}")

    print("\n=== Experiment 2 (Historical Holdout) Runs ===")
    exp2_runs = db.query(ExperimentRun).filter(ExperimentRun.experiment_id == 2).all()
    for r in exp2_runs:
        cfg = r.config_json or {}
        m = r.metrics_json or {}
        variant = cfg.get("model_variant", "Unknown")
        print(f"RunID={r.id:2d} | Variant={variant:12s} | Acc={m.get('accuracy', 0):.2f} | R@5={m.get('recall_at_5', 0):.2f} | MRR={m.get('mrr', 0):.4f} | Faith={m.get('faithfulness', 0):.4f} | Cit={m.get('citation_correctness', 0):.2f} | Halluc={m.get('hallucination_rate', 0):.2f} | Latency={m.get('retrieval_verification_latency')}")

    print("\n=== Experiment 4 (Ablation Study) Runs ===")
    exp4_runs = db.query(ExperimentRun).filter(ExperimentRun.experiment_id == 4).all()
    for r in exp4_runs:
        cfg = r.config_json or {}
        m = r.metrics_json or {}
        variant = cfg.get("model_variant", "Unknown")
        print(f"RunID={r.id:2d} | Variant={variant:30s} | Acc={m.get('accuracy', 0):.2f} | R@5={m.get('recall_at_5', 0):.2f} | MRR={m.get('mrr', 0):.4f} | Faith={m.get('faithfulness', 0):.4f} | Cit={m.get('citation_correctness', 0):.2f} | Halluc={m.get('hallucination_rate', 0):.2f} | Latency={m.get('retrieval_verification_latency')}")

    db.close()

if __name__ == "__main__":
    verify()
