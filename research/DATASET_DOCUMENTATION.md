# SupportIQ: Dataset Documentation & Data Governance

**Project Title:** Retrieval-augmented Question Answering via Parameter-efficient Fine-tuning (LoRA/QLoRA), Applied to Customer Support Chatbot Automation  
**Product:** SupportIQ  
**Document:** `research/DATASET_DOCUMENTATION.md`  
**Status:** Verified Baseline  

---

## 1. Knowledge Base Documents

The SupportIQ customer support knowledge base consists of authentic enterprise policy and operational procedure documents stored in SQLite and indexed for hybrid retrieval.

| Document ID | Title | Format | Verified Status | Stored Chunks | Research Role |
|:---:|:---|:---:|:---:|:---:|:---|
| **1** | `Return_Policy.pdf` | PDF | COMPLETED | Chunks 1, 2, 3 | Core Policy (Refunds, Return requirements, Processing timelines) |
| **2** | `Terms_of_Service.pdf` | PDF | COMPLETED | Chunks 4, 5 | Core Policy (SLA guarantees, Administrative credential security) |
| **3** | `Product_Warranty.pdf` | PDF | COMPLETED | Chunks 6, 7 | Core Policy (Standard Dell hardware warranty, RMA requirements) |
| **4** | `Customer_FAQ.pdf` | PDF | COMPLETED | Chunks 8, 9 | Operational Guide (Password reset procedures, Third-party ticketing integration) |
| **5** | `Payment_Guide.docx` | DOCX | COMPLETED | Chunks 10, 11 | Operational Guide (Accepted credit cards, Invoice download procedures) |
| **6** | `Account_Management.pdf` | PDF | COMPLETED | Chunks 12, 13 | Core Policy (Data encryption standards, Knowledge manager responsibilities) |
| **8** | `Express_Replacement_Policy_Test` | TXT | COMPLETED | Chunk 14 | Operational Guide (Express defective replacement window) |

*Storage Location:* `backend/app/storage/documents/` and SQLite table `documents`.

---

## 2. Document Chunks & Indexing

Each document is parsed, segmented into text chunks, and indexed with structural metadata:
* **Chunking Method:** Character/paragraph segmentation preserving structural sections (average chunk length: 250–550 characters).
* **Page Tracking:** Extracted page numbers are stored in `metadata_json["page"]` (e.g., Page 1, Page 2).
* **Vector Representation:** 32-dimensional deterministic token/hash vector computed via SHA-1 token hashing modulo 32 (`_hash_vector`) stored in `metadata_json["embedding"]`.
* **Lexical Representation:** Cleaned token sets with standard stopword filtering (`STOPWORDS`) and domain stopword segregation (`DOMAIN_STOPWORDS`).

---

## 3. Instruction Fine-Tuning Datasets (`supportiq_train.jsonl` & `supportiq_val.jsonl`)

The domain instruction tuning dataset was constructed to teach the foundation model (`Qwen/Qwen2.5-0.5B-Instruct`) to adhere strictly to provided support context and reject speculative synthesis.

### A. Dataset Partitioning Counts

| Split | File Path | Verified Count | Split % | Purpose |
|---|---|:---:|:---:|---|
| **Training** | `backend/data/training/supportiq_train.jsonl` | **31** | 75.6% | LoRA / QLoRA parameter adaptation |
| **Validation** | `backend/data/training/supportiq_val.jsonl` | **10** | 24.4% | Pre/post-training loss tracking and checkpoint evaluation |
| **Total** | `backend/data/training/dataset_manifest.json` | **41** | 100.0% | Full instruction-tuning suite |

> **Resolution of Discrepancy:** Previous conversational summaries inconsistently cited either `31 train / 10 val` or `32 train / 8 val`. Direct inspection of `supportiq_train.jsonl` (31 lines), `supportiq_val.jsonl` (10 lines), and `dataset_manifest.json` confirms that the exact, actual dataset partition is **31 training examples and 10 validation examples**.

### B. Record Schema & Example Structure

Every example adheres to a strict 6-key JSON schema:

```json
{
  "id": "siq-lora-001",
  "instruction": "You are SupportIQ's AI customer support assistant. Answer the customer's question accurately, professionally, and concisely using ONLY the provided support context. Do not invent facts not supported by the context.",
  "context": "3. REFUND POLICY Annual subscriptions may be refunded within 14 days of purchase, provided the service has not been substantially used. Refund requests are typically processed within 5-7 business days to the original payment method.",
  "question": "Can I get a refund for an annual subscription that was bought 10 days ago?",
  "answer": "Yes. Annual subscriptions may be refunded within 14 days of purchase, provided the service has not been substantially used. Since your purchase was 10 days ago, you are within the 14-day refund window.",
  "metadata": {
    "category": "Refund & Billing",
    "document_id": 1,
    "chunk_id": 1,
    "split": "train",
    "is_answerable": true,
    "grounded": true
  }
}
```

### C. Category Distribution
1. Account & Roles
2. Account Security
3. Billing & Payments
4. Express Replacement
5. Hardware Warranty
6. Integration
7. Product Returns
8. Refund & Billing
9. SLA & Reliability
10. Security & Privacy

---

## 4. Benchmark Datasets: Dataset 1 & Dataset 2

The repository defines two distinct benchmark suites in the SQLite database (`evaluation_datasets` and `evaluation_test_cases`):

### A. Dataset 1: SupportIQ Golden Dev/Validation Benchmark v1
* **Database ID:** 1
* **Version:** 1.0.0
* **Total Cases:** 10 ($N=10$)
* **Answerable Cases:** 7 ($N_{ans}=7$, Cases 1–7)
* **Unsupported / Adversarial Cases:** 3 ($N_{unsupp}=3$, Cases 8–10)
* **Targeted Knowledge Base Chunks:** Chunks 1, 2, 5, 6, 8, 10, 14
* **Purpose:** Algorithm development, parameter tuning, evidence threshold calibration (calibrated to $\text{threshold} \ge 0.15$).

### B. Dataset 2: SupportIQ Holdout Test Benchmark v1
* **Database ID:** 2
* **Version:** 1.0.0
* **Total Cases:** 10 ($N=10$)
* **Answerable Cases:** 7 ($N_{ans}=7$, Cases 11–17)
* **Unsupported / Adversarial Cases:** 3 ($N_{unsupp}=3$, Cases 18–20)
* **Targeted Knowledge Base Chunks:** Chunks 3, 4, 7, 9, 11, 12, 13
* **Purpose:** Unbiased, final empirical evaluation of offline RAG pipelines (Experiments 3 & 4) and live neural models (Experiments 7 & 12).
* **Frozen Status:** STRICTLY FROZEN (`created_at == updated_at == 2026-09-23 04:53:12`).

---

## 5. Complete Test Case Inventory

### Dataset 1 (Dev/Validation, Cases 1–10)
| Case ID | Category | Question | Answerable? | Target Doc | Target Chunk |
|:---:|:---|:---|:---:|:---:|:---:|
| **1** | Policy | "Within how many days can annual subscriptions be refunded?" | Yes | 1 | 1 |
| **2** | Policy | "What are the eligibility requirements to return a product?" | Yes | 1 | 2 |
| **3** | SLA | "What is the guaranteed uptime SLA for the SupportIQ platform?" | Yes | 2 | 5 |
| **4** | Warranty | "What is the standard warranty period for Dell hardware?" | Yes | 3 | 6 |
| **5** | Account | "How do I reset my account password if I forgot my credentials?" | Yes | 4 | 8 |
| **6** | Billing | "Which credit cards are accepted for subscription payments?" | Yes | 5 | 10 |
| **7** | Warranty & Replacement | "What is the window for requesting an express replacement for defective equipment?" | Yes | 8 | 14 |
| **8** | Unsupported | "What is the SupportIQ policy on intergalactic quantum teleportation insurance?" | No | None | None |
| **9** | Unsupported | "Can I use cryptocurrency to purchase orbital satellite launch slots?" | No | None | None |
| **10** | Unsupported | "What are the reimbursement rates for time-travel paradox liabilities?" | No | None | None |

### Dataset 2 (Frozen Holdout, Cases 11–20)
| Case ID | Category | Question | Answerable? | Target Doc | Target Chunk |
|:---:|:---|:---|:---:|:---:|:---:|
| **11** | Policy | "How long does it take for an approved refund to be processed after inspection?" | Yes | 1 | 3 |
| **12** | Security & Access | "What security measures does SupportIQ enforce for administrative account credentials?" | Yes | 2 | 4 |
| **13** | Warranty | "What is required before dispatching an RMA for hardware warranty claims?" | Yes | 3 | 7 |
| **14** | Integration | "How can SupportIQ be integrated with third-party ticketing platforms?" | Yes | 4 | 9 |
| **15** | Billing | "Where can customers download their monthly subscription invoices?" | Yes | 5 | 11 |
| **16** | Security | "What encryption standards are used to protect customer support conversations and documents?" | Yes | 6 | 12 |
| **17** | Account & Roles | "What responsibilities do knowledge managers have in SupportIQ?" | Yes | 6 | 13 |
| **18** | Unsupported | "Does SupportIQ offer holographic telepathic customer support?" | No | None | None |
| **19** | Unsupported | "Can I pay for my enterprise subscription with Martian mineral mining credits?" | No | None | None |
| **20** | Unsupported | "What is the warranty coverage for warp drive antimatter core containment breaches?" | No | None | None |

---

## 6. Holdout Strategy & Data Leakage Prevention

To ensure absolute scientific validity and prevent test leakage:
1. **Mutually Exclusive Knowledge Chunk Partitioning:**
   - Dev/Validation (Dataset 1) tests Chunks: `{1, 2, 5, 6, 8, 10, 14}`.
   - Frozen Holdout (Dataset 2) tests Chunks: `{3, 4, 7, 9, 11, 12, 13}`.
   - The intersection of tested knowledge chunks between Dataset 1 and Dataset 2 is $\emptyset$ (strictly disjoint).
2. **Zero Training Set Leakage:**
   - Training script pre-execution verification (`train_real_lora.py` and `train_real_qlora.py`) explicitly queries SQLite for all questions in Dataset 2 and asserts zero substring or lexical identity against `supportiq_train.jsonl`.
   - Independent verification via `audit_training_dataset.py` confirmed 0 holdout questions and 0 holdout target answers exist in the training or validation splits.
   - Train/Validation separation is also strictly disjoint (0 overlapping queries).

---

## 7. Dataset Statistics Summary

| Metric | Verified Value |
|---|:---:|
| Total Core Knowledge Base Documents | **7** (Docs 1–6, 8) |
| Total Core Knowledge Base Chunks | **14** (Chunks 1–14) |
| Total LoRA/QLoRA Training Examples | **31** |
| Total LoRA/QLoRA Validation Examples | **10** |
| Total Instruction Fine-Tuning Pool | **41** |
| Dataset 1 Test Cases (Dev/Val) | **10** (7 Answerable, 3 Unsupported) |
| Dataset 2 Test Cases (Frozen Holdout) | **10** (7 Answerable, 3 Unsupported) |
| Data Leakage Rate | **0.0%** (Verified Clean) |
