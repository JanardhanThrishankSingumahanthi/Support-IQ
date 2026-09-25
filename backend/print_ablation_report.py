import json

def report():
    with open("ablation_study_summary.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    print("\n" + "=" * 110)
    print("STAGE 5 ABLATION STUDY: COMPONENT-LEVEL ISOLATION ON DATASET ID 2 (HOLDOUT BENCHMARK)")
    print("=" * 110)
    print(f"{'Ablation Mode':32s} | {'Acc':6s} | {'R@5':6s} | {'MRR':6s} | {'Faith':6s} | {'Cit':6s} | {'Halluc':6s} | {'Latency':10s}")
    print("-" * 110)

    for k, v in data.items():
        m = v["metrics"]
        print(f"{k:32s} | {m['accuracy']*100:5.1f}% | {m['recall_at_5']*100:5.1f}% | {m['mrr']:6.4f} | {m['faithfulness']*100:5.1f}% | {m['citation_correctness']*100:5.1f}% | {m['hallucination_rate']*100:5.1f}% | {m['retrieval_verification_latency']:.4f}s")
    print("-" * 110)

    print("\nPER-CASE BREAKDOWN FOR KEY ABLATION ABLATED PHENOMENA:")
    for mode in ["BM25 Only", "Dense Vector Only", "Hybrid + RRF", "Full Retrieval + Verification", "Full SupportIQ Pipeline"]:
        cases = data[mode]["case_evaluations"]
        print(f"\n[{mode}]:")
        for c in cases:
            if not c["is_answerable"]:
                print(f"  Unsupported Case #{c['test_case_id']}: Hallucinated={c.get('hallucinated')} | Status={c['generation_status']} | Accurate={c['accurate']}")
            elif not c["accurate"] or c.get("recall_at_5", 1.0) < 1.0 or c.get("mrr", 1.0) < 1.0:
                print(f"  Answerable Case #{c['test_case_id']}: Acc={c['accurate']} | R@5={c.get('recall_at_5')} | MRR={c.get('mrr')} | Status={c['generation_status']}")

if __name__ == "__main__":
    report()
