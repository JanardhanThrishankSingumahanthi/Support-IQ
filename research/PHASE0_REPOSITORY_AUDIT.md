# SupportIQ: Phase 0 Repository Research Audit

**Audit Date:** September 28, 2026  
**Auditor:** Lead Systems Architect & Research Integrity Auditor (DeepMind Antigravity)  
**Project:** SupportIQ  
**Topic:** *Retrieval-Augmented Question Answering via Parameter-Efficient Fine-Tuning (LoRA/QLoRA), Applied to Customer Support Chatbot Automation*  
**Document Purpose:** Complete, unvarnished baseline audit of all research-relevant code, models, pipelines, datasets, execution scripts, database tables, and metrics prior to conducting new experiments or writing the formal research paper.

---

## 1. Current System Architecture

The SupportIQ codebase is structured as a decoupled, production-grade intelligence application combining a modern web frontend with a high-performance Python backend and local GPU neural runtime:

```
SupportIQ Repository Architecture
├── frontend/                     # React 19 + TypeScript + Vite 8.3 + TailwindCSS
│   ├── src/pages/                # Chat, ExperimentCenter, ModelEvaluation, KnowledgeBase, Analytics, etc.
│   ├── src/components/evaluation/# ResearchTablesView.tsx, ResearchFiguresView.tsx
│   └── src/lib/auth.ts           # JWT token storage and role-based session management
├── backend/                      # FastAPI + SQLAlchemy 2.0 + SQLite (supportiq.db)
│   ├── app/
│   │   ├── api/v1/routers/       # chat, evaluation, analytics, auth, documents, tickets
│   │   ├── core/                 # configuration (config.py), security (security.py)
│   │   ├── db/                   # SQLAlchemy ORM models, migrations, init_db.py
│   │   ├── retrieval/            # BM25 lexical, dense cosine, 2-stage RRF, grounding service
│   │   ├── services/             # model_runtime.py (PyTorch/PEFT), evaluation_runner.py, research_tables_service.py
│   │   └── training/             # LoRA/QLoRA hardware detectors, trainer configs, pipeline
│   ├── artifacts/adapters/       # Saved PEFT adapters (LoRA FP16 and QLoRA 4-bit NF4)
│   ├── data/training/            # Domain instruction datasets (supportiq_train.jsonl, supportiq_val.jsonl)
│   └── tests/                    # 32 pytest unit and integration test suites
```

- **Frontend Technology Stack:** React 19, TypeScript, Vite 8.3, TailwindCSS, Headless UI, Heroicons, Vitest for testing.
- **Backend Technology Stack:** Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0 ORM, Uvicorn ASGI server.
- **Persistence Engine:** SQLite (`backend/supportiq.db`) with foreign key enforcement and cascade deletes across documents, chunks, conversations, messages, citations, claims, and evaluation tables.
- **Neural Runtime Engine:** Local HuggingFace Transformers + PEFT + bitsandbytes on an NVIDIA GeForce RTX 2050 Laptop GPU (4.0 GB VRAM, CUDA 12.4).
- **Deployment Mode:** Single-host production serving where FastAPI mounts the precompiled React single-page application from `frontend/dist/` at `http://127.0.0.1:8000/`.

---

## 2. Current RAG Pipeline

The end-to-end RAG workflow is executed in [`backend/app/api/v1/routers/chat/routes.py:chat_message`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/backend/app/api/v1/routers/chat/routes.py#L59-L349) and mirrored in the evaluation suite [`backend/run_real_qlora_holdout_eval.py`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/backend/run_real_qlora_holdout_eval.py):

```
User Query
   │
   ▼
[Stage 1: Retrieval] ──────────────────────────┐
   ├── Lexical Search (BM25 token overlap)     │
   └── Dense Vector Search (Cosine similarity) │
   │                                           │
   ▼                                           │
[Stage 2: Re-Ranking (RRF)] ───────────────────┘
   └── Reciprocal Rank Fusion: Score = (0.60/(60+r_lex)) + (0.40/(60+r_vec))
   │
   ▼
[Stage 3: Evidence Gate]
   ├── Check candidate count > 0
   ├── Check top chunk composite similarity score >= 0.15
   └── Check substantive terms >= 2 OR lexical score >= 0.35 (domain stopwords removed)
   │
   ├──────────────────────────────┬──────────────────────────────┐
   │ (Evidence Criteria Met)      │ (No Substantive Evidence)   │
   ▼                              ▼                              ▼
[Stage 4: Generation]          [Safe Refusal]                 [Human Escalation]
   ├── QLoRA (4-bit NF4)          └── "No relevant info..."      └── Ticket Creation Option
   ├── LoRA (FP16)
   ├── Base Qwen 0.5B
   └── Extractive Fallback
   │
   ▼
[Stage 5: Verification & Grounding]
   ├── Claim segmentation (sentence splitting)
   ├── Lexical token overlap against retrieved chunks
   └── Reliability scoring: (0.7 * coverage) + (0.3 * normalized_support)
   │
   ▼
[Stage 6: Output & Persistence]
   ├── Persist Message (role="assistant") with metadata and 8 pipeline stage latencies
   ├── Persist Claims (status="verified" | "unverified")
   ├── Persist Evidence (linked chunk_id, document_id, score)
   └── Persist Citations (document_title, page, excerpt quote, match percent)
```

---

## 3. Current Retrieval Methods

Implemented in [`backend/app/retrieval/service.py:RetrievalService`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/backend/app/retrieval/service.py#L119-L412):

1. **Lexical Retrieval (BM25 Approximation):**
   - Implemented via `lexical_score(query_tokens, chunk_text)`.
   - Strips English stopwords (`STOPWORDS`) and domain boilerplate words (`DOMAIN_STOPWORDS`: "supportiq", "policy", "help", "support", "customer", etc.).
   - Computes substantive token intersection over distinct substantive query tokens.
2. **Dense Vector Retrieval:**
   - Implemented via `_hash_vector(tokens, vector_size=32)` and `cosine_similarity(left, right)`.
   - Chunks store embeddings in `DocumentChunk.metadata_json["embedding"]`.
   - Computes standard dot product divided by product of L2 vector norms.
3. **Linear Hybrid Retrieval (Ablation Mode):**
   - Directly combines normalized lexical and vector scores via:
     $$\text{Linear Hybrid Score} = (0.65 \times \text{Lexical Score}) + (0.35 \times \text{Vector Score})$$
   - Available via `retrieval_method="hybrid_no_rrf"` or `"linear"`.

---

## 4. Current RRF (Reciprocal Rank Fusion) Implementation

Implemented in [`backend/app/retrieval/service.py:rerank`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/backend/app/retrieval/service.py#L322-L368):
- Ranks candidate pool ($N \le 25$) along the lexical dimension ($r_{\text{lex}} \in [1, N]$).
- Ranks candidate pool along the vector dimension ($r_{\text{vec}} \in [1, N]$).
- Computes asymmetric weighted Reciprocal Rank Fusion score:
  $$\text{RRF Score} = \frac{0.60}{k + r_{\text{lex}}} + \frac{0.40}{k + r_{\text{vec}}}$$
  where smoothing constant $k = 60$.
- Sorts candidates by `(rrf_score, similarity_score)` descending, returning top-$K$ (default $K=5$).

---

## 5. Current Model Runtime

Implemented in [`backend/app/services/model_runtime.py:ModelRuntimeService`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/backend/app/services/model_runtime.py):
- Thread-safe, cached model execution engine (`_loaded_models` dictionary guarded by `threading.Lock()`).
- Base Architecture: `Qwen/Qwen2.5-0.5B-Instruct` (0.495B total parameters).
- Model Variants Supported:
  1. `qlora`: 4-bit NF4 quantized base model + PEFT QLoRA adapter.
  2. `lora`: FP16 base model + PEFT LoRA adapter.
  3. `base`: Pretrained `Qwen/Qwen2.5-0.5B-Instruct` in FP16 (Zero-shot RAG).
  4. `extractive`: Heuristic sentence extractor from retrieved chunks (`synthesize_support_answer`).
- Generation Execution: Prompt formatted with Qwen ChatML tags (`<|im_start|>system...<|im_start|>user...<|im_start|>assistant`). Greedy decoding (`do_sample=False`, `max_new_tokens=96`).
- Hardware Monitoring: Tracks GPU wall-clock generation duration via `time.perf_counter()` and peak GPU allocation via `torch.cuda.max_memory_allocated(0)`.

---

## 6. Current LoRA Implementation

- **Training Script:** [`backend/train_real_lora.py`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/backend/train_real_lora.py)
- **Saved Adapter Artifact:** [`backend/artifacts/adapters/supportiq_lora_qwen05b/`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/backend/artifacts/adapters/supportiq_lora_qwen05b)
- **Adapter Configuration (`adapter_config.json`):**
  - Base Model: `Qwen/Qwen2.5-0.5B-Instruct`
  - PEFT Type: `LORA`
  - Rank ($r$): 8
  - Alpha ($\alpha$): 16
  - Dropout: 0.05
  - Target Modules: `["q_proj", "v_proj"]`
  - Trainable Parameters: **540,672** out of 494,573,440 (**0.1093%**)
- **Training Progression (3 Epochs on RTX 2050):**
  - Epoch 1: Train Loss = 1.0531, Val Loss = 1.4741
  - Epoch 2: Train Loss = 0.8523, Val Loss = 1.4499
  - Epoch 3: Train Loss = 0.7438, Val Loss = 1.4008
  - Wall-clock Training Duration: **9.06 seconds**
  - Training Peak VRAM: **2.42 GB**

---

## 7. Current QLoRA Implementation

- **Training Script:** [`backend/train_real_qlora.py`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/backend/train_real_qlora.py)
- **Saved Adapter Artifact:** [`backend/artifacts/adapters/supportiq_qlora_qwen05b/`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/backend/artifacts/adapters/supportiq_qlora_qwen05b)
- **Quantization & Adapter Configuration:**
  - Base Model: `Qwen/Qwen2.5-0.5B-Instruct`
  - Quantization: `BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4", bnb_4bit_compute_dtype=torch.float16, bnb_4bit_use_double_quant=True)`
  - PEFT Type: `LORA` (4-bit NF4 weights frozen, FP16 adapters updated)
  - Rank ($r$): 8
  - Alpha ($\alpha$): 16
  - Target Modules: `["q_proj", "v_proj"]`
  - Trainable Parameters: **540,672** out of 494,573,440 (**0.1093%**)
- **Training Progression (3 Epochs on RTX 2050):**
  - Epoch 1: Train Loss = 0.9609, Val Loss = 1.4528
  - Epoch 2: Train Loss = 0.8309, Val Loss = 1.3950
  - Epoch 3: Train Loss = 0.7758, Val Loss = 1.3748
  - Wall-clock Training Duration: **21.60 seconds**
  - Training Peak VRAM: **1.79 GB**

---

## 8. Current Grounding & Verification Implementation

Implemented in [`backend/app/retrieval/service.py:analyze_answer_grounding`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/backend/app/retrieval/service.py#L166-L253):
1. **Claim Segmentation:** Answer text is split into distinct factual claims via sentence boundaries (`split_answer_claims`).
2. **Evidence Matching:** For each claim, substantive lexical token overlap is calculated against each retrieved chunk (`_claim_evidence_match`). A claim is classified as `supported = True` if the best matching chunk achieves score $\ge 0.12$.
3. **Coverage & Reliability Calculation:**
   $$\text{Coverage} = \frac{\text{Supported Claims}}{\text{Total Claims}}$$
   $$\text{Normalized Support} = \min\left(1.0, \frac{\text{Average Evidence Score}}{0.35}\right)$$
   $$\text{Reliability Score} = 0.70 \times \text{Coverage} + 0.30 \times \text{Normalized Support}$$
4. **Confidence Rating:** Classified as `high` ($\ge 0.80$), `medium` ($0.45 \le s < 0.80$), or `low` ($< 0.45$). If reliability is low, the chat status shifts to `low_confidence` and prompts human agent escalation.

---

## 9. Current Evidence & Citation Implementation

- When valid evidence passes the evidence threshold, chunks are cited in `assistant_metadata["citations"]`:
  - `document_id`: Integer foreign key.
  - `document_title`: Filename (e.g., `Return_Policy.pdf`).
  - `chunk_id` and `chunk_index`: Integer pointer.
  - `page`: Page number stored in chunk metadata (default 1).
  - `quote`: First 250 characters of verified chunk text.
  - `score`: Similarity score.
  - `match_percent`: $\text{round}(\text{score} \times 100)\%$.
- In SQLite, every chat response stores rows in the `claims`, `evidence`, and `citations` tables:
  - `Claim`: `conversation_id`, `message_id`, `claim_text`, `confidence`, `status` (`verified` | `unverified`).
  - `Evidence`: `claim_id`, `document_id`, `chunk_id`, `evidence_text`, `score`.
  - `Citation`: `message_id`, `document_id`, `chunk_id`, `page_number`, `quote_text`, `score`.

---

## 10. Current Datasets

The repository contains three distinct datasets:

### A. Evaluation Dataset 1: Golden Dev/Validation Benchmark v1
- **Database ID:** 1 (in SQLite table `evaluation_datasets`)
- **Total Cases:** Exactly **10 test cases** (IDs 1–10)
- **Composition:** 7 answerable, 3 unanswerable out-of-domain queries
- **Purpose:** Hyperparameter tuning, evidence threshold calibration (threshold = 0.18, semantic dampening = 0.25).
- **Knowledge Base Chunks Covered:** Chunks 1, 2, 5, 6, 8, 10, 14.

### B. Evaluation Dataset 2: Holdout Test Benchmark v1
- **Database ID:** 2 (in SQLite table `evaluation_datasets`)
- **Total Cases:** Exactly **10 test cases** (IDs 11–20)
- **Composition:** 7 answerable, 3 unanswerable out-of-domain queries
- **Purpose:** Primary frozen benchmark for unbiased comparative evaluation and component ablation.
- **Knowledge Base Chunks Covered:** Chunks 3, 4, 7, 9, 11, 12, 13.
- **Case Manifest:**
  - Case 11: Refund processing timeline (Policy) &rarr; Target: Chunk 3
  - Case 12: Admin credentials & MFA (Security & Access) &rarr; Target: Chunk 4
  - Case 13: Hardware warranty RMA (Warranty) &rarr; Target: Chunk 7
  - Case 14: Ticketing platform REST API integration (Integration) &rarr; Target: Chunk 9
  - Case 15: Monthly subscription invoice portal (Billing) &rarr; Target: Chunk 11
  - Case 16: AES-256 and TLS 1.3 encryption (Security) &rarr; Target: Chunk 12
  - Case 17: Knowledge manager document curation (Account & Roles) &rarr; Target: Chunk 13
  - Case 18: Holographic telepathic customer support (Adversarial Unsupported) &rarr; Target: Safe Refusal
  - Case 19: Martian mineral mining credit billing (Adversarial Unsupported) &rarr; Target: Safe Refusal
  - Case 20: Warp drive containment breach warranty (Adversarial Unsupported) &rarr; Target: Safe Refusal

### C. Training Dataset: SupportIQ-Domain-Instruction-Tuning-v1
- **Files:** [`backend/data/training/supportiq_train.jsonl`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/backend/data/training/supportiq_train.jsonl), [`supportiq_val.jsonl`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/backend/data/training/supportiq_val.jsonl)
- **Manifest:** [`backend/data/training/dataset_manifest.json`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/backend/data/training/dataset_manifest.json)
- **Total Examples:** 41 Q&A pairs (31 Train, 10 Validation)
- **Format:** Instruction + Support Context + User Question &rarr; Verified Support Answer.

---

## 11. Current Evaluation Scripts

1. [`backend/run_real_qlora_holdout_eval.py`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/backend/run_real_qlora_holdout_eval.py): Live GPU evaluation of 4-bit NF4 QLoRA against Base FP16 and LoRA FP16 on Dataset 2. Saves `backend/real_qlora_holdout_summary.json`.
2. [`backend/run_real_lora_holdout_eval.py`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/backend/run_real_lora_holdout_eval.py): Live GPU evaluation of LoRA FP16 against Base FP16 on Dataset 2. Saves `backend/real_lora_holdout_summary.json`.
3. [`backend/run_final_frozen_holdout.py`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/backend/run_final_frozen_holdout.py): Offline pipeline holdout benchmark across 6 model configurations on Dataset 2. Saves `backend/final_frozen_holdout_summary.json`.
4. [`backend/run_ablation_study.py`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/backend/run_ablation_study.py): Component ablation isolating BM25 only, Dense only, Hybrid without RRF, Naive RRF, and Full Pipeline on Dataset 2. Saves `backend/ablation_study_summary.json`.
5. [`backend/generate_research_tables.py`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/backend/generate_research_tables.py): Formats evaluation results into GitHub-flavored markdown tables in `backend/RESEARCH_TABLES.md`.

---

## 12. Current Experiments

The SQLite database (`backend/supportiq.db`) contains 6 experiment definitions:

| Exp ID | Name | Description | Status | Active Runs |
|---|---|---|---|---|
| **1** | `RAG + QLoRA (Customer Support v1)` | Theoretical 7B baseline comparison | `LEGACY_REFERENCE` | Runs 35, 36 |
| **2** | `SupportIQ Holdout Test Benchmark` | Preliminary holdout benchmark testing | `COMPLETED` | Runs 43, 44 |
| **3** | `SupportIQ Frozen Final Holdout Benchmark` | Offline pipeline holdout benchmark (6 configurations) | `COMPLETED` | Runs 37–42 |
| **4** | `SupportIQ Retrieval & Verification Ablation Study` | 6-mode component ablation study | `COMPLETED` | Runs 45–50 |
| **7** | `SupportIQ Real LoRA Empirical Holdout Evaluation` | Live GPU comparison: Base vs LoRA on Dataset 2 | `COMPLETED` | Runs 53, 54 |
| **12** | `SupportIQ Real QLoRA Empirical Holdout Evaluation` | Live GPU comparison: Base vs LoRA vs QLoRA on Dataset 2 | `COMPLETED` | Runs 53, 54, 59 |

---

## 13. Current Adapters

| Adapter Directory | Architecture | Quantization | Rank ($r$) | Alpha ($\alpha$) | Target Modules | Trainable Parameters | Peak VRAM |
|---|---|---|---|---|---|---|---|
| `backend/artifacts/adapters/supportiq_lora_qwen05b` | LoRA | FP16 Unquantized | 8 | 16 | `q_proj`, `v_proj` | 540,672 (0.1093%) | 0.96 GB (Inf), 2.42 GB (Train) |
| `backend/artifacts/adapters/supportiq_qlora_qwen05b` | QLoRA | 4-bit NF4 + Double Quant | 8 | 16 | `q_proj`, `v_proj` | 540,672 (0.1093%) | 0.46 GB (Inf), 1.79 GB (Train) |

Both adapters include `adapter_config.json`, `adapter_model.safetensors`, tokenizer configurations, and `training_metrics.json`.

---

## 14. Current Result Files

1. [`backend/real_qlora_holdout_summary.json`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/backend/real_qlora_holdout_summary.json): Complete GPU inference results for Base FP16, LoRA FP16, and QLoRA 4-bit NF4 on Dataset 2.
2. [`backend/real_lora_holdout_summary.json`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/backend/real_lora_holdout_summary.json): Comparative GPU inference results for Base FP16 and LoRA FP16 on Dataset 2.
3. [`backend/final_frozen_holdout_summary.json`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/backend/final_frozen_holdout_summary.json): Extractive pipeline comparison across 6 configurations on Dataset 2.
4. [`backend/ablation_study_summary.json`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/backend/ablation_study_summary.json): 6-mode component ablation study on Dataset 2.
5. [`backend/RESEARCH_TABLES.md`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/backend/RESEARCH_TABLES.md): Full markdown research tables.

---

## 15. Current Database Research Records

In `backend/supportiq.db`:
- **`evaluation_datasets`:** 2 records (ID 1: Dev/Validation, ID 2: Frozen Holdout).
- **`evaluation_test_cases`:** 20 records (10 in Dataset 1, 10 in Dataset 2).
- **`experiments`:** 6 records (IDs 1, 2, 3, 4, 7, 12).
- **`experiment_runs`:** 53 total runs (persisting configuration JSON, metrics JSON, timestamps).
- **`evaluation_results`:** 530+ metric rows recorded across runs (accuracy, faithfulness, recall@5, mrr, citation correctness, hallucination rate, latency, VRAM).

---

## 16. Current Hardware & Software Environment

- **Operating System:** Microsoft Windows 11 Home Single Language (Build 26100)
- **CPU:** 12th Gen Intel Core i5-12450H (8 cores, 12 threads)
- **System RAM:** 16.0 GB
- **GPU:** NVIDIA GeForce RTX 2050 Laptop GPU (4.0 GB GDDR6 VRAM)
- **CUDA Runtime:** CUDA 12.4
- **Python Environment:** Python 3.12.10 (within `backend/.venv`)
- **Key Packages:**
  - `torch`: 2.5.1+cu124
  - `transformers`: 4.46.2
  - `peft`: 0.13.2
  - `bitsandbytes`: 0.44.1
  - `accelerate`: 1.1.1
  - `fastapi`: 0.115.4
  - `sqlalchemy`: 2.0.36
  - `pydantic`: 2.9.2

---

## 17. Existing Tests

All existing tests pass with 100% pass rate:
- **Backend Test Suite:** 32 tests passing (`pytest backend/tests/`).
  - `test_model_runtime.py`: 6 tests passing (Base, LoRA, QLoRA loading, inference, memory cleanup).
  - `test_retrieval.py`: 5 tests passing (Lexical, Vector, Hybrid RRF, candidate gathering).
  - `test_chat_grounding.py`: 3 tests passing (Claim segmentation, evidence matching, reliability).
  - `test_evaluation_runner.py`: 2 tests passing (Benchmark runner execution, metrics computation).
  - `test_training_pipeline.py`: 3 tests passing (Hardware detector, LoRA config, QLoRA config).
  - `test_auth.py`, `test_database.py`, `test_documents_download.py`, `test_health.py`, `test_support_tickets.py`: 13 tests passing.
- **Frontend Test Suite:** 18 tests passing (`vitest --run`).
  - `ResearchEvaluation.test.tsx`: 6 tests passing (Rendering research tables, tabs, disclosures).
  - `App.test.tsx`: 8 tests passing (Navigation, routing, login flow).
  - `ChatLiveVerification.test.tsx`: 4 tests passing (Inline evidence, citations, claims badges).

---

## 18. Existing Research Limitations

1. **Small Benchmark Sample Size:** Dataset 1 and Dataset 2 each contain 10 test cases (7 answerable, 3 unanswerable). While dense in per-case diagnostic fidelity, statistical power is constrained.
2. **Ceiling Effects in Small Benchmarks:** On Dataset 2, both LoRA (Run 54) and QLoRA (Run 59) achieve 100.0% accuracy (10/10) and 100.0% faithfulness (7/7). Differentiating nuance between LoRA and QLoRA on generation quality requires more complex multi-turn or cross-document reasoning cases.
3. **Discrete Metric Resolution:** In a 10-case evaluation, a single incorrect response causes a 10.0% swing in accuracy, and a single hallucination causes a 33.3% swing in hallucination rate ($N_{\text{unsupp}} = 3$).
4. **Latency Measurement Boundary:** CPU retrieval latency (4.9ms – 16.8ms) and GPU autoregressive token generation latency (0.844s – 2.061s) operate on vastly different orders of magnitude and must never be combined without explicit decomposition.

---

## 19. Missing Research Components

1. **Standardized Raw Machine-Readable Result Hierarchy:** The current project stores JSON summaries in the root `backend/` directory (`real_qlora_holdout_summary.json`, etc.) rather than a dedicated, versioned `research/results/{base,lora,qlora,retrieval,verification,ablation}/` tree.
2. **Programmatic Figure Generation Script:** Figures currently render via React Canvas/SVG in `ResearchFiguresView.tsx`, but lack a headless Python script (e.g., matplotlib/seaborn) to export publication-quality vector PDF/PNG figures directly from raw experimental data.
3. **Formal Experiment Protocol Document:** The experimental methodology needs to be codified in `research/EXPERIMENT_PROTOCOL.md`.
4. **Comprehensive Literature Review:** The literature synthesis and citation bibliography (`research/LITERATURE_REVIEW.md` and `research/REFERENCES.md`) need to be drafted against peer-reviewed RAG and PEFT literature.

---

## 20. Research Risks

1. **Conflating Offline Heuristics with Neural Inference:** Experiments 3 and 4 ran via deterministic extractive synthesis on CPU, while Experiments 7 and 12 ran via neural autoregression on GPU. Conflating these two distinct runtime paradigms in research tables would compromise scientific validity.
2. **GPU Thermal & Background Variability:** On laptop hardware (RTX 2050), generation latency can exhibit minor thermal throttling jitter ($\pm 50\text{ms}$). Experiments must report averages over identical warm-up conditions.

---

## 21. Data Leakage Risks

- **Document Chunk Overlap Audit:** In [`backend/build_lora_dataset.py`](file:///c:/Users/janardhan-thrishank-Singumahanthi/OneDrive/Desktop/Support%20iq/backend/build_lora_dataset.py), training questions were generated from knowledge chunks. An automated Jaccard distance filter strictly ensured zero identical or near-identical questions ($J > 0.60$) between training pairs and holdout cases.
- **Potential Risk Identified:** Some underlying chunks (e.g., Chunk 9: API integration, Chunk 12: Data security) appear in both the training data and Holdout Dataset 2, even though the questions and phrasing are completely distinct. In a strict academic evaluation, a true "unseen document split" (holding out entire documents, not just distinct questions and chunks) provides an even stronger safeguard against memorization.

---

## 22. Metric Integrity Risks

- **Prior Unsubstantiated Numbers:** Past conversational summaries erroneously cited numbers (`89.4%`, `94.2%`, `88.1%`, `92.8%`, `91.0%`, `95.0%`, `50 test cases`) that had no empirical source records.
- **Audit Safeguard:** All values have been strictly purged from documentation and replaced with verified empirical database values (100.0% accuracy, 100.0% faithfulness on real GPU runs, 10 test cases, 0.844s LoRA latency, 1.668s QLoRA latency, 0.96 GB LoRA VRAM, 0.46 GB QLoRA VRAM) or marked `NOT MEASURED / REFERENCE ONLY`.

---

## 23. Recommended Next Experiments

1. **Standardize Result Hierarchy:** Populate `research/results/` with machine-readable per-case logs from the verified runs.
2. **Execute Head-to-Head Latency Benchmark:** Run multiple generation passes ($N=5$) on Dataset 2 to measure statistical standard deviation for Base vs LoRA vs QLoRA inference latencies.
3. **Programmatic Publication Figures:** Build `research/scripts/generate_figures.py` to render publication-ready vector charts directly from the JSON result files.
4. **Draft Formal Research Questions:** Formulate hypothesis-driven research questions (RQs 1–6) mapped directly to existing and planned experimental evidence.
