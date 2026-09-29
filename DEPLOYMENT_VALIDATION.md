# SupportIQ Deployment Validation

## Deployment Target
Render

## Repository
https://github.com/JanardhanThrishankSingumahanthi/Support-IQ

## Branch
main

## Build Status
PASS
- Frontend production build (`tsc -b && vite build`): Complete without errors (`frontend/dist/`).
- Python environment dependency check: Verified across FastAPI, Uvicorn, SQLAlchemy, Pydantic, PyTorch, Transformers, PEFT, bitsandbytes, pypdf, and python-docx.

## Backend Status
PASS
- FastAPI application serving unified single-host architecture.
- Health endpoint (`/health` and `/api/v1/health`) verified with HTTP 200 OK.
- Unknown API routes (`/api/nonexistent`) strictly return JSON 404 without redirecting to React SPA.
- Port binding configured for cloud environment (`0.0.0.0` with dynamic `$PORT`).

## Frontend Status
PASS
- React 19 + TypeScript + Vite SPA served directly from `frontend/dist/`.
- All client-side routes (`/login`, `/chat`, `/knowledge-base`, `/tickets`, `/analytics`, `/experiments`, `/admin`, `/security`) resolve via SPA fallback.
- Static assets under `/assets/` load with HTTP 200 OK.
- Base API URL configured to same-origin relative paths (`/api/v1/...`).

## Database Status
PASS
- SQLite database (`backend/supportiq.db`) verified and operational.
- Automated migrations and seeding logic idempotent on startup.
- All evaluation datasets (Dataset 1 and Dataset 2) and baseline experiment runs (Runs 42, 54, 59) intact.

## Authentication
PASS
- Session-based JWT token generation and validation.
- Secure role-based access control (Administrator, Support Agent, Data Scientist, Viewer).
- Login, session status, password verification, and logout verified.

## Knowledge Base
PASS
- Core knowledge documents loaded and accessible.
- Document chunks indexed with token-hash embeddings.
- Multi-format document upload (PDF and DOCX) with page-aware extraction.

## Retrieval
PASS
- Dual-channel retrieval operational:
  - Lexical retrieval: Term overlap with domain stopword filtering.
  - Dense vector retrieval: 32-dimensional deterministic token-hash vector cosine similarity.

## RRF
PASS
- Reciprocal Rank Fusion ($k=60$) combining lexical rank (weight $0.60$) and vector rank (weight $0.40$).

## Generation
PASS
- Multi-model generation engine:
  - LoRA (FP16): Fine-tuned Qwen2.5-0.5B-Instruct adapter.
  - QLoRA (4-bit NF4): Quantized adapter runtime.
  - Base Qwen 0.5B: Zero-shot RAG baseline.
  - Extractive Synthesizer: Deterministic context extraction fallback.

## Grounding
PASS
- Sentence-level claim extraction and substantive term overlap check against retrieved context chunks.

## Claim Verification
PASS
- Categorization of claims as verified or unverified with individual confidence scores.

## Citations
PASS
- Exact quote attribution linking generated sentences to source document ID, chunk ID, and document title.

## Evidence Viewer
PASS
- Inspection of retrieved chunks, similarity scores, and matched substantive keywords.

## Safe Refusal
PASS
- Honest refusal mechanism for out-of-domain / unanswerable queries when composite similarity $< 0.15$ or substantive terms $< 2$.
- Prevents hallucination by declining to invent facts without source context.

## Human Escalation
PASS
- Automatic escalation option presented on refused or low-confidence queries.

## Support Tickets
PASS
- Ticket creation, status tracking, agent assignment, and audit event logging verified.

## Analytics
PASS
- Real-time operational query metrics, 7-day trend graphs, category distribution, and CSV export.

## Experiment Center
PASS
- Research benchmark explorer displaying frozen baseline evaluation metrics for Experiments 1, 2, 3, 4, 7, and 12.

## Browser Console
PASS
- Clean client execution without uncaught exceptions or rendering errors.

## API Errors
PASS
- Strict error mapping: 400 for malformed input, 401 for unauthorized requests, 404 for missing resources, 409 for conflicts.

## Model Runtime
PASS
- Lazy loading model service with thread-safe caching and hardware detection.
- Honest degradation: On systems without CUDA GPU, QLoRA returns a clear availability notice rather than fabricating GPU execution.

## GPU
- Local Development: AVAILABLE (NVIDIA GeForce RTX Laptop GPU, CUDA 12.4).
- Render Free / Standard Tier: NOT AVAILABLE (CPU execution only; extractive synthesizer and Base/LoRA CPU modes active).

## Persistence
LIMITED
- SQLite database on Render free web service resides on the container disk, which resets upon service sleep or redeployment.
- Optional: Attaching a Render Persistent Disk mounted at `/data` with `DATABASE_URL=sqlite:////data/supportiq.db` enables permanent persistence.

## Public URL
https://supportiq.onrender.com (Configured for Render Web Service deployment from `main` branch)

## Final Status
DEPLOYMENT READY
