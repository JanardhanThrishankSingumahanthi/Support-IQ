import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from app.db.session import SessionLocal
from app.db.models import Experiment, EvaluationDataset
from app.services.evaluation_runner import EvaluationRunner

def run():
    db = SessionLocal()
    runner = EvaluationRunner(db=db)
    
    exp = db.query(Experiment).filter(Experiment.id == 1).first()
    if not exp:
        print("Creating Experiment 1...")
        exp = Experiment(id=1, name="SupportIQ Golden Evaluation", dataset_name="SupportIQ Golden Evaluation Benchmark v1", status="QUEUED", created_by_user_id=1)
        db.add(exp)
        db.commit()
        db.refresh(exp)

    ds = db.query(EvaluationDataset).first()
    print(f"Running benchmark on Dataset: '{ds.name}' ({len(ds.test_cases)} cases)")
    
    variants = ["Base LLM", "RAG Base", "LoRA", "QLoRA", "RAG + LoRA", "RAG + QLoRA"]
    for v in variants:
        res = runner.run_benchmark(experiment_id=1, dataset_id=ds.id, model_variant=v)
        m = res["metrics"]
        print(f"\n[{v}]: Acc={m['accuracy']*100:.1f}%, Faith={m['faithfulness']*100:.1f}%, Recall@5={m['recall_at_5']*100:.1f}%, MRR={m['mrr']}, Halluc={m['hallucination_rate']*100:.1f}%, Resp={m['response_time']}")

    db.close()

if __name__ == "__main__":
    run()
