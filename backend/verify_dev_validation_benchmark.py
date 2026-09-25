import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from app.db.session import SessionLocal
from app.db.models import EvaluationDataset
from app.services.evaluation_runner import EvaluationRunner

def run():
    db = SessionLocal()
    runner = EvaluationRunner(db=db)
    
    ds_dev = db.query(EvaluationDataset).filter(EvaluationDataset.id == 1).first()
    print(f"=== EVALUATING ON DATASET 1: '{ds_dev.name}' ({len(ds_dev.test_cases)} cases) ===")
    
    variants = ["Base LLM", "RAG Base", "LoRA", "QLoRA", "RAG + LoRA", "RAG + QLoRA"]
    results = {}
    for v in variants:
        res = runner.run_benchmark(experiment_id=1, dataset_id=ds_dev.id, model_variant=v)
        m = res["metrics"]
        results[v] = m
        print(f"[{v}]: Accuracy={m['accuracy']*100:.1f}%, Faithfulness={m['faithfulness']*100:.1f}%, Recall@5={m['recall_at_5']*100:.1f}%, MRR={m['mrr']}, Hallucination={m['hallucination_rate']*100:.1f}%, Latency={m['retrieval_verification_latency']}")

    print("\n--- PER-CASE BREAKDOWN FOR 'RAG + QLoRA' ON DEV/VAL BENCHMARK ---")
    qlora_res = runner.run_benchmark(experiment_id=1, dataset_id=ds_dev.id, model_variant="RAG + QLoRA")
    for ce in qlora_res["case_evaluations"]:
        q_type = "ANSWERABLE" if ce.get("is_answerable") else "UNSUPPORTED"
        print(f"Case #{ce.get('test_case_id')} ({q_type}) Cat: {ce.get('category')}")
        print(f"  Q: {ce.get('question')}")
        print(f"  Status: {ce.get('generation_status')}")
        print(f"  Accurate: {ce.get('accurate')}")
        if ce.get("is_answerable"):
            print(f"  Recall@5: {ce.get('recall_at_5')}, MRR: {ce.get('mrr')}, Coverage: {ce.get('coverage')}")
        else:
            print(f"  Hallucinated: {ce.get('hallucinated')}, Correct Refusal: {ce.get('correct_refusal')}")
        print()

    db.close()

if __name__ == "__main__":
    run()
