# SupportIQ: Presentation Content Source Mapping

This document provides a trace mapping between each slide in [`presentation/SupportIQ_Research_Presentation.pptx`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/presentation/SupportIQ_Research_Presentation.pptx) and its primary source section in the validated, formatted academic research paper ([`research/SUPPORTIQ_RESEARCH_PAPER_FORMATTED.md`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/research/SUPPORTIQ_RESEARCH_PAPER_FORMATTED.md)) and empirical baseline ([`research/RESEARCH_FOUNDATION.md`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/research/RESEARCH_FOUNDATION.md)).

---

## Slide-to-Paper Source Traceability Matrix

| Slide # | Slide Title | Primary Paper Source Section | Source Subsection / Verification Record | Key Information Mapped |
|:---:|:---|:---|:---|:---|
| **1** | Title Slide | Title & Author Header | Frontmatter | Title, Author (Janardhan Thrishank Singumahanthi), Department (CSE AI & ML), Institution (RCE Eluru), Email, Paradigm: RETRIEVE → VERIFY → RESOLVE. |
| **2** | Problem Statement | 1. Introduction | Sec. 1, Paragraphs 1–2 | Repetitive inquiries, search latency, generative hallucinations in unaugmented LLMs, legal/financial liabilities, compute limits. |
| **3** | Motivation | 1. Introduction & 5. Methodology | Sec. 1, Paragraphs 3–4; Sec. 5 | Reliable knowledge-grounded answers, traceable attribution, safe abstention on unsupported queries, resource-efficient PEFT. |
| **4** | Existing Approaches | 2. Literature Review & 3. Research Gap | Sec. 2.1–2.3; Sec. 3 | Standalone LLM, Basic RAG (BM25), Dense Bi-Encoder (DPR), Naive RAG (RRF without gate), and SupportIQ. |
| **5** | Literature Review | 2. Literature Review | Sec. 2.1–2.3; References [1]–[16] | Synthesis of 16 seminal peer-reviewed citations across RAG, BM25, DPR, RRF, LoRA, QLoRA, Qwen2.5, FEVER, Self-RAG, and Attributed QA. |
| **6** | Research Gap | 3. Research Gap | Sec. 3, Gaps 1–3 | Gap 1: Structured policy retrieval; Gap 2: Sub-1B QLoRA on 4 GB laptop GPU; Gap 3: Deterministic in-pipeline claim attribution. |
| **7** | Research Questions & Objectives | 4. Research Questions and Objectives | Sec. 4, RQ1–RQ4 / RO1–RO4 | Candidate recall/MRR, parameter-efficient domain adaptation (<=0.11%), deterministic claim verification, hardware efficiency trade-offs. |
| **8** | Proposed System | 5. Methodology | Sec. 5, Stages 1–7 | Complete 8-stage operational flow and dual resolution paths: Verified Grounded Answer vs. Safe Abstention & Human Escalation. |
| **9** | System Architecture | 7. System Architecture | Sec. 7, Fig. 1 | Multi-stage technical data flow from API ingestion, candidate retrieval, RRF, evidence gate, context assembly, neural generation, and verification. |
| **10** | Hybrid Retrieval + RRF | 8. Retrieval and Reciprocal Rank Fusion | Sec. 8.1–8.3 | BM25 lexical overlap, 18 domain stopwords, SHA-1 32-D hash vector, cosine similarity, RRF formula (k=60, 0.60/0.40), evidence gate thresholds. |
| **11** | LoRA Adaptation | 9. LoRA and QLoRA Fine-tuning | Sec. 9.1–9.2 | Low-rank decomposition (r=8, α=16, dropout 0.05, q/v_proj), 540,672 parameters (0.1093%), 9.06s training time, loss 1.6426 -> 1.4008. |
| **12** | QLoRA Quantization | 9. LoRA and QLoRA Fine-tuning | Sec. 9.3 | 4-bit NF4 quantile quantization, double quantization (0.37 bits/param saved), FP16 compute, 21.60s training time, 1.79 GB training VRAM. |
| **13** | Grounding & Claim Verification | 10. Grounding and Claim Verification | Sec. 10.1–10.3 | Regex claim decomposition, substantive token alignment (threshold >= 0.12), continuous reliability formulation, status tiers, ticketing modal. |
| **14** | Dataset & Data Governance | 6. Dataset and Data Preparation | Sec. 6.1–6.4 | 7 documents (14 chunks), 31 train / 10 val instruction pool, Dataset 1 and 2 (10 cases: 7 ans / 3 unsupp), strictly verified 0.0% data leakage. |
| **15** | Experimental Setup | 11. Experimental Setup | Sec. 11.1–11.2 | Qwen2.5-0.5B-Instruct, NVIDIA GeForce RTX 2050 Laptop GPU (4.0 GB VRAM), CUDA 12.4, PyTorch 2.6.0+cu124, greedy decoding protocol. |
| **16** | Evaluation Metrics | 12. Evaluation Metrics | Sec. 12.1–12.7 | Mathematical formulas for Recall@5, MRR, Accuracy, Faithfulness, Citation Correctness, Hallucination Rate, and CPU vs. GPU latency separation. |
| **17** | Main Empirical Results | 13. Results | Sec. 13, Table 1 & Table 2 | Base Qwen (100% Acc, 95.2% Faith, 2.061s, 0.96 GB), LoRA (100% Acc, 100% Faith, 0.844s, 0.96 GB), QLoRA (100% Acc, 100% Faith, 1.668s, 0.46 GB), Offline (0.0119s CPU). |
| **18** | Resource Trade-Off Analysis | 15. Discussion | Sec. 15.1 | LoRA 1.98x faster generation (0.844s) vs. QLoRA 52.1% VRAM reduction (0.46 GB), dequantization overhead explanation, non-generalization caveat. |
| **19** | Component Ablation Study | 14. Ablation Analysis | Sec. 14, Table 3 | Runs 45–50 from Experiment 4: BM25 Only (33.3% Halluc), Dense Vector Only (100% Halluc), Hybrid w/o RRF (33.3% Halluc), Naive RAG (100% Halluc), Generic (33.3% Halluc), Full Pipeline (0.0% Halluc). |
| **20** | SupportIQ System & UI Modules | 5. Methodology & System State | Project Architecture & UI | 6 functional panels: Knowledge Ingestion, Multi-Model Chat, Factual Reliability Inspector, Evidence Viewer, Safe Refusal & Escalation, GPU Telemetry. |
| **21** | Limitations | 16. Limitations | Sec. 16 | 6 explicit boundaries: N=10 holdout scale, single RTX 2050 4 GB GPU, deterministic hash-vector limits, 7-document domain, single-turn QA, generalization constraints. |
| **22** | Future Work | 18. Future Work | Sec. 18 | 5 extensions: lightweight learned neural bi-encoders (MiniLM), multi-turn benchmarks, broader document domains, CRM APIs, human-in-the-loop DPO. |
| **23** | Conclusion | 17. Conclusion | Sec. 17 | Concise evidence-based synthesis of architecture, empirical trade-offs, necessity of deterministic safeguards, and edge viability. |
| **24** | References | References | References [1]–[16] | Exactly 16 real seminal peer-reviewed citations in compact IEEE bibliographic format. |
