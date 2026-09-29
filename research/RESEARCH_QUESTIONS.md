# SupportIQ: Research Questions

**Project Title:** Retrieval-augmented Question Answering via Parameter-efficient Fine-tuning (LoRA/QLoRA), Applied to Customer Support Chatbot Automation  
**Product:** SupportIQ  
**Document:** `research/RESEARCH_QUESTIONS.md`  
**Status:** Verified Baseline  

---

## Overview

The following five Research Questions (RQs) are formulated to directly reflect empirical capabilities, models, and evaluation pipelines implemented in the SupportIQ repository. Each research question is experimentally testable using existing test suites, database records, and holdout benchmarks.

---

### RQ1: Retrieval Configuration & Ranking Performance
> **Question:** How does retrieval representation—sparse lexical matching (BM25) versus a 32-dimensional deterministic hash-vector representation versus their hybrid combination—affect evidence candidate retrieval (Recall@K) and ranking precision (MRR) on enterprise customer-support knowledge bases?
* **Independent Variable:** Retrieval method (`lexical`, `vector`, `hybrid_linear`, `hybrid_rrf`).
* **Dependent Variables:** Recall@5 ($N_{ans}=7$), Mean Reciprocal Rank (MRR, $N_{ans}=7$), Retrieval latency (ms).
* **Experimental Basis:** Experiment 4 (Ablation Runs 45–47).

---

### RQ2: Impact of Reciprocal Rank Fusion (RRF)
> **Question:** To what extent does non-linear Reciprocal Rank Fusion (RRF with $k=60$, lexical weight $0.60$, vector weight $0.40$) improve candidate ranking stability and mitigate semantic drift compared with weighted linear score combination?
* **Independent Variable:** Fusion mechanism (Linear combination $0.65 \times \text{lexical} + 0.35 \times \text{vector}$ vs. RRF rank reciprocal sum).
* **Dependent Variables:** MRR, Per-case rank order of ground-truth chunks, Retrieval latency (ms).
* **Experimental Basis:** Experiment 4 (Run 47 vs. Run 48 / Run 50).

---

### RQ3: LoRA Fine-Tuning Efficiency and Domain Adaptation
> **Question:** How does low-rank adaptation (LoRA, $r=8, \alpha=16$, targeting `q_proj` and `v_proj`) on 0.1093% of parameters affect customer-support response accuracy, faithfulness, and generation latency compared to zero-shot base models on consumer laptop GPUs?
* **Independent Variable:** Model adaptation status (Pre-trained `Qwen/Qwen2.5-0.5B-Instruct` zero-shot vs. SupportIQ FP16 LoRA adapter).
* **Dependent Variables:** Composite Accuracy ($N=10$), Claim Faithfulness ($N_{ans}=7$), Autoregressive generation latency (seconds), Peak GPU VRAM (GB).
* **Experimental Basis:** Experiment 7 (Run 53 vs. Run 54).

---

### RQ4: QLoRA Quantization vs. LoRA Memory Trade-offs
> **Question:** How does 4-bit NormalFloat (NF4) quantized QLoRA with double quantization compare with 16-bit FP16 LoRA in answer faithfulness, autoregressive generation latency, and peak GPU VRAM allocation under constrained hardware (4.0 GB VRAM boundary)?
* **Independent Variable:** Adapter precision and quantization (LoRA FP16 vs. QLoRA 4-bit NF4 with double quantization).
* **Dependent Variables:** Peak GPU VRAM allocated (GB), LLM generation latency (seconds), Training duration (seconds), Faithfulness ($N_{ans}=7$).
* **Experimental Basis:** Experiment 7 Run 54 vs. Experiment 12 Run 59; Training metrics in `training_metrics.json`.

---

### RQ5: Deterministic Grounding & Claim Verification for Hallucination Suppression
> **Question:** Does post-generation sentence-level claim decomposition combined with domain stopword filtering and an algorithmic evidence threshold gate eliminate generative hallucinations on unsupported, out-of-domain queries?
* **Independent Variable:** Verification pipeline presence (Naive RAG without evidence gate vs. Full SupportIQ Claim Verification + Domain Stopword Filter).
* **Dependent Variables:** Hallucination rate on unsupported queries ($N_{unsupp}=3$), Safe refusal rate, Citation correctness ($N=10$).
* **Experimental Basis:** Experiment 4 (Run 48 Naive RAG vs. Run 49 vs. Run 50 Full Pipeline); End-to-end Chat test cases (`test_verification_steps.py`).

---

## Summary Matrix of Research Questions & Experimental Artifacts

| Research Question | Primary Focus | Target Metric | Applicable Experiment | Evidence Artifact |
|:---:|:---|:---|:---:|:---|
| **RQ1** | Retrieval Representation | Recall@5, MRR | Experiment 4 | `backend/ablation_study_summary.json` |
| **RQ2** | RRF vs. Linear Fusion | MRR, Top-k Precision | Experiment 4 | `backend/research_tables/table3_ablation_study.csv` |
| **RQ3** | LoRA Domain Adaptation | Faithfulness, Latency | Experiment 7 | `backend/real_lora_holdout_summary.json` |
| **RQ4** | QLoRA Memory vs. Latency | Peak VRAM, Gen. Latency | Exp 7 vs. Exp 12 | `backend/real_qlora_holdout_summary.json` |
| **RQ5** | Grounding & Safe Refusal | Hallucination Rate, Citations | Experiment 3 & 4 | `backend/final_frozen_holdout_summary.json` |
