import json
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from app.db.session import SessionLocal
from app.db.models import Experiment, ExperimentRun, EvaluationResult

def analyze():
    db = SessionLocal()
    exp = db.query(Experiment).filter(Experiment.id == 3).first()
    print(f"=== Experiment ID {exp.id}: {exp.name} (Dataset: {exp.dataset_name}) ===")
    
    runs = db.query(ExperimentRun).filter(ExperimentRun.experiment_id == 3).order_by(ExperimentRun.id.asc()).all()
    print(f"Total runs found: {len(runs)}")
    
    summary_path = os.path.join(os.path.dirname(__file__), "final_frozen_holdout_summary.json")
    json_data = {}
    if os.path.exists(summary_path):
        with open(summary_path, "r", encoding="utf-8") as f:
            json_data = json.load(f)

    for r in runs:
        cfg = r.config_json or {}
        m = r.metrics_json or {}
        variant = cfg.get("model_variant", "Unknown")
        print("\n" + "=" * 60)
        print(f"Variant: {variant} (Run ID: {r.id})")
        print(f"Config details: peft_type={cfg.get('peft_type')}, retrieval={cfg.get('retrieval', {}).get('method')}")
        print(f"Metrics: Acc={m.get('accuracy')}, R@5={m.get('recall_at_5')}, MRR={m.get('mrr')}, Faith={m.get('faithfulness')}, Cit={m.get('citation_correctness')}, Halluc={m.get('hallucination_rate')}, RetrLatency={m.get('retrieval_verification_latency')}, LLMGenLatency={m.get('llm_generation_latency')}")
        
        # Check case results from JSON
        if variant in json_data:
            cases = json_data[variant].get("case_evaluations", [])
            print(f"Cases ({len(cases)}):")
            for c in cases:
                cid = c.get("test_case_id")
                ans = c.get("is_answerable")
                acc = c.get("accurate")
                halluc = c.get("hallucinated", False)
                cov = c.get("coverage", 0)
                status = c.get("generation_status")
                print(f"  Case #{cid:2d} | Ans={str(ans):5s} | Acc={str(acc):5s} | Status={status:11s} | Halluc={str(halluc):5s} | Cov={cov:.2f}")

    db.close()

if __name__ == "__main__":
    analyze()
