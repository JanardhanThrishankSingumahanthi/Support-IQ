# SupportIQ: Academic Paper Formatting Checklist

**Formatted Document:** [`research/SUPPORTIQ_RESEARCH_PAPER_FORMATTED.md`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/research/SUPPORTIQ_RESEARCH_PAPER_FORMATTED.md)  
**Source of Truth:** [`research/SUPPORTIQ_RESEARCH_PAPER_FINAL.md`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/research/SUPPORTIQ_RESEARCH_PAPER_FINAL.md)  
**Auditor:** Senior Academic Peer Reviewer & Research Integrity Auditor  
**Date:** September 28, 2026  

---

## Formatting Verification Checklist

- [x] **Title:** Preserved approved research title: *"Retrieval-augmented Question Answering via Parameter-efficient Fine-tuning (LoRA/QLoRA), Applied to Customer Support Chatbot Automation"*.
- [x] **Author:** Exactly single author: Janardhan Thrishank Singumahanthi. Zero co-authors added.
- [x] **Affiliation:** Department of Computer Science and Engineering (AI & ML), Ramachandra College of Engineering, Eluru, Andhra Pradesh, India. Email: `janardhanthrisank123@gmail.com`.
- [x] **Abstract:** Structured academic progression covering domain challenges, two-stage hybrid retrieval, sub-1B PEFT (LoRA/QLoRA), deterministic claim verification, empirical benchmark results ($N=10$), and hardware trade-offs on RTX 2050. Explicitly notes benchmark scale.
- [x] **Keywords:** Exactly 9 standard indexing keywords (Retrieval-Augmented Generation, Customer Support QA, Parameter-Efficient Fine-Tuning, LoRA, QLoRA, Reciprocal Rank Fusion, Grounding Verification, Hallucination Suppression, Edge AI) aligned with IEEE/ACM taxonomies.
- [x] **Section Numbering:** Formatted into exactly 18 numbered sections matching the required academic structure:
  - 1. Introduction
  - 2. Literature Review
  - 3. Research Gap
  - 4. Research Questions and Objectives
  - 5. Methodology
  - 6. Dataset and Data Preparation
  - 7. System Architecture
  - 8. Retrieval and Reciprocal Rank Fusion
  - 9. LoRA and QLoRA Fine-tuning
  - 10. Grounding and Claim Verification
  - 11. Experimental Setup
  - 12. Evaluation Metrics
  - 13. Results
  - 14. Ablation Analysis
  - 15. Discussion
  - 16. Limitations
  - 17. Conclusion
  - 18. Future Work
  - References
- [x] **Tables:** Every table includes a formal table number, descriptive caption, consistent columns, and verified metrics:
  - *Table 1:* Main empirical benchmark comparison across Base Qwen, SupportIQ LoRA, and SupportIQ QLoRA.
  - *Table 2:* Offline extractive baseline (Run 42) reporting 0.0119s CPU retrieval latency with GPU generation latency marked as *Not measured*.
  - *Table 3:* Component ablation study across Runs 45–50 from Experiment 4.
- [x] **Figures:** Figure 1 (End-to-End System Architecture) accurately models: User Query $\rightarrow$ Query Processing & Hybrid Retrieval $\rightarrow$ RRF Re-ranking $\rightarrow$ Algorithmic Evidence Gate $\rightarrow$ Context Assembly $\rightarrow$ Neural Adapter Generation $\rightarrow$ Grounding Check & Claim Verification $\rightarrow$ Evidence Attribution & Provenance Citations / Safe Abstention & Human Escalation. Text references Fig. 1 explicitly.
- [x] **Equations:** Formally presented in display math syntax ($$\dots$$) for lexical overlap, 32-dimensional deterministic hash-vector cosine similarity, Reciprocal Rank Fusion, LoRA low-rank decomposition, QLoRA NF4 quantile formulation, claim evidence scoring, continuous reliability scoring, Recall@5, MRR, Composite Accuracy, Faithfulness, Citation Correctness, and Hallucination Rate.
- [x] **Citations:** All 16 in-text citations ([1] through [16]) map 1:1 to the bibliography with zero missing or orphaned references.
- [x] **References:** Exactly 16 verified, peer-reviewed seminal works formatted in consistent IEEE bibliographic style. Zero fabricated references.
- [x] **Page/Section Flow:** Smooth, logical progression from problem framing to empirical trade-off analysis, boundary disclosures, and future work directions.
- [x] **Academic Language:** Objective, formal, evidence-based tone. Zero promotional terms (*"world's first"*, *"best"*, *"perfect"*, *"universally reliable"*, *"guaranteed"*, or *"production-proven"*).
- [x] **Limitations:** Clearly visible in dedicated Section 16, disclosing all 6 operational boundaries: $N=10$ holdout scale, single RTX 2050 4 GB GPU hardware boundary, deterministic hash-vector representation limits, 7-document corporate policy domain, single-turn QA scope, and generalization constraints.
- [x] **No Fabricated Data:** Every single measurement is traceable to SQLite database runs (`supportiq.db`) or summary evaluation JSON files.
- [x] **No Changed Experimental Values:** Exact verified values preserved:
  - Base Model: 100.0% accuracy, 95.2% faithfulness, 2.061 s generation latency, 0.96 GB inference VRAM.
  - SupportIQ LoRA: 100.0% accuracy, 100.0% faithfulness, 0.844 s generation latency, 0.96 GB inference VRAM.
  - SupportIQ QLoRA: 100.0% accuracy, 100.0% faithfulness, 1.668 s generation latency, 0.46 GB inference VRAM.
  - Trainable parameters: 540,672 out of 494,573,440 (0.1093%).
  - Zero presence of rejected legacy metrics (`89.4%`, `94.2%`, `88.1%`, `92.8%`, `91.0%`, `95.0%`, `50 test cases`).

---

ACADEMIC FORMATTING STATUS: READY
