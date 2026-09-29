# SupportIQ — Final Document Generation Validation

## Generated Files

- [`research/SupportIQ_Research_Paper.docx`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/research/SupportIQ_Research_Paper.docx)
- [`research/SupportIQ_Research_Paper.pdf`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/research/SupportIQ_Research_Paper.pdf)

**Primary Source of Truth:** [`research/SUPPORTIQ_RESEARCH_PAPER_FORMATTED.md`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/research/SUPPORTIQ_RESEARCH_PAPER_FORMATTED.md)  
**Final Paper Independent Validation:** [`research/FINAL_PAPER_VALIDATION_FINAL.md`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/research/FINAL_PAPER_VALIDATION_FINAL.md)  
**PPT Status:** [`presentation/PPT_FINAL_VERIFICATION.md`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/presentation/PPT_FINAL_VERIFICATION.md) (`PPT FINAL VERIFICATION: PASS`)  
**Auditor:** Senior Academic Research Integrity Auditor  
**Date of Validation:** September 29, 2026  

---

## Formatting Validation

| Check | Status | Details |
|---|:---:|---|
| A4 page size | **PASS** | Exactly A4 dimensions ($8.27 \times 11.69$ inches / $595.27 \times 841.89$ points) in both DOCX and PDF. |
| Portrait orientation | **PASS** | Portrait orientation strictly enforced across all pages. |
| 1-inch margins | **PASS** | Exactly 1.00 inch (72 points / 1440 dxa) margins on Top, Bottom, Left, and Right. |
| Times New Roman | **PASS** | Times New Roman in DOCX; Times-Roman / Times-Bold / Times-Italic in ReportLab PDF vector rendering. |
| Academic heading hierarchy | **PASS** | Strict hierarchy: Title (18 pt bold), H1 (14 pt bold, numbered 1–18), H2 (12.5–13 pt bold), H3 (11.5–12 pt bold italic) with `keep_with_next = True`. |
| Justified body text | **PASS** | Body paragraphs formatted in 11.5–12 pt, justified alignment, line spacing 1.15. |
| Page numbers | **PASS** | Running footers: `"Page X of 17"` dynamically generated via two-pass canvas in PDF and Word XML `PAGE`/`NUMPAGES` fields in DOCX. |
| Tables formatted | **PASS** | All 3 empirical tables (Tables 1, 2, and 3) feature professional academic borders, deep navy headers (`#1E3A8A`), high-contrast white text, alternating row shading (`#F8FAFC`), and column widths fitting within $6.27$ inches ($451.27$ pt). |
| Figures formatted | **PASS** | Figure 1 architecture diagram and Section 10 grounding flow are cleanly framed within bordered monospace containers (`Consolas` / `Courier`) with centered italic captions. |
| Equations formatted | **PASS** | All mathematical equations (Recall@5, MRR, Accuracy, Faithfulness, RRF, NF4 quantile quantization, continuous reliability formulation) are centered and styled in clean mathematical italics. |
| References formatted | **PASS** | All 16 verified references [1]–[16] formatted in standard IEEE bibliographic style with hanging indents ($0.35$ inches / $22$ pt). |

---

## Content Validation

| Check | Status | Details |
|---|:---:|---|
| Title correct | **PASS** | Exact title: *"Retrieval-augmented Question Answering via Parameter-efficient Fine-tuning (LoRA/QLoRA), Applied to Customer Support Chatbot Automation"*. |
| Author correct | **PASS** | Single author: Janardhan Thrishank Singumahanthi. Zero co-authors, supervisors, or fictional affiliations added. |
| Affiliation correct | **PASS** | Department of Computer Science and Engineering (AI & ML), Ramachandra College of Engineering, Eluru, Andhra Pradesh, India. Email: `janardhanthrisank123@gmail.com`. |
| Abstract preserved | **PASS** | Complete 3-paragraph substantive abstract preserved in full without shortening or omitted claims. |
| All sections present | **PASS** | All 18 numbered sections (1. Introduction through 18. Future Work), plus Title, Author, Affiliation, Abstract, Keywords, and References preserved. |
| Dataset values correct | **PASS** | Exactly 7 documents (14 chunks), 31 training examples, 10 validation examples (41 total instruction pool), 10 frozen holdout benchmark test cases (7 answerable, 3 unsupported), 0.0% data leakage. |
| Experimental results correct | **PASS** | Base Qwen (100.0% Acc, 95.2% Faith, 2.061 s, 0.96 GB); SupportIQ LoRA (100.0% Acc, 100.0% Faith, 0.844 s, 0.96 GB); SupportIQ QLoRA (100.0% Acc, 100.0% Faith, 1.668 s, 0.46 GB); Offline Extractive (100.0% Acc, 98.0% Faith, 0.0119 s CPU, GPU generation strictly *Not measured*). |
| LoRA configuration correct | **PASS** | Rank $r=8$, scaling factor $\alpha=16$, dropout $0.05$, target modules `q_proj` / `v_proj`, exactly 540,672 trainable parameters (0.1093% of base model), 9.06s training duration, loss progression $1.6426 \rightarrow 1.4008$. |
| QLoRA configuration correct | **PASS** | 4-bit NF4 quantile quantization, double quantization (0.37 bits/param saved), FP16 compute, 21.60s training duration, 1.79 GB training VRAM, and 0.46 GB inference VRAM (52.1% reduction). |
| Retrieval description correct | **PASS** | BM25 token overlap + 18 domain stopwords + 32-D deterministic hash vector via SHA-1 modulo 32 + cosine similarity + RRF ($k=60$, lexical weight $0.60$, vector weight $0.40$). Explicitly disclosed as deterministic, NOT a learned neural embedding. |
| References preserved | **PASS** | Exactly 16 real seminal peer-reviewed citations ([1]–[16]) in IEEE format, exactly matching paper citations. |

---

## Integrity Validation

| Check | Status | Details |
|---|:---:|---|
| No fabricated metrics | **PASS** | Every empirical figure matches the verified research database (`supportiq.db`) and evaluation JSON records. Zero fabricated values. |
| No rejected legacy metrics | **PASS** | Programmatic search confirmed exactly **0 occurrences** of rejected legacy metrics (`89.4%`, `94.2%`, `88.1%`, `92.8%`, `91.0%`, `95.0%`, `50 test cases`). |
| No unsupported claims | **PASS** | Confirmed **0 occurrences** of promotional overclaims (*"world's first"*, *"first ever"*, *"completely novel"*, *"perfect"*, *"universally reliable"*, *"guaranteed"*, or *"production-proven"*). |
| No fabricated references | **PASS** | All 16 citations correspond to authentic, peer-reviewed seminal publications with verified authors, venues, volumes, and DOIs/arXiv IDs. |
| No changed experimental values | **PASS** | All experimental results remain strictly identical to [`research/SUPPORTIQ_RESEARCH_PAPER_FORMATTED.md`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/research/SUPPORTIQ_RESEARCH_PAPER_FORMATTED.md) and [`research/FINAL_PAPER_VALIDATION_FINAL.md`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/research/FINAL_PAPER_VALIDATION_FINAL.md). |

---

## File Validation

DOCX:
PASS

PDF:
PASS

DOCX/PDF content consistency:
PASS

---

## FINAL DECISION

FINAL DOCUMENT STATUS: READY
