# SupportIQ: Research Foundation Baseline & Empirical Master Table

**Project Title:** Retrieval-augmented Question Answering via Parameter-efficient Fine-tuning (LoRA/QLoRA), Applied to Customer Support Chatbot Automation  
**Product:** SupportIQ  
**Document:** `research/RESEARCH_FOUNDATION.md`  
**Status:** FULLY VERIFIED BASELINE  

---

## 1. Executive Summary & Ground-Truth Disclosures

This document establishes the verified empirical foundation for all academic documentation, publications, and technical reports regarding the SupportIQ platform. 

Every entry, metric, latency figure, and VRAM measurement documented below is traced directly to physical database records in `backend/supportiq.db`, verifiable JSON evaluation summaries, or live GPU telemetry logs.

### A. Critical Scientific Distinction: Offline Pipeline vs. Live Neural GPU Inference
* **Offline Pipeline Experiments (Experiments #3 & #4):** Evaluated retrieval candidate ranking and claim verification boundaries using a CPU-based extractive template synthesizer. Retrieval latency is measured in CPU wall-clock milliseconds (4.9ms – 16.8ms). Autoregressive LLM generation latency and GPU memory are strictly disclosed as **NOT MEASURED**.
* **Live Neural Inference Experiments (Experiments #7 & #12):** Evaluated actual autoregressive token generation using `Qwen/Qwen2.5-0.5B-Instruct` on an NVIDIA GeForce RTX 2050 Laptop GPU (CUDA 12.4, PyTorch 2.6.0). Generation latency (0.844s LoRA, 1.668s QLoRA, 2.061s Base Qwen) and peak active VRAM allocation (0.46 GB QLoRA, 0.96 GB LoRA) represent live empirical GPU telemetry.

### B. Strict Research Integrity Exclusion of Prior Synthetic Metrics
The following metrics from past conversational summaries had no empirical source records in the repository and are **REJECTED**:
* `89.4% accuracy`, `94.2% faithfulness` &rarr; **UNSUPPORTED / REJECTED**
* `88.1% accuracy`, `92.8% faithfulness` &rarr; **UNSUPPORTED / REJECTED**
* `91.0% accuracy`, `95.0% faithfulness` &rarr; **UNSUPPORTED / REJECTED**
* `50 test cases` &rarr; **UNSUPPORTED / REJECTED** (actual benchmark size is $N=10$)

---

## 2. Final Empirical Research Master Table

| Exp | Run | Model | Adapter | Dataset | Test Cases | Accuracy | Faithfulness | Recall@5 | MRR | Citation Corr. | Hallucination | Retr. Latency | Gen. Latency | Peak VRAM | Hardware | Evidence Source | Status |
|:---:|:---:|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---|:---|:---:|
| **1** | 1–36 | RAG + QLoRA (Customer Support v1) | Legacy Template | Customer Support QA | 10 | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | SQLite `experiments` table ID 1 | **REFERENCE ONLY** |
| **2** | 21–29 | SupportIQ RAG Pipeline | None (Dev Pipeline) | Dataset 2 (Holdout) | 10 | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | NOT MEASURED | ~0.010s | NOT MEASURED | NOT MEASURED | CPU | SQLite `experiments` table ID 2 | **COMPLETED** (Dev Suite) |
| **3** | 37 | Base LLM (Zero-Shot Parametric) | None (Unaugmented) | Dataset 2 (Holdout) | 10 | **30.0% (3/10)** | 0.0% (0/7) | 0.0000 (0/7) | 0.0000 | 30.0% (3/10) | 0.0% (0/3) | NOT MEASURED | NOT MEASURED | NOT MEASURED | CPU | `final_frozen_holdout_summary.json` Run 37 | **COMPLETED** (Offline Baseline) |
| **3** | 38 | LoRA (No Retr, Unaugmented) | None (Unaugmented) | Dataset 2 (Holdout) | 10 | **30.0% (3/10)** | 0.0% (0/7) | 0.0000 (0/7) | 0.0000 | 30.0% (3/10) | 0.0% (0/3) | NOT MEASURED | NOT MEASURED | NOT MEASURED | CPU | `final_frozen_holdout_summary.json` Run 38 | **COMPLETED** (Offline Baseline) |
| **3** | 39 | QLoRA (No Retr, Unaugmented) | None (Unaugmented) | Dataset 2 (Holdout) | 10 | **30.0% (3/10)** | 0.0% (0/7) | 0.0000 (0/7) | 0.0000 | 30.0% (3/10) | 0.0% (0/3) | NOT MEASURED | NOT MEASURED | NOT MEASURED | CPU | `final_frozen_holdout_summary.json` Run 39 | **COMPLETED** (Offline Baseline) |
| **3** | 40 | RAG Base (Lexical Baseline) | None (Extractive) | Dataset 2 (Holdout) | 10 | **90.0% (9/10)** | 95.6% | 1.0000 (7/7) | 1.0000 | 90.0% (9/10) | 33.3% (1/3) | 0.0102s | NOT MEASURED | NOT MEASURED | CPU | `final_frozen_holdout_summary.json` Run 40 | **COMPLETED** (Offline Baseline) |
| **3** | 41 | RAG + LoRA (Config Pipeline) | None (Extractive) | Dataset 2 (Holdout) | 10 | **100.0% (10/10)**| 98.0% | 1.0000 (7/7) | 1.0000 | 100.0% (10/10)| 0.0% (0/3) | 0.0168s | NOT MEASURED | NOT MEASURED | CPU | `final_frozen_holdout_summary.json` Run 41 | **COMPLETED** (Offline Pipeline) |
| **3** | 42 | RAG + QLoRA (Config Pipeline) | None (Extractive) | Dataset 2 (Holdout) | 10 | **100.0% (10/10)**| 98.0% (0.9796)| 1.0000 (7/7) | 1.0000 | 100.0% (10/10)| 0.0% (0/3) | 0.0119s | NOT MEASURED | NOT MEASURED | CPU | `final_frozen_holdout_summary.json` Run 42 | **COMPLETED** (Offline Pipeline) |
| **4** | 45 | BM25 Only | None (Extractive) | Dataset 2 (Holdout) | 10 | **90.0% (9/10)** | 95.6% | 1.0000 (7/7) | 1.0000 | 90.0% (9/10) | 33.3% (1/3) | 0.0052s | NOT MEASURED | NOT MEASURED | CPU | `ablation_study_summary.json` Run 45 | **COMPLETED** (Ablation 1) |
| **4** | 46 | Dense Vector Only (32-dim Hash) | None (Extractive) | Dataset 2 (Holdout) | 10 | **70.0% (7/10)** | 76.5% | 1.0000 (7/7) | 0.7976 | 60.0% (6/10) | 100.0% (3/3) | 0.0051s | NOT MEASURED | NOT MEASURED | CPU | `ablation_study_summary.json` Run 46 | **COMPLETED** (Ablation 2) |
| **4** | 47 | Hybrid without RRF (Linear Sum) | None (Extractive) | Dataset 2 (Holdout) | 10 | **90.0% (9/10)** | 90.8% | 1.0000 (7/7) | 1.0000 | 90.0% (9/10) | 33.3% (1/3) | 0.0051s | NOT MEASURED | NOT MEASURED | CPU | `ablation_study_summary.json` Run 47 | **COMPLETED** (Ablation 3) |
| **4** | 48 | Hybrid + RRF (Naive RAG, No Gate)| None (Extractive) | Dataset 2 (Holdout) | 10 | **70.0% (7/10)** | 0.0% | 1.0000 (7/7) | 1.0000 | 70.0% (7/10) | 100.0% (3/3) | 0.0052s | NOT MEASURED | NOT MEASURED | CPU | `ablation_study_summary.json` Run 48 | **COMPLETED** (Ablation 4) |
| **4** | 49 | Full Retr + Verification (Generic)| None (Extractive) | Dataset 2 (Holdout) | 10 | **90.0% (9/10)** | 98.0% | 1.0000 (7/7) | 1.0000 | 90.0% (9/10) | 33.3% (1/3) | 0.0051s | NOT MEASURED | NOT MEASURED | CPU | `ablation_study_summary.json` Run 49 | **COMPLETED** (Ablation 5) |
| **4** | 50 | Full SupportIQ Pipeline | None (Extractive) | Dataset 2 (Holdout) | 10 | **100.0% (10/10)**| 98.0% | 1.0000 (7/7) | 1.0000 | 100.0% (10/10)| **0.0% (0/3)** | 0.0049s | NOT MEASURED | NOT MEASURED | CPU | `ablation_study_summary.json` Run 50 | **COMPLETED** (Ablation 6) |
| **7** | 53 | Base Qwen 2.5 0.5B (Zero-Shot) | None (Pretrained) | Dataset 2 (Holdout) | 10 | **100.0% (10/10)**| 95.2% (7/7) | 1.0000 (7/7) | 1.0000 | 100.0% (10/10)| **0.0% (0/3)** | ~0.008s | **2.061s** | 0.96 GB | RTX 2050 (CUDA 12.4) | `real_lora_holdout_summary.json` Run 53 | **COMPLETED** (Live GPU Base) |
| **7** | 54 | Qwen2.5-0.5B-Instruct + LoRA | SupportIQ LoRA FP16 | Dataset 2 (Holdout) | 10 | **100.0% (10/10)**| **100.0% (7/7)**| 1.0000 (7/7) | 1.0000 | 100.0% (10/10)| **0.0% (0/3)** | ~0.008s | **0.844s** | 0.96 GB | RTX 2050 (CUDA 12.4) | `real_lora_holdout_summary.json` Run 54 | **COMPLETED** (Live GPU LoRA) |
| **12**| 59 | Qwen2.5-0.5B-Instruct + QLoRA | SupportIQ QLoRA NF4 | Dataset 2 (Holdout) | 10 | **100.0% (10/10)**| **100.0% (7/7)**| 1.0000 (7/7) | 1.0000 | 100.0% (10/10)| **0.0% (0/3)** | ~0.010s | **1.668s** | **0.46 GB** | RTX 2050 (CUDA 12.4) | `real_qlora_holdout_summary.json` Run 59 | **COMPLETED** (Live GPU QLoRA)|

---

## 3. Training Telemetry & Parameter Economy

| Metric | SupportIQ LoRA (FP16) | SupportIQ QLoRA (4-bit NF4) | Delta / Efficiency Analysis |
|---|:---:|:---:|---|
| **Base Model** | `Qwen/Qwen2.5-0.5B-Instruct` | `Qwen/Qwen2.5-0.5B-Instruct` | Same foundation model |
| **Quantization Format** | Unquantized FP16 | 4-bit NormalFloat (NF4) | 4-bit weight compression with double quantization |
| **Trainable Parameters** | 540,672 | 540,672 | Exactly matched adapter parameter capacity |
| **Total Model Parameters**| 494,573,440 | 494,573,440 | ~494.6M |
| **Trainable Percentage** | **0.1093%** | **0.1093%** | 99.8907% of parameters remain completely frozen |
| **Training Duration** | **9.06 seconds** (3 epochs) | **21.60 seconds** (3 epochs) | LoRA is 2.38x faster in training (no dequantization overhead) |
| **Initial Validation Loss**| 1.6426 | 1.5872 | Comparable initial cross-entropy |
| **Final Validation Loss** | 1.4008 | 1.3748 | QLoRA converged to slightly lower validation loss |
| **Peak Training VRAM** | 2.42 GB | **1.79 GB** | QLoRA reduced training VRAM by **26.0%** |
| **Peak Inference VRAM** | 0.96 GB | **0.46 GB** | QLoRA reduced inference VRAM by **52.1%** (fits easily in 4 GB GPU) |
| **Inference Latency** | **0.844s** | 1.668s | LoRA provides 1.98x faster token generation |

---

## 4. Hardware Verification

* **Physical GPU:** NVIDIA GeForce RTX 2050 Laptop GPU (1 device)
* **Total Physical VRAM:** 4.00 GB (4096 MB)
* **CUDA Driver / Runtime:** CUDA 12.4
* **PyTorch Version:** `2.6.0+cu124`
* **Transformers Version:** `5.17.0`
* **PEFT Version:** `0.21.0`
* **Bitsandbytes Version:** `0.50.2`
* **Accelerate Version:** `1.15.0`
* **Python Version:** Python 3.12.10 (AMD64)
* **Discrepancy Resolution:** Any prior references to RTX 3050 were **UNVERIFIED / ERRONEOUS**. The actual physical GPU verified in the environment is the **NVIDIA GeForce RTX 2050 Laptop GPU**.

---

## 5. Per-Case Error Analysis (Ablation Series, Cases 11–20)

| Case ID | Query Domain | Target Chunk | BM25 Only | Dense Vector Only | Hybrid w/o RRF | Hybrid + RRF | Full Retr + Verif | Full Pipeline | Root Failure Mechanism |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---|
| **11** | Refund timeline | Chunk 3 | PASS | PASS | PASS | PASS | PASS | **PASS** | Answerable policy query |
| **12** | Credential security| Chunk 4 | PASS | PASS | PASS | PASS | PASS | **PASS** | Answerable security query |
| **13** | Warranty RMA tag | Chunk 7 | PASS | PASS | PASS | PASS | PASS | **PASS** | Answerable warranty query |
| **14** | Ticketing API | Chunk 9 | PASS | PASS | PASS | PASS | PASS | **PASS** | Answerable integration query |
| **15** | Billing invoice | Chunk 11 | PASS | PASS | PASS | PASS | PASS | **PASS** | Answerable billing query |
| **16** | Encryption standard| Chunk 12 | PASS | **FAIL (Rank 3)** | PASS | PASS | PASS | **PASS** | Dense vector suffered semantic drift toward billing chunks |
| **17** | Knowledge manager | Chunk 13 | PASS | **FAIL (Rank 4)** | PASS | PASS | PASS | **PASS** | Dense vector failed citation precision and rank order |
| **18** | Holographic support| None (Refusal)| PASS | **FAIL (Hallucinated)**| PASS | **FAIL (Hallucinated)**| **FAIL (Hallucinated)**| **PASS** | Matched domain boilerplate ('supportiq'); solved by domain stopword filter |
| **19** | Martian mining | None (Refusal)| PASS | **FAIL (Hallucinated)**| PASS | **FAIL (Hallucinated)**| PASS | **PASS** | Dense vector non-zero similarities passed through; caught by lexical filter |
| **20** | Warp drive warranty| None (Refusal)| **FAIL (Hallucinated)**| **FAIL (Hallucinated)**| **FAIL (Hallucinated)**| **FAIL (Hallucinated)**| PASS | **PASS** | Keyword trap on 'warranty'; suppressed by RRF rank dampening & evidence gate |
