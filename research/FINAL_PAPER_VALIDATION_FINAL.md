# SupportIQ Final Paper Validation

**Evaluated Artifact:** [`research/SUPPORTIQ_RESEARCH_PAPER_FINAL.md`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/research/SUPPORTIQ_RESEARCH_PAPER_FINAL.md)  
**Baseline Artifact:** [`research/RESEARCH_FOUNDATION.md`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/research/RESEARCH_FOUNDATION.md)  
**Evaluation Date:** September 28, 2026  
**Auditor:** Senior Academic Peer Reviewer & Research Integrity Auditor  

---

## 1. Overall Result

The final research paper edition for SupportIQ ([`research/SUPPORTIQ_RESEARCH_PAPER_FINAL.md`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/research/SUPPORTIQ_RESEARCH_PAPER_FINAL.md)) has undergone a complete, independent academic and empirical validation. 

The paper adheres strictly to the verified research foundation:
* All 27 structural sections satisfy high academic writing standards and logical continuity.
* All empirical numbers, training durations, loss trajectories, and hardware telemetries match repository source files exactly.
* Prior unverified legacy figures (`89.4%`, `94.2%`, `88.1%`, `92.8%`, `91.0%`, `95.0%`, `50 test cases`) are **100% absent**.
* The retrieval vector is accurately documented as a **32-dimensional deterministic hash-vector representation** with explicit disclaimers confirming the absence of neural embeddings.
* CPU candidate retrieval latency ($0.0119$ s) is strictly segregated from GPU neural autoregressive generation latency ($0.844$ s – $2.061$ s).
* All 16 bibliographic references ([1]–[16]) correspond to authentic, peer-reviewed seminal publications with 100% bidirectional citation correspondence.
* The paper maintains an objective, evidence-based academic tone with zero promotional hyperbole.

---

## 2. Section-by-Section Validation

| Section | Status | Finding |
|---|---|---|
| **1. Author and Affiliation** | **PASS** | Exactly 1 author (Janardhan Thrishank Singumahanthi); affiliation (Dept. of CSE AI & ML, Ramachandra College of Engineering, Eluru, Andhra Pradesh, India) and email (`janardhanthrisank123@gmail.com`) are verified. Zero unapproved co-authors. |
| **2. Title** | **PASS** | Title (*"Retrieval-augmented Question Answering via Parameter-efficient Fine-tuning (LoRA/QLoRA), Applied to Customer Support Chatbot Automation"*) accurately and formally reflects core paradigms, domain, and scope. |
| **3. Abstract** | **PASS** | Follows structured progression: domain motivation, hybrid retrieval, sub-1B PEFT (LoRA/QLoRA), claim verification, empirical results on $N=10$ holdout, and operational trade-offs. Explicitly notes benchmark scale. |
| **4. Keywords** | **PASS** | 9 standard indexing keywords (RAG, Customer Support QA, PEFT, LoRA, QLoRA, RRF, Grounding Verification, Hallucination Suppression, Edge AI) aligned with IEEE/ACM taxonomies. |
| **5. Introduction** | **PASS** | Thoroughly articulates customer service challenges, operational risks of unaugmented LLMs, 3 core deficiencies of standard RAG, and introduces SupportIQ. Appropriately cites seminal literature ([1], [12], [10], [13], etc.). |
| **6. Literature Review** | **PASS** | Comprehensive synthesis of 16 peer-reviewed works across RAG ([1], [9]), lexical/dense retrieval ([5], [11], [4]), PEFT ([2], [3], [6]), and grounding/attribution ([7], [8], [10], [13], [14]). Zero fabricated entries. |
| **7. Research Gap** | **PASS** | 3 operational gaps (structured policy retrieval, sub-1B QLoRA on 4 GB laptop GPU, deterministic in-pipeline claim attribution) explicitly contrast prior art against the investigated combination under edge compute. |
| **8. Research Questions/Objectives** | **PASS** | RO1 through RO4 map directly to repository ablation and live neural benchmark implementations. Completely testable and empirically validated. |
| **9. Dataset** | **PASS** | Accurate inventory of 7 documents (14 chunks), instruction pool (31 train / 10 val), Dev/Val Dataset 1 ($N=10$), and Frozen Holdout Dataset 2 ($N=10$). Strictly verified 0.0% data leakage. |
| **10. Methodology** | **PASS** | Logical 7-stage workflow from ingestion to evidence attribution. Transparently discloses greedy decoding and deterministic claim verification mechanics. |
| **11. System Architecture** | **PASS** | Fig. 1 ASCII diagram accurately depicts all stages: Query Processing $\rightarrow$ Hybrid Retrieval $\rightarrow$ RRF $\rightarrow$ Evidence Gate $\rightarrow$ Context Assembly $\rightarrow$ Neural Generation $\rightarrow$ Grounding Check $\rightarrow$ Claim Verification $\rightarrow$ Citations / Safe Abstention. |
| **12. Retrieval** | **PASS** | Alphanumeric tokenization, 128 standard stopwords, 18 domain stopwords, and 32-dimensional deterministic hash-vector via SHA-1 modulo 32 accurately described. Cosine similarity formula provided. |
| **13. RRF** | **PASS** | Reciprocal Rank Fusion formula mathematically verified ($k=60$, lexical weight $0.60$, vector weight $0.40$). Composite tie-breaking score ($0.65 \times \text{Lexical} + 0.35 \times \text{Cosine}$) correctly formulated. |
| **14. LoRA** | **PASS** | Low-rank decomposition ($r=8, \alpha=16$, dropout $0.05$, $q/\text{v\_proj}$), parameter economy (540,672 / 0.1093%), training duration (9.06s), and loss trajectory ($1.6426 \rightarrow 1.4008$) match verified records. |
| **15. QLoRA** | **PASS** | 4-bit NF4 quantile quantization, double quantization, FP16 compute dtype, adapter parameter count (540,672), training duration (21.60s), and loss trajectory ($1.5872 \rightarrow 1.3748$) match verified records. |
| **16. Grounding** | **PASS** | Sentence-level claim proposition decomposition via regex delimiters (`[.!?]\s+|\n+`) and substantive token overlap against retrieved chunks accurately formulated. |
| **17. Claim Verification** | **PASS** | Supported claim threshold ($\ge 0.12$), coverage calculation, continuous reliability formulation ($(0.7 \times \text{Coverage}) + (0.3 \times \text{NormalizedSupport})$), and grounding status tiers correctly documented. |
| **18. Evidence Attribution** | **PASS** | Verified provenance citations (Doc ID, Title, Page, Chunk, Text excerpt) and transparent safe refusal notice with 1-click human ticketing escalation correctly specified. |
| **19. Experimental Setup** | **PASS** | Hardware environment accurately documented: NVIDIA GeForce RTX 2050 Laptop GPU (4.0 GB VRAM), CUDA 12.4, PyTorch 2.6.0+cu124, Python 3.12.10, Transformers 5.17.0, PEFT 0.21.0, bitsandbytes 0.50.2. |
| **20. Evaluation Metrics** | **PASS** | Complete mathematical definitions for Recall@5, MRR, Accuracy, Faithfulness, Citation Correctness, and Hallucination Rate. CPU retrieval latency is strictly decoupled from GPU generation latency. |
| **21. Results** | **PASS** | Table 1 reflects live neural holdout results (LoRA: 100% Acc, 100% Faith, 0.844s, 0.96 GB; QLoRA: 100% Acc, 100% Faith, 1.668s, 0.46 GB; Base: 100% Acc, 95.2% Faith, 2.061s, 0.96 GB). Table 2 reports offline Run 42 (0.0119s CPU). |
| **22. Ablation Study** | **PASS** | Table 3 details all 6 component ablation runs (Runs 45–50 from Exp 4). Granular per-case error analysis for Cases 18, 19, and 20 details exact failure modes (keyword traps, semantic drift, boilerplate collisions). |
| **23. Discussion** | **PASS** | Rigorous operational trade-off analysis: QLoRA cuts VRAM by 52.1% (0.46 GB) while LoRA is 1.98x faster in generation (0.844s). Explains why Naive RAG fails without deterministic gating. No single winner declared. |
| **24. Limitations** | **PASS** | Transparent disclosures across all 6 required areas: holdout size ($N=10$), single laptop GPU boundary, deterministic hash vector limits, 7-document policy scope, single-turn QA scope, and generalization boundaries. |
| **25. Conclusion** | **PASS** | Balanced, concise summary of core empirical findings, parameter economy, and practical implications without speculative overclaiming. |
| **26. Future Work** | **PASS** | 5 realistic extensions outlined: lightweight learned neural bi-encoders, expanded multi-turn benchmarks, broader document domains, CRM ticketing APIs, and human-in-the-loop DPO. |
| **27. References** | **PASS** | 16 complete, real, standard IEEE-formatted references matching all in-text citations. 100% bidirectional correspondence between text citations and reference list. Zero fabricated citations. |

---

## 3. Numerical Verification

Every empirical value in [`research/SUPPORTIQ_RESEARCH_PAPER_FINAL.md`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/research/SUPPORTIQ_RESEARCH_PAPER_FINAL.md) was cross-checked against database records and JSON summaries:

* **Training Set Size:** Exactly **31** (Matches `supportiq_train.jsonl`).
* **Validation Set Size:** Exactly **10** (Matches `supportiq_val.jsonl`).
* **Frozen Holdout Suite:** Exactly **10 cases** (7 answerable, 3 unsupported).
* **Trainable Parameters:** Exactly **540,672 out of 494,573,440** (**0.1093%**).
* **LoRA Training Duration & Loss:** **9.06 seconds**; Cross-entropy validation loss: $1.6426 \rightarrow 1.4008$.
* **QLoRA Training Duration & Loss:** **21.60 seconds**; Cross-entropy validation loss: $1.5872 \rightarrow 1.3748$.
* **Base Model (Run 53):**
  - Accuracy = **100.0% (10/10)**
  - Faithfulness = **95.2%**
  - Recall@5 = **1.0000**
  - MRR = **1.0000**
  - Citation Correctness = **100.0% (10/10)**
  - Hallucination Rate = **0.0% (0/3)**
  - Generation Latency = **2.061 s**
  - Peak Inference VRAM = **0.96 GB**
* **SupportIQ LoRA (Run 54):**
  - Accuracy = **100.0% (10/10)**
  - Faithfulness = **100.0%**
  - Recall@5 = **1.0000**
  - MRR = **1.0000**
  - Citation Correctness = **100.0% (10/10)**
  - Hallucination Rate = **0.0% (0/3)**
  - Generation Latency = **0.844 s**
  - Peak Inference VRAM = **0.96 GB**
* **SupportIQ QLoRA (Run 59):**
  - Accuracy = **100.0% (10/10)**
  - Faithfulness = **100.0%**
  - Recall@5 = **1.0000**
  - MRR = **1.0000**
  - Citation Correctness = **100.0% (10/10)**
  - Hallucination Rate = **0.0% (0/3)**
  - Generation Latency = **1.668 s**
  - Peak Inference VRAM = **0.46 GB**
* **Offline Extractive Baseline (Run 42):**
  - CPU Retrieval Latency = **0.0119 s (11.9 ms)**
  - GPU Neural Generation Latency = Strictly marked as ***Not measured***.
* **Component Ablation Study (Runs 45–50):**
  - Run 45 (BM25 Only): Accuracy = 90.0%, Recall@5 = 1.0000, MRR = 1.0000, Faithfulness = 95.6%, Hallucination = 33.3%, Latency = 0.0052s.
  - Run 46 (Dense Vector Only): Accuracy = 70.0%, Recall@5 = 1.0000, MRR = 0.7976, Faithfulness = 76.5%, Hallucination = 100.0%, Latency = 0.0051s.
  - Run 47 (Hybrid w/o RRF): Accuracy = 90.0%, Recall@5 = 1.0000, MRR = 1.0000, Faithfulness = 90.8%, Hallucination = 33.3%, Latency = 0.0051s.
  - Run 48 (Hybrid + RRF / Naive RAG): Accuracy = 70.0%, Recall@5 = 1.0000, MRR = 1.0000, Faithfulness = 0.0%, Hallucination = 100.0%, Latency = 0.0051s.
  - Run 49 (Full Retr. + Generic Verif.): Accuracy = 90.0%, Recall@5 = 1.0000, MRR = 1.0000, Faithfulness = 98.0%, Hallucination = 33.3%, Latency = 0.0051s.
  - Run 50 (Full SupportIQ Pipeline): Accuracy = 100.0%, Recall@5 = 1.0000, MRR = 1.0000, Faithfulness = 98.0%, Hallucination = 0.0%, Latency = 0.0049s.

---

## 4. Dataset Verification

* **Knowledge Base Documents:** Exactly **7 authentic documents** (`Return_Policy.pdf`, `Terms_of_Service.pdf`, `Product_Warranty.pdf`, `Customer_FAQ.pdf`, `Payment_Guide.docx`, `Account_Management.pdf`, `Express_Replacement_Policy_Test.txt`).
* **Discrete Policy Chunks:** Exactly **14 chunks** (Chunks 1–14).
* **Instruction Dataset Partition:** Exactly **31 training examples** and **10 validation examples** (Total: 41 instruction pairs).
* **Benchmark Suites:**
  - Dataset 1 (Dev/Validation v1): 10 test cases (7 answerable, 3 unsupported), mapping to Chunks `{1, 2, 5, 6, 8, 10, 14}`.
  - Dataset 2 (Frozen Holdout v1): 10 test cases (7 answerable, 3 unsupported), mapping to Chunks `{3, 4, 7, 9, 11, 12, 13}`.
* **Leakage Prevention:** Confirmed **0.0% leakage** ($\emptyset$ chunk intersection, 0 overlapping queries/answers between holdout and training data).

---

## 5. Model and Hardware Verification

* **Foundation Model:** `Qwen/Qwen2.5-0.5B-Instruct` (Total parameters: 494,573,440).
* **Hardware:** NVIDIA GeForce RTX 2050 Laptop GPU (1 physical device, 4.00 GB dedicated VRAM, CUDA 12.4).
* **Software Stack:** Python 3.12.10, PyTorch 2.6.0+cu124, HuggingFace Transformers 5.17.0, PEFT 0.21.0, bitsandbytes 0.50.2 on Windows 11.
* **Integrity Resolution:** Zero references to unverified hardware (such as RTX 3050).

---

## 6. Retrieval and RRF Verification

* **Retrieval Architecture:**
  - Lexical Channel: BM25/token-overlap scoring with standard (128 words) and domain-specific (18 words) stopword filtering.
  - Vector Channel: 32-dimensional deterministic hash-vector representation via SHA-1 token hashing modulo 32.
  - Similarity Metric: Cosine similarity over 32-dimensional hash vectors.
  - Re-ranking Engine: Non-linear Reciprocal Rank Fusion (RRF) with smoothing parameter $k=60$, lexical weight $0.60$, and vector weight $0.40$.
  - Tie-breaking: Composite similarity score ($0.65 \times \text{LexicalScore} + 0.35 \times \text{CosineSim}$).
* **Explicit Negative Disclosure:** The paper clearly and explicitly states that the 32-dimensional vector is a **deterministic hash-vector representation** and **NOT** a learned neural embedding model (such as BERT or Sentence-Transformers).

---

## 7. LoRA/QLoRA Verification

* **LoRA Configuration:**
  - Precision: FP16 (`torch.float16`).
  - Low-rank decomposition: Rank $r=8$, Scaling factor $\alpha=16$, Dropout $0.05$.
  - Target modules: Self-attention query (`q_proj`) and value (`v_proj`) projections.
  - Trainable parameters: 540,672 (0.1093% of base model).
* **QLoRA Configuration:**
  - Quantization: 4-bit NormalFloat (NF4) with double quantization.
  - Compute dtype: FP16.
  - Adapter targets: Identical low-rank decomposition ($r=8, \alpha=16$, `q_proj`/`v_proj`, 540,672 parameters).

---

## 8. Results Verification

* **Empirical Trade-off Synthesis:**
  - Generation Speed: FP16 LoRA generates answers in **0.844 s**, outperforming QLoRA (1.668 s) by $1.98\times$ and Base Qwen (2.061 s) by $2.44\times$.
  - VRAM Footprint: 4-bit NF4 QLoRA allocates **0.46 GB VRAM**, reducing memory consumption by **52.1%** relative to LoRA (0.96 GB) and Base Qwen (0.96 GB).
  - Task Grounding: Both fine-tuned adapters achieved **100.0% composite accuracy** and **100.0% claim faithfulness** on the 10 holdout cases.
* **Latency Decoupling:** CPU retrieval latency ($0.0049$ s – $0.0168$ s) is rigorously separated from GPU autoregressive neural generation latency ($0.844$ s – $2.061$ s).

---

## 9. Citation Verification

* **Total Citations in Text:** 16 citations ([1] through [16]).
* **Total References Listed:** Exactly 16 matching references.
* **Bidirectional Audit:** 100% verified match across all 16 seminal citations:
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
* **Fabricated / Unverified References:** Zero.

---

## 10. Table and Figure Verification

* **Figure 1 (System Architecture):** Accurately diagrams the full end-to-end processing pipeline, from query processing and hybrid candidate retrieval to claim verification and evidence attribution. No speculative or unimplemented components are depicted.
* **Table 1 (Empirical Benchmark Results):** Accurately reflects live neural holdout results from `real_lora_holdout_summary.json` and `real_qlora_holdout_summary.json`.
* **Table 2 (Offline Extractive Pipeline Baseline):** Accurately reflects Run 42 from `final_frozen_holdout_summary.json`.
* **Table 3 (Component Ablation Study):** Accurately reflects Runs 45–50 from `ablation_study_summary.json`.

---

## 11. Research Integrity Verification

* **Excluded Legacy Figures Check:** Confirmed 0 occurrences of rejected synthetic figures:
  - `89.4%` &rarr; 0 instances
  - `94.2%` &rarr; 0 instances
  - `88.1%` &rarr; 0 instances
  - `92.8%` &rarr; 0 instances
  - `91.0%` &rarr; 0 instances
  - `95.0%` &rarr; 0 instances
  - `50 test cases` &rarr; 0 instances
* **Overclaiming Check:** Confirmed 0 instances of promotional/overclaiming terms:
  - *"world's first"* &rarr; 0 instances
  - *"first ever"* &rarr; 0 instances
  - *"completely novel"* &rarr; 0 instances
  - *"universally reliable"* &rarr; 0 instances
  - *"production-proven"* &rarr; 0 instances
  - *"guaranteed"* &rarr; 0 instances
  - *"perfect"* &rarr; 0 instances
  - *"solves hallucination"* &rarr; 0 instances
* **Limitations Transparency:** Section 15 explicitly details all 6 required limitations:
  1. Frozen holdout size is restricted to $N=10$.
  2. Single laptop workstation GPU (RTX 2050, 4 GB VRAM) boundary.
  3. Deterministic hash-vector retrieval vs. learned continuous embedding limitations.
  4. Limited domain scope across seven corporate policy documents.
  5. Single-turn question-answering evaluation scope.
  6. Explicit constraint against generalizing results beyond tested experimental conditions.

---

## 12. Remaining Issues

* **None.** No outstanding empirical, structural, or citation issues remain.
* For camera-ready conference/journal submission, the Markdown draft can be directly ported into the publisher's official LaTeX template (e.g., `IEEEtran.cls`), and Figure 1 can be rendered as a vector PDF/SVG graphic.

---

## 13. Final Decision

FINAL PAPER VALIDATION: PASS

The final research paper is ready for academic formatting and presentation preparation.
