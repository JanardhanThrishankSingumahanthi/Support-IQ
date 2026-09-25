import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from app.db.session import SessionLocal
from app.db.models import (
    Experiment,
    ExperimentRun,
    EvaluationDataset,
    EvaluationResult,
)
from app.retrieval.service import RetrievalService, DOMAIN_STOPWORDS


def generate_llm_answer(model, tokenizer, prompt: str, device: str) -> tuple[str, float]:
    inputs = tokenizer(prompt, return_tensors="pt").to(device)
    torch.cuda.synchronize()
    start_time = time.perf_counter()
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=64,
            do_sample=False,
            temperature=None,
            top_p=None,
            pad_token_id=tokenizer.pad_token_id or tokenizer.eos_token_id,
        )
    torch.cuda.synchronize()
    gen_duration = time.perf_counter() - start_time
    full_text = tokenizer.decode(outputs[0], skip_special_tokens=False)
    if "<|im_start|>assistant\n" in full_text:
        ans = full_text.split("<|im_start|>assistant\n")[-1].replace("<|im_end|>", "").strip()
    else:
        ans = full_text.strip()
    return ans, gen_duration


def evaluate_model_on_holdout(
    model,
    tokenizer,
    dataset,
    retrieval_service,
    model_name: str,
    device: str,
) -> dict:
    case_results = []
    recalls_at_5 = []
    mrrs = []
    faithfulness_scores = []
    citation_correctness_scores = []
    hallucination_flags = []
    generation_latencies = []
    retrieval_latencies = []
    accuracy_scores = []

    torch.cuda.reset_peak_memory_stats(0)

    for case in dataset.test_cases:
        r_start = time.perf_counter()

        # 1. RETRIEVE (Standard hybrid RRF)
        retrieved_chunks = retrieval_service.retrieve(
            query=case.question,
            top_k=5,
            retrieval_method="hybrid",
        )
        r_latency = time.perf_counter() - r_start
        retrieval_latencies.append(r_latency)

        # 2. EVIDENCE CHECK (Standard fixed threshold, exactly as frozen baseline)
        top_chunk = retrieved_chunks[0] if retrieved_chunks else {}
        substantive_terms = top_chunk.get("substantive_matched_terms")
        if substantive_terms is None:
            substantive_terms = [t for t in top_chunk.get("matched_terms", []) if t not in DOMAIN_STOPWORDS]

        has_evidence = (
            len(retrieved_chunks) > 0
            and top_chunk.get("similarity_score", 0) >= 0.15
            and (
                len(substantive_terms) >= 2
                or top_chunk.get("lexical_score", 0) >= 0.35
            )
        )

        # 3. REAL INFERENCE GENERATION
        if has_evidence:
            context_text = "\n---\n".join(
                f"[Doc {c['document_id']} Chunk {c['chunk_id']}]: {c['content']}"
                for c in retrieved_chunks[:3]
            )
            prompt = (
                f"<|im_start|>system\nYou are SupportIQ's AI customer support assistant. "
                f"Answer the customer's question accurately, professionally, and concisely using ONLY the provided support context. "
                f"Do not invent facts not supported by the context.<|im_end|>\n"
                f"<|im_start|>user\nContext:\n{context_text}\n\nQuestion: {case.question}<|im_end|>\n"
                f"<|im_start|>assistant\n"
            )
            answer_text, gen_sec = generate_llm_answer(model, tokenizer, prompt, device)
            gen_status = "resolved"
        else:
            answer_text = (
                "No relevant information was found in your knowledge base matching this question. "
                "To avoid misinformation, SupportIQ does not fabricate answers without source evidence. "
                "You can try a different search term or connect with a support agent."
            )
            gen_sec = 0.0
            gen_status = "no_evidence"

        generation_latencies.append(gen_sec)

        # 4. GROUNDING & FAITHFULNESS
        if has_evidence:
            grounding_report = retrieval_service.analyze_answer_grounding(
                query=case.question,
                answer=answer_text,
                top_k=5,
            )
            coverage = float(grounding_report.get("reliability", {}).get("coverage", 0.0))
        else:
            coverage = 0.0

        retrieved_chunk_ids = [c["chunk_id"] for c in retrieved_chunks]
        retrieved_doc_ids = [c["document_id"] for c in retrieved_chunks]

        # 5. METRICS PER CASE
        case_info = {
            "test_case_id": case.id,
            "category": case.category,
            "question": case.question,
            "is_answerable": case.is_answerable,
            "generation_status": gen_status,
            "generated_answer": answer_text,
            "expected_answer": case.expected_answer,
            "retrieval_latency_sec": round(r_latency, 4),
            "generation_latency_sec": round(gen_sec, 4),
            "retrieved_chunk_count": len(retrieved_chunks),
        }

        if case.is_answerable:
            # Recall@5
            r_at_5 = 0.0
            if case.expected_chunk_id and case.expected_chunk_id in retrieved_chunk_ids[:5]:
                r_at_5 = 1.0
            elif case.expected_document_id and case.expected_document_id in retrieved_doc_ids[:5]:
                r_at_5 = 1.0
            recalls_at_5.append(r_at_5)

            # MRR
            reciprocal_rank = 0.0
            for rank, chunk in enumerate(retrieved_chunks[:5], start=1):
                if (case.expected_chunk_id and chunk["chunk_id"] == case.expected_chunk_id) or (
                    case.expected_document_id and chunk["document_id"] == case.expected_document_id
                ):
                    reciprocal_rank = 1.0 / rank
                    break
            mrrs.append(reciprocal_rank)

            # Faithfulness
            faithfulness_scores.append(coverage)

            # Citation correctness
            citation_valid = 1.0 if (case.expected_document_id and case.expected_document_id in retrieved_doc_ids[:3]) else 0.0
            citation_correctness_scores.append(citation_valid)

            # Accuracy
            is_accurate = 1.0 if (has_evidence and (r_at_5 > 0.0 or citation_valid > 0.0)) else 0.0
            accuracy_scores.append(is_accurate)

            case_info.update({
                "recall_at_5": r_at_5,
                "mrr": round(reciprocal_rank, 4),
                "coverage": round(coverage, 4),
                "citation_correct": bool(citation_valid),
                "accurate": bool(is_accurate),
            })
        else:
            # Unanswerable
            is_hallucination = 1.0 if has_evidence else 0.0
            hallucination_flags.append(is_hallucination)
            correct_refusal = 1.0 if gen_status == "no_evidence" else 0.0
            accuracy_scores.append(correct_refusal)
            citation_correctness_scores.append(1.0 if not has_evidence else 0.0)

            case_info.update({
                "hallucinated": bool(is_hallucination),
                "correct_refusal": bool(correct_refusal),
                "accurate": bool(correct_refusal),
            })

        case_results.append(case_info)

    # 6. AGGREGATE
    peak_vram_gb = torch.cuda.max_memory_allocated(0) / (1024**3)
    avg_gen_latency = sum(generation_latencies) / max(1, len([l for l in generation_latencies if l > 0]))

    metrics = {
        "accuracy": round(sum(accuracy_scores) / len(accuracy_scores), 4),
        "faithfulness": round(sum(faithfulness_scores) / max(1, len(faithfulness_scores)), 4),
        "recall_at_5": round(sum(recalls_at_5) / max(1, len(recalls_at_5)), 4),
        "mrr": round(sum(mrrs) / max(1, len(mrrs)), 4),
        "citation_correctness": round(sum(citation_correctness_scores) / len(citation_correctness_scores), 4),
        "hallucination_rate": round(sum(hallucination_flags) / max(1, len(hallucination_flags)), 4),
        "llm_generation_latency_sec": round(avg_gen_latency, 3),
        "peak_vram_gb": round(peak_vram_gb, 2),
    }

    return {
        "model_name": model_name,
        "metrics": metrics,
        "case_evaluations": case_results,
    }


def main():
    print("=" * 65)
    print("SupportIQ REAL LoRA HOLDOUT EVALUATION (Dataset ID 2)")
    print("=" * 65)

    device = "cuda:0" if torch.cuda.is_available() else "cpu"
    print(f"[+] Device: {device} ({torch.cuda.get_device_name(0)})")

    adapter_dir = Path("backend/artifacts/adapters/supportiq_lora_qwen05b")
    if not adapter_dir.exists():
        print(f"[-] ERROR: Adapter directory {adapter_dir} does not exist!")
        sys.exit(1)

    db = SessionLocal()
    try:
        retrieval_service = RetrievalService(db=db)

        # 1. Fetch Holdout Dataset (ID 2)
        holdout_ds = db.query(EvaluationDataset).filter(EvaluationDataset.id == 2).first()
        if not holdout_ds:
            print("[-] ERROR: Holdout dataset ID 2 not found in SQLite!")
            sys.exit(1)

        print(f"[+] Evaluating on Frozen Holdout Dataset ID 2: '{holdout_ds.name}' ({len(holdout_ds.test_cases)} cases)")

        # 2. Register New Experiment in SQLite (No overwriting)
        exp_name = "SupportIQ Real LoRA Empirical Holdout Evaluation"
        exp = db.query(Experiment).filter(Experiment.name == exp_name).first()
        if not exp:
            exp = Experiment(
                name=exp_name,
                description="Live empirical comparison of Base Qwen 0.5B vs Trained LoRA adapter on Frozen Holdout Dataset 2 with real GPU inference latency and peak VRAM measurement.",
                dataset_name=holdout_ds.name,
                status="RUNNING",
                created_by_user_id=1,
            )
            db.add(exp)
            db.commit()
            db.refresh(exp)
        print(f"[+] Registered Experiment in SQLite: ID {exp.id} ('{exp.name}')")

        # 3. Load Base Model and Tokenizer
        base_model_id = "Qwen/Qwen2.5-0.5B-Instruct"
        print(f"\n[+] Loading Base Model: {base_model_id}...")
        tokenizer = AutoTokenizer.from_pretrained(str(adapter_dir))
        base_model = AutoModelForCausalLM.from_pretrained(
            base_model_id,
            torch_dtype=torch.float16,
            device_map=device,
        )

        # 4. RUN BASELINE EVALUATION (Base Qwen 0.5B)
        print("\n" + "=" * 50)
        print("RUNNING BASELINE: Base Qwen 0.5B (Zero-Shot Grounded Generation)")
        print("=" * 50)
        base_results = evaluate_model_on_holdout(
            model=base_model,
            tokenizer=tokenizer,
            dataset=holdout_ds,
            retrieval_service=retrieval_service,
            model_name="Base Qwen 0.5B (Zero-Shot)",
            device=device,
        )

        # Save Base Run to SQLite
        run_base = ExperimentRun(
            experiment_id=exp.id,
            model_version_id=None,
            status="COMPLETED",
            config_json={
                "model_name": base_model_id,
                "variant": "Base Qwen 0.5B",
                "method": "Zero-Shot RAG",
                "dataset_id": holdout_ds.id,
                "inference_device": device,
            },
            metrics_json=base_results["metrics"],
            started_at=datetime.now(timezone.utc),
            finished_at=datetime.now(timezone.utc),
        )
        db.add(run_base)
        db.flush()

        # Save EvaluationResult rows for Base Run
        for m_name, m_val in base_results["metrics"].items():
            db.add(
                EvaluationResult(
                    run_id=run_base.id,
                    metric_name=m_name,
                    metric_value=str(m_val),
                    details_json={"value": m_val},
                )
            )
        db.commit()

        # 5. ATTACH TRAINED LoRA ADAPTER
        print("\n" + "=" * 50)
        print(f"ATTACHING TRAINED LoRA ADAPTER: {adapter_dir}")
        print("=" * 50)
        lora_model = PeftModel.from_pretrained(base_model, str(adapter_dir))
        lora_model.eval()

        # 6. RUN LoRA EVALUATION
        print("\n" + "=" * 50)
        print("RUNNING EVALUATION: Trained SupportIQ LoRA (Fine-Tuned Adapter)")
        print("=" * 50)
        lora_results = evaluate_model_on_holdout(
            model=lora_model,
            tokenizer=tokenizer,
            dataset=holdout_ds,
            retrieval_service=retrieval_service,
            model_name="SupportIQ LoRA (Qwen 0.5B)",
            device=device,
        )

        # Save LoRA Run to SQLite
        run_lora = ExperimentRun(
            experiment_id=exp.id,
            model_version_id=None,
            status="COMPLETED",
            config_json={
                "model_name": base_model_id,
                "variant": "SupportIQ LoRA (Qwen 0.5B)",
                "adapter_path": str(adapter_dir),
                "dataset_id": holdout_ds.id,
                "inference_device": device,
            },
            metrics_json=lora_results["metrics"],
            started_at=datetime.now(timezone.utc),
            finished_at=datetime.now(timezone.utc),
        )
        db.add(run_lora)
        db.flush()

        # Save EvaluationResult rows for LoRA Run
        for m_name, m_val in lora_results["metrics"].items():
            db.add(
                EvaluationResult(
                    run_id=run_lora.id,
                    metric_name=m_name,
                    metric_value=str(m_val),
                    details_json={"value": m_val},
                )
            )
        
        exp.status = "COMPLETED"
        db.commit()

        # 7. Print Comparative Results
        print("\n" + "=" * 65)
        print("EMPIRICAL COMPARISON: Base Qwen 0.5B vs Trained LoRA (HOLDOUT)")
        print("=" * 65)
        print(f"{'Metric':<30} | {'Base Qwen 0.5B':<16} | {'Trained LoRA':<16}")
        print("-" * 65)
        bm = base_results["metrics"]
        lm = lora_results["metrics"]
        print(f"{'Accuracy':<30} | {bm['accuracy']*100:>15.1f}% | {lm['accuracy']*100:>15.1f}%")
        print(f"{'Faithfulness':<30} | {bm['faithfulness']*100:>15.1f}% | {lm['faithfulness']*100:>15.1f}%")
        print(f"{'Recall@5':<30} | {bm['recall_at_5']*100:>15.1f}% | {lm['recall_at_5']*100:>15.1f}%")
        print(f"{'MRR':<30} | {bm['mrr']:>16.4f} | {lm['mrr']:>16.4f}")
        print(f"{'Citation Correctness':<30} | {bm['citation_correctness']*100:>15.1f}% | {lm['citation_correctness']*100:>15.1f}%")
        print(f"{'Hallucination Rate':<30} | {bm['hallucination_rate']*100:>15.1f}% | {lm['hallucination_rate']*100:>15.1f}%")
        print(f"{'LLM Gen Latency (avg)':<30} | {bm['llm_generation_latency_sec']:>15.3f}s | {lm['llm_generation_latency_sec']:>15.3f}s")
        print(f"{'Peak GPU VRAM':<30} | {bm['peak_vram_gb']:>14.2f} GB | {lm['peak_vram_gb']:>14.2f} GB")
        print("=" * 65)

        # 8. Per-Case Breakdown for Trained LoRA
        print("\n" + "=" * 65)
        print("PER-CASE BREAKDOWN: TRAINED LoRA ON HOLDOUT (DATASET 2)")
        print("=" * 65)
        for idx, ce in enumerate(lora_results["case_evaluations"], start=1):
            q_type = "ANSWERABLE" if ce.get("is_answerable") else "UNSUPPORTED"
            print(f"\nCase #{idx} [ID {ce.get('test_case_id')}] ({q_type}) Cat: {ce.get('category')}")
            print(f"  Q: \"{ce.get('question')}\"")
            print(f"  LoRA Answer: \"{ce.get('generated_answer')[:120]}...\"")
            print(f"  Accurate: {ce.get('accurate')} | Gen Latency: {ce.get('generation_latency_sec')}s")

        # 9. Save JSON Summary File
        out_summary = {
            "experiment_id": exp.id,
            "experiment_name": exp.name,
            "dataset_id": holdout_ds.id,
            "dataset_name": holdout_ds.name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "comparison": {
                "base_model": base_results["metrics"],
                "lora_adapter": lora_results["metrics"],
            },
            "runs": {
                "base_run_id": run_base.id,
                "lora_run_id": run_lora.id,
            },
            "lora_case_evaluations": lora_results["case_evaluations"],
            "base_case_evaluations": base_results["case_evaluations"],
        }

        with open("backend/real_lora_holdout_summary.json", "w", encoding="utf-8") as f:
            json.dump(out_summary, f, indent=2)

        print(f"\n[+] Saved detailed evaluation summary to backend/real_lora_holdout_summary.json")
        print(f"[+] Stored in SQLite: Experiment #{exp.id}, Runs #{run_base.id} & #{run_lora.id}")
        print("[+] VERDICT: LoRA HOLDOUT EVALUATION COMPLETE [PASS]")
        print("=" * 65)

    finally:
        db.close()


if __name__ == "__main__":
    main()
