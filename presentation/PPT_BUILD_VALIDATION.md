# SupportIQ: Presentation Build Validation Report

**Artifact Evaluated:** [`presentation/SupportIQ_Research_Presentation.pptx`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/presentation/SupportIQ_Research_Presentation.pptx)  
**Slide Mapping Document:** [`presentation/PPT_CONTENT_SOURCE.md`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/presentation/PPT_CONTENT_SOURCE.md)  
**Primary Source of Truth:** [`research/SUPPORTIQ_RESEARCH_PAPER_FORMATTED.md`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/research/SUPPORTIQ_RESEARCH_PAPER_FORMATTED.md)  
**Empirical Baseline:** [`research/RESEARCH_FOUNDATION.md`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/research/RESEARCH_FOUNDATION.md)  
**Auditor:** Senior Academic Peer Reviewer & Research Integrity Auditor  
**Date:** September 28, 2026  

---

## 1. Presentation Structure and Content Checklist

- [x] **20–24 Slides:** Exactly 24 slides created in widescreen 16:9 format (13.333" × 7.5").
- [x] **Title (Slide 1):** Preserved exact title: *"Retrieval-augmented Question Answering via Parameter-efficient Fine-tuning (LoRA/QLoRA), Applied to Customer Support Chatbot Automation"*, product name *SupportIQ*, and core paradigm *RETRIEVE → VERIFY → RESOLVE*.
- [x] **Author (Slide 1):** Single author: Janardhan Thrishank Singumahanthi, Dept. of CSE (AI & ML), Ramachandra College of Engineering, Eluru, Andhra Pradesh, India. Email: `janardhanthrisank123@gmail.com`.
- [x] **Problem (Slide 2):** Highlights repetitive inquiry volume, agent search fatigue, unaugmented LLM hallucinations with financial/legal liabilities, and edge compute limits.
- [x] **Motivation (Slide 3):** Focuses on strict factual grounding, verifiable provenance attribution, safe abstention on unsupported queries, resource-efficient PEFT, and 1-click human escalation.
- [x] **Literature Review (Slide 5):** Synthesizes 16 seminal peer-reviewed works ([1]–[16]) across RAG, BM25, DPR, RRF, LoRA, QLoRA, Qwen2.5, FEVER, Self-RAG, and Attributed QA.
- [x] **Research Gap (Slide 6):** Articulates Gaps 1–3 (structured policy retrieval, sub-1B QLoRA on 4 GB laptop GPU, deterministic in-pipeline claim attribution).
- [x] **RQs/Objectives (Slide 7):** Formally presents RQ1–RQ4 and RO1–RO4 directly mapping to empirical system components.
- [x] **Architecture (Slide 9):** Clean technical flow: User Query $\rightarrow$ API Gateway $\rightarrow$ Knowledge Base $\rightarrow$ Hybrid Retrieval $\rightarrow$ RRF Re-ranking $\rightarrow$ Evidence Gate $\rightarrow$ Context Assembly $\rightarrow$ Neural Synthesis $\rightarrow$ Claim Verification $\rightarrow$ Citations / Safe Abstention.
- [x] **Retrieval/RRF (Slide 10):** BM25 token overlap + 18 domain stopwords + 32-D deterministic hash vector via SHA-1 modulo 32 + cosine similarity + RRF ($k=60$, lexical weight $0.60$, vector weight $0.40$). Explicitly confirms representation is deterministic, NOT a neural embedding.
- [x] **LoRA (Slide 11):** Low-rank decomposition ($r=8, \alpha=16$, dropout $0.05$, `q_proj`/`v_proj`), 540,672 trainable parameters (0.1093%), 9.06s training duration, validation loss $1.6426 \rightarrow 1.4008$.
- [x] **QLoRA (Slide 12):** 4-bit NF4 quantile quantization, double quantization (0.37 bits/param saved), FP16 compute, 21.60s training duration, 1.79 GB training VRAM.
- [x] **Grounding (Slide 13):** Sentence proposition decomposition, substantive token alignment (threshold $\ge 0.12$), continuous reliability formulation, status categories, and 1-click human ticketing modal.
- [x] **Dataset (Slide 14):** 7 documents (14 chunks), 31 training / 10 validation examples (41 total instruction pool), 10 frozen holdout cases (7 answerable, 3 unsupported), strictly verified 0.0% data leakage.
- [x] **Experimental Setup (Slide 15):** `Qwen/Qwen2.5-0.5B-Instruct` (494.6M params), NVIDIA GeForce RTX 2050 Laptop GPU (4.0 GB VRAM), CUDA 12.4, PyTorch 2.6.0+cu124, Python 3.12.10, greedy decoding protocol.
- [x] **Metrics (Slide 16):** Formulas for Recall@5, MRR, Composite Accuracy, Faithfulness, Citation Correctness, Hallucination Rate, and strict CPU vs. GPU latency separation.
- [x] **Results (Slide 17):** Clean empirical table preserving exact verified holdout metrics:
  - Base Qwen: 100.0% accuracy, 95.2% faithfulness, 2.061 s generation latency, 0.96 GB inference VRAM.
  - SupportIQ LoRA: 100.0% accuracy, 100.0% faithfulness, 0.844 s generation latency, 0.96 GB inference VRAM.
  - SupportIQ QLoRA: 100.0% accuracy, 100.0% faithfulness, 1.668 s generation latency, 0.46 GB inference VRAM.
  - Offline Extractive (Run 42): 100.0% accuracy, 98.0% faithfulness, 0.0119 s CPU retrieval latency, GPU generation latency marked as *Not measured*.
- [x] **Ablation (Slide 19):** Table 3 capturing Runs 45–50 from Experiment 4, detailing keyword traps and semantic drift mechanisms for adversarial Cases 18, 19, and 20.
- [x] **UI (Slide 20):** Structured architectural interface panels: Knowledge Ingestion, Multi-Model Chat, Factual Reliability Inspector, Evidence Viewer, Safe Refusal & Escalation, GPU Telemetry Dashboard.
- [x] **Limitations (Slide 21):** Clearly presents all 6 explicit limitations: $N=10$ holdout scale, single RTX 2050 4 GB GPU hardware boundary, deterministic hash-vector limits, 7-document policy domain, single-turn QA scope, and generalization constraints.
- [x] **Future Work (Slide 22):** 5 realistic future directions: learned neural bi-encoders (MiniLM), multi-turn benchmarks, broader document domains, CRM APIs, human-in-the-loop DPO.
- [x] **Conclusion (Slide 23):** Evidence-based synthesis of architecture, empirical trade-offs, necessity of deterministic safeguards, and edge viability without overclaiming.
- [x] **References (Slide 24):** Exactly 16 seminal peer-reviewed citations ([1]–[16]) in compact IEEE format.

---

## 2. Research Integrity & Negative Constraint Audits

- [x] **No Fabricated Values:** Every numerical metric matches SQLite database records (`supportiq.db`) or summary evaluation JSON files.
- [x] **No Rejected Legacy Metrics:** Confirmed zero instances of rejected figures:
  - `89.4%` &rarr; 0 instances
  - `94.2%` &rarr; 0 instances
  - `88.1%` &rarr; 0 instances
  - `92.8%` &rarr; 0 instances
  - `91.0%` &rarr; 0 instances
  - `95.0%` &rarr; 0 instances
  - `50 test cases` &rarr; 0 instances
- [x] **No Unsupported Claims:** Confirmed zero instances of promotional/overclaiming terms (*"world's first"*, *"best"*, *"perfect"*, *"universally reliable"*, *"guaranteed"*, or *"production-proven"*).
- [x] **Latency Separation:** CPU candidate retrieval latency ($0.0049$ s – $0.0168$ s) is strictly decoupled from GPU autoregressive neural generation latency ($0.844$ s – $2.061$ s).
- [x] **Terminology Honesty:** The retrieval representation is explicitly designated as a *32-dimensional deterministic hash-vector representation* and is confirmed not to be a neural embedding.

---

## 3. Final Build Status

PPT CREATION STATUS: READY FOR VERIFICATION
