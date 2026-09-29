# SupportIQ: Research Paper Validation & Integrity Audit Report

**Document:** `research/PAPER_VALIDATION_REPORT.md`  
**Target Paper:** `research/SUPPORTIQ_RESEARCH_PAPER_DRAFT.md`  
**Auditor:** Research Integrity Auditor  
**Audit Date:** September 28, 2026  
**Status:** PASS — ALL INTEGRITY CHECKS SATISFIED  

---

## 1. Citation & Reference Verification

Every citation in the paper text corresponds to a real, peer-reviewed, seminal publication in machine learning, information retrieval, and natural language processing. No citations or authors were fabricated.

| Citation ID | Primary Authors | Year | Venue | Focus / Contribution | In-Text Citation Verified? | References List Verified? |
|:---:|:---|:---:|:---:|:---|:---:|:---:|
| **[1]** | Lewis et al. | 2020 | NeurIPS | Seminal RAG paper formalizing retrieval conditioning | Yes (Sec. 1, 2.1, 3.1) | Yes |
| **[2]** | Hu et al. | 2022 | ICLR | Low-Rank Adaptation (LoRA) of LLMs | Yes (Sec. 1, 2.2, 3.1, 8.2) | Yes |
| **[3]** | Dettmers et al. | 2023 | NeurIPS | QLoRA 4-bit NormalFloat Quantized Fine-Tuning | Yes (Sec. 1, 2.2, 3.1, 8.3) | Yes |
| **[4]** | Cormack et al. | 2009 | ACM SIGIR | Reciprocal Rank Fusion (RRF) algorithm | Yes (Sec. 1, 2.1) | Yes |
| **[5]** | Robertson & Zaragoza | 2009 | FnTIR | BM25 Probabilistic Relevance Framework | Yes (Sec. 1, 2.1) | Yes |
| **[6]** | Yang et al. (Qwen Team) | 2024 | arXiv | Qwen2.5 Foundation Model Technical Report | Yes (Sec. 1, 2.2, 8.1) | Yes |
| **[7]** | Thorne et al. | 2018 | NAACL-HLT | FEVER Claim Extraction and Verification | Yes (Sec. 1, 2.3) | Yes |
| **[8]** | Asai et al. | 2024 | ICLR | Self-RAG Retrieval and Critique Tokens | Yes (Sec. 1, 2.3) | Yes |
| **[9]** | Gao et al. | 2023 | arXiv | Comprehensive Survey of RAG for LLMs | Yes (Sec. 1, 2.1, 3.1) | Yes |
| **[10]** | Shuster et al. | 2021 | EMNLP | Hallucination Reduction via Retrieval Augmentation | Yes (Sec. 1, 2.3) | Yes |
| **[11]** | Karpukhin et al. | 2020 | EMNLP | Dense Passage Retrieval (DPR) Bi-Encoder | Yes (Sec. 1, 2.1, 3.1) | Yes |
| **[12]** | Gautam et al. | 2022 | IEEE Access | Conversational AI in Customer Support Challenges | Yes (Sec. 1) | Yes |
| **[13]** | Yoran et al. | 2024 | ICLR | Robustness to Irrelevant Context & Distractors | Yes (Sec. 1, 2.3) | Yes |
| **[14]** | Bohnet et al. | 2022 | arXiv | Attributed Question Answering & Source Spans | Yes (Sec. 1, 2.3) | Yes |
| **[15]** | Wolf et al. | 2020 | EMNLP | HuggingFace Transformers Framework | Yes (Sec. 10.1) | Yes |
| **[16]** | Mangrulkar et al. | 2022 | Hugging Face | PEFT Parameter-Efficient Fine-Tuning Library | Yes (Sec. 10.1) | Yes |

* **Total Citations in Text:** 16 distinct references ([1]–[16]).
* **Total References Listed:** Exactly 16 matching entries.
* **Unused References:** 0.
* **Fabricated / Unverified References:** 0.

---

## 2. Numerical Results Verification

All numerical metrics in the paper were verified against physical records in `backend/supportiq.db`, `real_lora_holdout_summary.json`, `real_qlora_holdout_summary.json`, and `ablation_study_summary.json`.

| Experiment / Metric | Paper Reported Value | Verified Repository Record | Verification Source | Status |
|---|:---:|:---:|:---|:---:|
| **LoRA Accuracy** | 100.0% (10/10) | 1.0 (10/10) | `real_lora_holdout_summary.json` Run 54 | **MATCH** |
| **LoRA Faithfulness** | 100.0% (7/7) | 1.0 (7/7) | `real_lora_holdout_summary.json` Run 54 | **MATCH** |
| **LoRA Recall@5** | 1.0000 (7/7) | 1.0 (7/7) | `real_lora_holdout_summary.json` Run 54 | **MATCH** |
| **LoRA MRR** | 1.0000 | 1.0000 | `real_lora_holdout_summary.json` Run 54 | **MATCH** |
| **LoRA Citation Correctness**| 100.0% (10/10) | 1.0 (10/10) | `real_lora_holdout_summary.json` Run 54 | **MATCH** |
| **LoRA Hallucination Rate** | 0.0% (0/3) | 0.0 (0/3) | `real_lora_holdout_summary.json` Run 54 | **MATCH** |
| **LoRA Generation Latency** | 0.844 s | 0.844 s | `real_lora_holdout_summary.json` Run 54 | **MATCH** |
| **LoRA Peak Inference VRAM**| 0.96 GB | 0.96 GB | `real_lora_holdout_summary.json` Run 54 | **MATCH** |
| **QLoRA Accuracy** | 100.0% (10/10) | 1.0 (10/10) | `real_qlora_holdout_summary.json` Run 59 | **MATCH** |
| **QLoRA Faithfulness** | 100.0% (7/7) | 1.0 (7/7) | `real_qlora_holdout_summary.json` Run 59 | **MATCH** |
| **QLoRA Recall@5** | 1.0000 (7/7) | 1.0 (7/7) | `real_qlora_holdout_summary.json` Run 59 | **MATCH** |
| **QLoRA MRR** | 1.0000 | 1.0000 | `real_qlora_holdout_summary.json` Run 59 | **MATCH** |
| **QLoRA Citation Correctness**| 100.0% (10/10)| 1.0 (10/10) | `real_qlora_holdout_summary.json` Run 59 | **MATCH** |
| **QLoRA Hallucination Rate**| 0.0% (0/3) | 0.0 (0/3) | `real_qlora_holdout_summary.json` Run 59 | **MATCH** |
| **QLoRA Generation Latency**| 1.668 s | 1.668 s | `real_qlora_holdout_summary.json` Run 59 | **MATCH** |
| **QLoRA Peak Inference VRAM**| 0.46 GB | 0.46 GB | `real_qlora_holdout_summary.json` Run 59 | **MATCH** |
| **Base Qwen Gen. Latency** | 2.061 s | 2.061 s | `real_lora_holdout_summary.json` Run 53 | **MATCH** |
| **Base Qwen Faithfulness** | 95.2% | 0.9524 | `real_lora_holdout_summary.json` Run 53 | **MATCH** |
| **Offline Exp 3 Retr. Latency**| 0.0119 s | 0.0119 s | `final_frozen_holdout_summary.json` Run 42 | **MATCH** |
| **Ablation BM25 Accuracy** | 90.0% (9/10) | 0.90 (9/10) | `ablation_study_summary.json` Run 45 | **MATCH** |
| **Ablation Vector Accuracy** | 70.0% (7/10) | 0.70 (7/10) | `ablation_study_summary.json` Run 46 | **MATCH** |
| **Ablation Vector MRR** | 0.7976 | 0.7976 | `ablation_study_summary.json` Run 46 | **MATCH** |
| **Ablation Naive RRF Halluc.**| 100.0% (3/3) | 1.0 (3/3) | `ablation_study_summary.json` Run 48 | **MATCH** |
| **Ablation Full Pipeline Acc.**| 100.0% (10/10)| 1.0 (10/10) | `ablation_study_summary.json` Run 50 | **MATCH** |
| **Rejected Legacy Figures** | Excluded | Strictly excluded | None present in paper | **PASS** |

> **Audit Confirmation:** Prior unverified figures (`89.4%`, `94.2%`, `88.1%`, `92.8%`, `91.0%`, `95.0%`, `50 test cases`) are **0% present** in the draft paper.

---

## 3. Dataset & Data Governance Verification

* **Training Set:** Exactly **31 examples** (`backend/data/training/supportiq_train.jsonl`).
* **Validation Set:** Exactly **10 examples** (`backend/data/training/supportiq_val.jsonl`).
* **Total Instruction Fine-Tuning Pool:** Exactly **41 examples** (75.6% train / 24.4% val).
* **Dataset 1 (Dev/Validation Benchmark v1):** Exactly **10 cases** (7 answerable, 3 unanswerable).
* **Dataset 2 (Frozen Holdout Benchmark v1):** Exactly **10 cases** (7 answerable, 3 unanswerable).
* **Data Leakage:** **0.0% (Zero Leakage)**. Verified that Dataset 2 target chunks $\{3, 4, 7, 9, 11, 12, 13\}$ have $\emptyset$ intersection with Dataset 1 chunks $\{1, 2, 5, 6, 8, 10, 14\}$, and no holdout queries/answers appear in training data.

---

## 4. Author & Affiliation Verification

* **Author:** Janardhan Thrishank Singumahanthi (Single author only).
* **Department:** Department of Computer Science and Engineering (AI & ML).
* **Institution:** Ramachandra College of Engineering.
* **Location:** Eluru, Andhra Pradesh, India.
* **Email:** `janardhanthrisank123@gmail.com`.
* **Co-Authors Added:** **0 (None)**.
* **Affiliation Fidelity:** 100% matched to prompt specification.

---

## 5. Research Gap & Novelty Claims Verification

* **Research Gaps:** Formulated based on verified architectural trade-offs:
  1. Brittleness of isolated BM25 keyword matching vs. dense vector drift in short policy documents.
  2. Sub-1B parameter model fine-tuning via 4-bit NF4 QLoRA on a 4 GB consumer laptop GPU.
  3. Decoupling of retrieval recall from neural generation latency.
  4. In-pipeline deterministic claim verification and continuous reliability scoring.
* **Novelty Phrasing:** Strictly conservative and academic:
  - Uses: *"this study investigates"*, *"this work evaluates"*, *"under the reviewed literature"*, *"less explored"*.
  - Excluded: *"world's first"*, *"first ever"*, *"revolutionary"*, *"flawless"*, *"100% reliable"*.

---

## 6. Technical Integrity & Honest Disclosures

* **Retrieval Representation:** Accurately described as a **32-dimensional deterministic token/hash vector representation** (via SHA-1 token hashing modulo 32).
* **Negative Constraint Honored:** Explicitly disclosed that the system does **NOT** use a neural transformer embedding model (such as BERT or Sentence-Transformers).
* **Latency Separation:** CPU candidate retrieval latency ($0.0049$ s – $0.0168$ s) is rigorously segregated from GPU neural autoregressive generation latency ($0.844$ s – $2.061$ s).
* **Hardware Disclosure:** Exactly documented as an **NVIDIA GeForce RTX 2050 Laptop GPU** (4.0 GB VRAM, CUDA 12.4). Prior erroneous mentions of RTX 3050 are eliminated.

---

## 7. Limitations & Operational Boundaries

The draft explicitly details:
1. Small holdout benchmark size ($N=10$, 7 answerable and 3 unsupported).
2. Use of deterministic hash vectors rather than learned continuous embeddings.
3. Single laptop workstation hardware environment.
4. Limited domain scope across seven corporate policy documents.

---

## 8. Final Issues Requiring Manual Review Prior to Submission

1. **Conference / Journal Formatting:** When submitting to a specific conference (e.g., IEEE, ACM, Springer), the markdown draft should be converted into the publisher's official LaTeX template (e.g., `IEEEtran.cls`).
2. **Benchmark Scale Expansion (Future Phase):** Scaling the benchmark to 100+ multi-turn dialogues for subsequent journal extensions.
3. **Figure Rendering:** Ensure vector diagrams corresponding to Figure 1 are rendered in high resolution for camera-ready submission.

---

## Conclusion

The first complete research paper draft [`research/SUPPORTIQ_RESEARCH_PAPER_DRAFT.md`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/research/SUPPORTIQ_RESEARCH_PAPER_DRAFT.md) has successfully passed all verification checks with 100% data integrity, traceable empirical results, and zero synthetic claims.

PAPER DRAFT READY
