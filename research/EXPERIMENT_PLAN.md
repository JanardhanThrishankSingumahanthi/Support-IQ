# SupportIQ: Research Experiment Plan & Ablation Design

**Project Title:** Retrieval-augmented Question Answering via Parameter-efficient Fine-tuning (LoRA/QLoRA), Applied to Customer Support Chatbot Automation  
**Product:** SupportIQ  
**Document:** `research/EXPERIMENT_PLAN.md`  
**Status:** Verified Baseline  

---

## 1. Overview & Experimental Matrix

This experiment plan outlines the systematic comparative evaluations designed to investigate SupportIQ's core research pipeline. All experiments are designed around the existing frozen holdout benchmark (**Dataset ID 2: SupportIQ Holdout Test Benchmark v1**, $N=10$) and existing training artifacts, requiring no synthetic metrics or architectural modifications.

The plan is structured into three experimental series:
1. **Series 1: Model & Parameter Adaptation Comparison** (Base Qwen vs. LoRA vs. QLoRA)
2. **Series 2: Retrieval Paradigm Ablation** (BM25 vs. Hash Vector vs. Linear Hybrid vs. RRF)
3. **Series 3: Verification & Safeguard Ablation** (Naive RAG vs. Evidence Gating & Claim Verification)

---

## 2. Series 1: Neural Model & Adaptation Comparison

### Experiment 1.A: Pre-Trained Base Qwen Zero-Shot RAG
* **Purpose:** Establish the zero-shot baseline of the unadapted foundation model operating with SupportIQ RAG.
* **Independent Variable:** Model adaptation status (Pre-trained `Qwen/Qwen2.5-0.5B-Instruct` FP16 without adapter fine-tuning).
* **Dependent Variables:** Accuracy, Faithfulness, Citation Correctness, Generation Latency, Peak GPU VRAM.
* **Dataset:** Dataset ID 2 (Holdout Benchmark v1, $N=10$).
* **Metrics:** Accuracy ($N=10$), Faithfulness ($N_{ans}=7$), Recall@5, MRR, Citation Correctness, LLM Generation Latency (s), Peak VRAM (GB).
* **Expected Comparison:** Base model achieves high factual recall when provided context but exhibits lower stylistic alignment, longer verbose outputs, and slightly lower claim faithfulness ($95.2\%$).
* **Evidence Source:** SQLite Experiment 7 Run 53; `real_lora_holdout_summary.json`.

---

### Experiment 1.B: SupportIQ FP16 LoRA + RAG
* **Purpose:** Measure the performance, generation latency, and parameter efficiency of low-rank adaptation unquantized in FP16 precision.
* **Independent Variable:** LoRA adapter (`supportiq_lora_qwen05b`, $r=8, \alpha=16$, targeting `q_proj` and `v_proj`).
* **Dependent Variables:** Accuracy, Faithfulness, Generation Latency, Peak VRAM, Training Loss.
* **Dataset:** Dataset ID 2 (Holdout Benchmark v1, $N=10$).
* **Metrics:** Accuracy ($N=10$), Faithfulness ($N_{ans}=7$), Recall@5, MRR, Citation Correctness, LLM Generation Latency (s), Peak VRAM (GB).
* **Expected Comparison:** LoRA achieves fastest generation latency ($0.844$s) and $100\%$ faithfulness, with moderate VRAM ($0.96$ GB) and $0.1093\%$ trainable parameters.
* **Evidence Source:** SQLite Experiment 7 Run 54; `real_lora_holdout_summary.json`.

---

### Experiment 1.C: SupportIQ 4-bit NF4 QLoRA + RAG
* **Purpose:** Evaluate the memory compression and adaptation fidelity of 4-bit NormalFloat (NF4) quantized QLoRA with double quantization on constrained laptop GPU hardware.
* **Independent Variable:** QLoRA adapter (`supportiq_qlora_qwen05b`, 4-bit NF4, double quantization, FP16 compute).
* **Dependent Variables:** Peak GPU VRAM, LLM Generation Latency, Accuracy, Faithfulness.
* **Dataset:** Dataset ID 2 (Holdout Benchmark v1, $N=10$).
* **Metrics:** Accuracy ($N=10$), Faithfulness ($N_{ans}=7$), Recall@5, MRR, Citation Correctness, LLM Generation Latency (s), Peak VRAM (GB).
* **Expected Comparison:** QLoRA cuts inference VRAM by over $52\%$ ($0.46$ GB vs. $0.96$ GB for LoRA) with identical $100\%$ accuracy and faithfulness, trading off slight latency overhead ($1.668$s vs. $0.844$s) due to dequantization.
* **Evidence Source:** SQLite Experiment 12 Run 59; `real_qlora_holdout_summary.json`.

---

## 3. Series 2: Retrieval Paradigm Ablation

Evaluated via the isolated retrieval sub-pipelines in Experiment 4 on Dataset ID 2 ($N=10$).

| Experiment ID | Run ID | Retrieval Mode | Independent Variable | Key Mechanism / Expected Outcome | Evidence Source |
|:---:|:---:|:---|---|---|---|
| **4.1** | **45** | **BM25 Only** | Lexical token matching only (no vector search) | Strong keyword matching, but fails on keyword traps (Case #20 'warp drive warranty' hallucinated against Dell warranty chunk; 33.3% hallucination rate). | `ablation_study_summary.json` (Run 45) |
| **4.2** | **46** | **Dense Vector Only** | 32-dim deterministic hash-vector cosine similarity only (no BM25) | Degraded ranking precision (MRR = 0.7976 vs. 1.0000; Case 16 at rank 3, Case 17 at rank 4) and 100% hallucination on unsupported queries due to non-zero distributed similarities. | `ablation_study_summary.json` (Run 46) |
| **4.3** | **47** | **Hybrid without RRF** | Linear score sum ($0.65 \times \text{Lexical} + 0.35 \times \text{Vector}$) without rank fusion | Sensitive to keyword score spikes; Case #20 high lexical score bypassed the threshold, leading to 33.3% hallucination. | `ablation_study_summary.json` (Run 47) |
| **4.4** | **48** | **Hybrid + RRF (Naive RAG)** | RRF re-ranking without evidence threshold verification gate | Optimal ranking (MRR = 1.0000, Recall@5 = 1.0000) on answerable queries, but 100% hallucination on unsupported queries because the top retrieved chunk is unconditionally fed to generation. | `ablation_study_summary.json` (Run 48) |

---

## 4. Series 3: Verification & Safeguard Ablation

| Experiment ID | Run ID | Verification Mode | Independent Variable | Key Mechanism / Expected Outcome | Evidence Source |
|:---:|:---:|:---|---|---|---|
| **4.5** | **49** | **Full Retr. + Verification (Generic Filter)** | Hybrid RRF + Claim Verification with generic English stopwords only | Mitigates keyword traps but fails on domain boilerplate; Case #18 ('holographic telepathic support') matched generic terms ('supportiq', 'customer', 'support'), causing 33.3% hallucination. | `ablation_study_summary.json` (Run 49) |
| **4.6** | **50** | **Full SupportIQ Pipeline (Dual Safeguard)** | Hybrid RRF + Claim Verification + Domain Stopword Filtering | Dual safeguard eliminates both keyword traps and domain boilerplate, achieving 100% accuracy, 1.0000 MRR, 1.0000 Recall@5, and 0.0% hallucination rate. | `ablation_study_summary.json` (Run 50) |

---

## 5. Summary Experiment Specifications

```
                              ┌────────────────────────────────────────┐
                              │     SupportIQ Experiment Hierarchy     │
                              └───────────────────┬────────────────────┘
                                                  │
         ┌────────────────────────────────────────┼────────────────────────────────────────┐
         │                                        │                                        │
         ▼                                        ▼                                        ▼
┌──────────────────┐                     ┌──────────────────┐                     ┌──────────────────┐
│  Model Series 1  │                     │ Retrieval Series │                     │ Safeguard Series │
│                  │                     │                  │                     │                  │
│ • Base Qwen (53) │                     │ • BM25 Only (45) │                     │ • Naive RAG (48) │
│ • LoRA FP16 (54) │                     │ • Vector (46)    │                     │ • Generic (49)   │
│ • QLoRA NF4 (59) │                     │ • Linear (47)    │                     │ • Dual Gate (50) │
└──────────────────┘                     └──────────────────┘                     └──────────────────┘
```

> [!NOTE]
> **Strict Operational Condition:** This document establishes the research plan and formal ablation protocol. No new experiments were executed during this documentation phase, preserving the exact state of all database tables and benchmark records.
