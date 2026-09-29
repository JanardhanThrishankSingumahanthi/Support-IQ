# SupportIQ: Final Academic Quality Review Report

**Reviewed Document:** [`research/SUPPORTIQ_RESEARCH_PAPER_DRAFT.md`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/research/SUPPORTIQ_RESEARCH_PAPER_DRAFT.md)  
**Validation Artifact:** [`research/PAPER_VALIDATION_REPORT.md`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/research/PAPER_VALIDATION_REPORT.md)  
**Research Baseline:** [`research/RESEARCH_FOUNDATION.md`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/research/RESEARCH_FOUNDATION.md)  
**Auditor / Reviewer:** Senior Academic Peer Reviewer & Research Integrity Auditor  
**Date:** September 28, 2026  
**Evaluation Scope:** Complete section-by-section academic and empirical quality review (24 sections)

---

## 1. Section-by-Section Quality Review Matrix

| Section | Status | Issues | Required Action |
|---|---|---|---|
| **1. Title** | **PASS** | None. Working title (*"Retrieval-augmented Question Answering via Parameter-efficient Fine-tuning (LoRA/QLoRA), Applied to Customer Support Chatbot Automation"*) accurately and formally reflects core paradigms, domain, and scope. | None. Retain as submitted. |
| **2. Author and Affiliation** | **PASS** | None. Exactly 1 author (Janardhan Thrishank Singumahanthi), department (CSE AI & ML), institution (Ramachandra College of Engineering), and email are verified. Zero unapproved co-authors. | None. Retain as submitted. |
| **3. Abstract** | **PASS** | None. Complete progression covering domain problem, hybrid retrieval, sub-1B PEFT (LoRA/QLoRA), claim verification, empirical results on $N=10$ holdout, and trade-offs. Explicitly notes benchmark scale. | None. Retain as submitted. |
| **4. Keywords** | **PASS** | None. 9 standard indexing keywords (RAG, Customer Support QA, PEFT, LoRA, QLoRA, RRF, Grounding Verification, Hallucination Suppression, Edge AI) aligned with IEEE/ACM taxonomy. | None. Retain as submitted. |
| **5. Introduction** | **PASS** | None. Strong motivation of customer service challenges, risk of unaugmented LLMs, 3 core deficiencies of standard RAG, and clean introduction of SupportIQ. Proper seminal citations ([1], [12], [10], [13], etc.). | None. Retain as submitted. |
| **6. Literature Review** | **PASS** | None. Comprehensive synthesis of 16 peer-reviewed works across RAG ([1], [9]), lexical/dense retrieval ([5], [11], [4]), PEFT ([2], [3], [6]), and hallucination/grounding ([7], [8], [10], [13], [14]). Zero fabricated works. | None. Retain as submitted. |
| **7. Research Gap** | **PASS** | None. Clear identification of 3 operational gaps (Gap 1: structured policy retrieval; Gap 2: sub-1B QLoRA on 4 GB laptop GPU; Gap 3: deterministic in-pipeline claim attribution). Conservative academic tone. | None. Retain as submitted. |
| **8. Research Questions/Objectives** | **PASS** | None. RO1 through RO4 map directly to repository ablation studies and live neural benchmarks. Fully verifiable and empirically testable. | None. Retain as submitted. |
| **9. Dataset** | **PASS** | None. Accurate inventory of 7 documents (14 chunks), instruction pool (31 train / 10 val), Dev/Val Dataset 1 ($N=10$), and Frozen Holdout Dataset 2 ($N=10$). Strictly verified 0.0% data leakage. | None. Retain as submitted. |
| **10. Methodology** | **PASS** | None. Logical 7-stage workflow from ingestion to evidence attribution. Explicit disclosure of greedy decoding and deterministic verification mechanics. | None. Retain as submitted. |
| **11. System Architecture** | **PASS** | Minor formatting note: Fig. 1 is an ASCII architectural diagram. Completely legible and technically accurate for markdown draft review. | For camera-ready publication submission, render Fig. 1 as a vector graphic (PDF/SVG). |
| **12. Retrieval and RRF** | **PASS** | None. Exact mathematical formulation of lexical token overlap, domain stopword filtering (18 terms listed), 32-dim deterministic hash-vector via SHA-1, cosine similarity, and RRF ($k=60$, weights $0.60/0.40$). Explicit disclosure denying neural embeddings. | None. Retain as submitted. |
| **13. LoRA** | **PASS** | None. Mathematically sound low-rank decomposition ($r=8, \alpha=16$, $q/\text{v\_proj}$). Trainable parameter economy verified at 540,672 / 494.6M (0.1093%). Training time (9.06s) and loss progression verified. | None. Retain as submitted. |
| **14. QLoRA** | **PASS** | None. Detailed 4-bit NF4 quantile quantization formulation, double quantization, FP16 compute dtype. Training duration (21.60s) and loss progression verified against empirical records. | None. Retain as submitted. |
| **15. Grounding and Claim Verification** | **PASS** | None. Complete technical specification of sentence-level proposition decomposition, substantive token alignment, threshold gate ($\ge 0.12$), continuous reliability formulation, status tiers, and safe refusal escalation. | None. Retain as submitted. |
| **16. Experimental Setup** | **PASS** | None. Rigorous hardware/software disclosure: NVIDIA GeForce RTX 2050 Laptop GPU (4.0 GB VRAM), CUDA 12.4, PyTorch 2.6.0+cu124, Transformers 5.17.0, PEFT 0.21.0, bitsandbytes 0.50.2. Evaluation protocol on 10 holdout cases. | None. Retain as submitted. |
| **17. Evaluation Metrics** | **PASS** | None. Precise mathematical definitions for Recall@5, MRR, Composite Accuracy, Faithfulness, Citation Correctness, and Hallucination Rate. Explicit separation of CPU retrieval latency from GPU generation latency. | None. Retain as submitted. |
| **18. Results** | **PASS** | None. Table 1 reflects live neural holdout results (LoRA: 100% Acc, 100% Faith, 0.844s, 0.96 GB; QLoRA: 100% Acc, 100% Faith, 1.668s, 0.46 GB; Base: 100% Acc, 95.2% Faith, 2.061s, 0.96 GB). Table 2 reports offline Run 42 (0.0119s CPU). | None. Retain as submitted. |
| **19. Ablation Analysis** | **PASS** | None. Table 3 captures all 6 component ablation runs (Runs 45–50 from Exp 4). Granular per-case error analysis for Cases 18, 19, and 20 details exact failure modes (keyword traps, semantic drift, boilerplate collisions). | None. Retain as submitted. |
| **20. Discussion** | **PASS** | None. Nuanced operational trade-off analysis: QLoRA achieves a 52.1% VRAM reduction (0.46 GB) while LoRA delivers 1.98x faster generation (0.844s). Sound rationale for why Naive RAG fails without deterministic gating. | None. Retain as submitted. |
| **21. Limitations** | **PASS** | None. Exemplary academic honesty: explicitly discloses small holdout size ($N=10$), deterministic hash vector representation boundaries, single laptop GPU environment, and restricted policy document scope. | None. Retain as submitted. |
| **22. Conclusion** | **PASS** | None. Balanced, concise summary of core empirical findings, parameter economy, and practical implications without speculative overclaiming. | None. Retain as submitted. |
| **23. Future Work** | **PASS** | None. Realistic extensions outlined: learned lightweight neural bi-encoders (e.g., MiniLM), scaling to multi-turn dialogues, enterprise CRM ticketing integration, and human-in-the-loop DPO. | None. Retain as submitted. |
| **24. References** | **PASS** | None. 16 real, peer-reviewed seminal citations ([1]–[16]) in standard IEEE bibliographic format. 100% bidirectional correspondence between text citations and reference list. Zero fabricated citations. | None. Retain as submitted. |

---

## 2. Detailed Review Findings

### 2.1 Critical Issues
* **None identified.**
* There are zero scientific integrity violations, zero fabricated results, zero data leakage issues, and zero unverified claims.

### 2.2 Major Academic Issues
* **None identified.**
* The academic tone is formal, objective, and conservative.
* All claims are directly backed by empirical evidence.
* Research gaps and objectives are logically articulated and fully addressed by the experimental evaluation.

### 2.3 Minor Writing & Publication Considerations
1. **Camera-Ready Vector Graphics:** Figure 1 is currently formatted as a structured ASCII architectural diagram. While clear and reproducible in Markdown, it should be rendered into a high-resolution vector format (SVG/PDF) with clean typography when preparing camera-ready submissions for IEEE or ACM conferences.
2. **LaTeX Equation Environments:** The mathematical equations currently use standard MathJax / Markdown display blocks (`$$...$$`). When porting to formal publisher templates (e.g., `IEEEtran.cls`), these should be converted to standard LaTeX environments (`\begin{equation} ... \end{equation}`).

### 2.4 Citation Integrity Review
* **Total in-text citations:** 16 citations ([1] through [16]).
* **Total references in bibliography:** Exactly 16 references.
* **Bidirectional Citation Audit:**
  - `[1]` Lewis et al. (NeurIPS 2020) &rarr; Cited in Sec. 1, 2.1, 3.1
  - `[2]` Hu et al. (ICLR 2022) &rarr; Cited in Sec. 1, 2.2, 3.1, 8.2
  - `[3]` Dettmers et al. (NeurIPS 2023) &rarr; Cited in Sec. 1, 2.2, 3.1, 8.3
  - `[4]` Cormack et al. (ACM SIGIR 2009) &rarr; Cited in Abstract, Sec. 1, 2.1
  - `[5]` Robertson & Zaragoza (FnTIR 2009) &rarr; Cited in Sec. 1, 2.1
  - `[6]` Yang et al. / Qwen Team (arXiv 2024) &rarr; Cited in Abstract, Sec. 1, 2.2, 8.1
  - `[7]` Thorne et al. (NAACL-HLT 2018) &rarr; Cited in Sec. 1, 2.3, 3.1
  - `[8]` Asai et al. (ICLR 2024) &rarr; Cited in Sec. 1, 2.3
  - `[9]` Gao et al. (arXiv 2023) &rarr; Cited in Sec. 1, 2.1, 3.1
  - `[10]` Shuster et al. (EMNLP 2021) &rarr; Cited in Sec. 1, 2.3
  - `[11]` Karpukhin et al. (EMNLP 2020) &rarr; Cited in Sec. 1, 2.1, 3.1
  - `[12]` Gautam et al. (IEEE Access 2022) &rarr; Cited in Sec. 1
  - `[13]` Yoran et al. (ICLR 2024) &rarr; Cited in Sec. 1, 2.3
  - `[14]` Bohnet et al. (arXiv 2022) &rarr; Cited in Sec. 1, 2.3, 3.1
  - `[15]` Wolf et al. (EMNLP 2020) &rarr; Cited in Sec. 10.1
  - `[16]` Mangrulkar et al. (Hugging Face 2022) &rarr; Cited in Sec. 10.1
* **Unreferenced Citations:** 0.
* **Uncited References:** 0.
* **Fabricated / Non-Existent Citations:** 0.

### 2.5 Numerical Consistency Review
All figures in the draft match empirical repository records and [`research/RESEARCH_FOUNDATION.md`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/research/RESEARCH_FOUNDATION.md):
* **Training Examples:** Exactly **31** (Matches `supportiq_train.jsonl`).
* **Validation Examples:** Exactly **10** (Matches `supportiq_val.jsonl`).
* **Total Instruction Fine-Tuning Pool:** Exactly **41** (31 train + 10 val).
* **Holdout Benchmark Scale:** Exactly **10 cases** (7 answerable, 3 unsupported).
* **Model Parameters:** 540,672 trainable / 494,573,440 total (**0.1093%**).
* **Base Model Generation Latency / Inference VRAM:** **2.061 s / 0.96 GB** (Matches Run 53).
* **LoRA Generation Latency / Inference VRAM:** **0.844 s / 0.96 GB** (Matches Run 54).
* **QLoRA Generation Latency / Inference VRAM:** **1.668 s / 0.46 GB** (Matches Run 59).
* **Base Model Faithfulness:** **95.2%** (Matches Run 53).
* **LoRA & QLoRA Faithfulness:** **100.0%** (Matches Runs 54 & 59).
* **Offline Pipeline Latency (CPU):** **0.0119 s** (11.9 ms, Matches Run 42).
* **Ablation Study Metrics (Runs 45–50):** 100% consistent with `ablation_study_summary.json`.
* **Legacy Rejected Figures Check:** Verified 0 occurrences of `89.4%`, `94.2%`, `88.1%`, `92.8%`, `91.0%`, `95.0%`, or `50 test cases`.

### 2.6 Figure & Table Verification
* **Fig. 1 (System Architecture):** Accurately reflects all stages in the codebase: document ingestion, 32-dim deterministic hash vector, parallel lexical/vector matching, RRF re-ranking, algorithmic evidence gate, neural generation options, sentence claim decomposition, reliability scoring, citations, and safe refusal escalation.
* **Table 1 (Empirical Holdout Results):** Directly supported by `real_lora_holdout_summary.json` (Run 54) and `real_qlora_holdout_summary.json` (Run 59).
* **Table 2 (Offline Extractive Pipeline Baseline):** Directly supported by SQLite Run 42 and `final_frozen_holdout_summary.json`.
* **Table 3 (Component Ablation Study):** Directly supported by `ablation_study_summary.json` (Runs 45–50).

### 2.7 Research Integrity Confirmation
* **No Overclaiming:** Phrasing is objective and scientifically grounded. The paper contains zero instances of promotional language (*"world's first"*, *"first ever"*, *"completely novel"*, *"universally reliable"*, or *"production-proven"*).
* **Truthful Terminology:** The retrieval vector is consistently designated as a *"32-dimensional deterministic token/hash vector representation"*. The paper explicitly denies the use of neural embeddings in the current implementation.
* **Latency Separation:** CPU candidate retrieval latency ($0.0049$ s – $0.0168$ s) is rigorously decoupled from GPU autoregressive neural generation latency ($0.844$ s – $2.061$ s).
* **Hardware Disclosure:** GPU is accurately documented as an **NVIDIA GeForce RTX 2050 Laptop GPU** (4.0 GB VRAM, CUDA 12.4). All previous unverified references to RTX 3050 are eliminated.
* **Leakage Prevention:** Confirmed 0.0% training and benchmark data leakage.

---

## 3. Final Quality Recommendation

The first complete draft of the SupportIQ research paper ([`research/SUPPORTIQ_RESEARCH_PAPER_DRAFT.md`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/research/SUPPORTIQ_RESEARCH_PAPER_DRAFT.md)) fulfills all academic and empirical quality requirements. It exhibits rigorous methodology, complete data integrity, flawless citation matching, transparent hardware disclosures, and truthful reporting of empirical trade-offs.

PAPER READY FOR FINAL EDIT
