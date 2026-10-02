# SupportIQ — Cloud GPU Deployment Audit Report

**Date:** October 2, 2026  
**Repository Branch:** `feature/cloud-gpu-inference`  
**Auditor:** SupportIQ Lead QA & Infrastructure Engineering  

---

## 1. Architecture

SupportIQ employs a decoupled cloud architecture designed to retain Render as the primary application host while delegating heavy neural generation to a dedicated GPU inference microservice:

```
                                 [ USER CLIENT / BROWSER ]
                                             |
                                             v
                      +---------------------------------------------+
                      |         RENDER WEB SERVICE (Single-Host)     |
                      |                                             |
                      |  1. React 19 Frontend (SPA)                 |
                      |  2. FastAPI Backend API                     |
                      |  3. Auth & User Isolation (JWT/Sessions)    |
                      |  4. Document Upload & Storage (/data)       |
                      |  5. Hybrid Retrieval (Lexical + Dense)      |
                      |  6. Reciprocal Rank Fusion (RRF)            |
                      |  7. Intent Verification & Evidence Filter   |
                      |  8. Grounding Verification                  |
                      |  9. Claim Verification & Citation Mapping   |
                      | 10. SQLite Persistence (/data/supportiq.db) |
                      +---------------------------------------------+
                                             |
                         Internal HTTPS + API Key Auth
                                             |
                                             v
                      +---------------------------------------------+
                      |          CLOUD GPU INFERENCE SERVICE        |
                      |           (Docker on NVIDIA GPU)            |
                      |                                             |
                      |  - FastAPI Microservice (`gpu-inference/`)  |
                      |  - Base: Qwen/Qwen2.5-0.5B-Instruct         |
                      |  - Adapters: LoRA (FP16) & QLoRA (4-bit NF4)|
                      |  - PyTorch CUDA + bitsandbytes              |
                      |  - Telemetry: Latency, VRAM, Device Stats   |
                      +---------------------------------------------+
```

### Architectural Separation of Concerns:
- **Render Web Service:** Retains full ownership of authentication, authorization, document access control, indexing, hybrid retrieval, post-generation grounding, claim verification, citations, and persistence.
- **GPU Inference Service:** Stateless microservice dedicated strictly to model weight hosting and neural token generation on CUDA hardware. The GPU service never independently retrieves data and only operates on verified context passed by the Render backend.

---

## 2. GPU Provider

- **Supported Cloud Target Platforms:**
  - **RunPod:** Dedicated GPU Pods or Serverless Endpoint (NVIDIA RTX 4000 Ada, A4000, or T4).
  - **Google Cloud Platform (GCP):** Cloud Run with GPU or GKE Autopilot with NVIDIA L4 / T4 accelerators.
  - **AWS:** EC2 `g4dn.xlarge` (NVIDIA T4) or `g5.xlarge` (NVIDIA A10G) behind an Application Load Balancer.
  - **Modal Labs / Lambda Labs:** Containerized serverless function deployment.
- **Local Verification Target:** Physical host equipped with NVIDIA GeForce RTX 2050 Laptop GPU (Ampere architecture, Compute Capability 8.6).

---

## 3. GPU Model

- **Hardware Validated:** NVIDIA GeForce RTX 2050
- **Total Physical VRAM:** 4,096 MiB (4.00 GB)
- **Compute Capability:** 8.6
- **Driver Version:** 592.00

---

## 4. CUDA Version

- **CUDA Runtime:** 12.4
- **PyTorch CUDA Build:** `cu124`
- **Host Driver CUDA Support:** Up to CUDA 13.1

---

## 5. PyTorch Version

- **PyTorch:** `2.6.0+cu124`

---

## 6. Transformers Version

- **Hugging Face Transformers:** `5.17.0`

---

## 7. PEFT Version

- **PEFT (Parameter-Efficient Fine-Tuning):** `0.21.0`

---

## 8. bitsandbytes Version

- **bitsandbytes:** `0.50.2` (Verified operational for 4-bit NF4 quantization on CUDA 12.4)

---

## 9. LoRA Status

- **Status:** **WORKING**
- **Adapter Path:** `backend/artifacts/adapters/supportiq_lora_qwen05b/`
- **Configuration:** Base `Qwen/Qwen2.5-0.5B-Instruct` loaded in FP16 precision with PEFT LoRA adapter ($r=8$, $\alpha=16$, dropout $=0.05$, target modules `q_proj`, `v_proj`).
- **Generation:** Successfully loaded onto `cuda:0`, generated coherent domain-grounded response text.

---

## 10. QLoRA Status

- **Status:** **WORKING**
- **Adapter Path:** `backend/artifacts/adapters/supportiq_qlora_qwen05b/`
- **Configuration:** Base `Qwen/Qwen2.5-0.5B-Instruct` loaded with bitsandbytes 4-bit NF4 quantization (`bnb_4bit_quant_type="nf4"`, `bnb_4bit_use_double_quant=True`, `bnb_4bit_compute_dtype=torch.float16`) with PEFT QLoRA adapter ($r=8$, $\alpha=16$, target modules `q_proj`, `v_proj`).
- **Generation:** Successfully loaded onto `cuda:0`, verified 4-bit quantization and generated coherent domain-grounded response text.

---

## 11. Actual Latency

- **LoRA Latency:** **1,508.5 ms** (1.51 s)
- **QLoRA Latency:** **1,556.9 ms** (1.56 s)
- *Measured using `torch.cuda.Event` elapsed time across token generation with verified context.*

---

## 12. Actual VRAM

- **LoRA Peak VRAM:** **0.93 GB** (952 MiB)
- **QLoRA Peak VRAM:** **1.37 GB** (1,403 MiB)
- *Measured using `torch.cuda.max_memory_allocated(0)` following cache reset.*

---

## 13. RAG E2E Status

- **Status:** **PASS**
- **End-to-End Flow:**
  1. User authenticates via JWT session.
  2. Document access control validates permissions.
  3. Hybrid retrieval executes lexical BM25 + dense token search.
  4. Reciprocal Rank Fusion (RRF) re-ranks candidate passages.
  5. Intent verification determines if evidence exists for query.
  6. If supported, retrieved passages and query are dispatched to Cloud GPU Inference service (`POST /generate`).
  7. GPU service generates response text.
  8. Render application applies grounding verification against retrieved passages.
  9. Claim verification confirms factual alignment.
  10. Citations are linked directly to underlying source document pages.
  11. If unsupported, safe refusal is returned with 0 citations and no GPU call.

---

## 14. Persistence Status

- **Status:** **PASS**
- **Application Persistence:** Preserved under `SUPPORTIQ_DATA_DIR=/data` on Render persistent disk:
  - Database: `/data/supportiq.db` (Users, documents, chunks, chat sessions, claims).
  - Uploads: `/data/uploads/` (Original source PDF and text files).
- **GPU Service Statelessness:** The GPU inference service maintains no persistent database or user document storage, avoiding cross-user leaks or state synchronization issues.

---

## 15. Security Status

- **Status:** **PASS**
- **Authentication:** Communication from Render to the GPU service requires a shared secret API key (`SUPPORTIQ_INFERENCE_API_KEY`) passed via the `X-API-Key` or `Authorization: Bearer` header.
- **Secret Isolation:** The inference API key and URL are stored strictly as backend environment variables on Render. They are never exposed to the React frontend, client bundle, or public network.
- **Tenant Isolation:** Document authorization checks are executed entirely on Render before generating context. The GPU service only ever receives context belonging to documents the authenticated user is permitted to view.
- **No Private Data in Logs:** Sensitive query contents and API keys are redacted from server access logs.

---

## 16. Test Results

| Test Suite | Result | Details |
|---|---|---|
| **Backend Pytest** | **67 / 67 Passed (100%)** | Full unit, integration, and E2E test suite (`backend/tests/`) in 30.70s |
| **Cloud GPU Integration Tests** | **5 / 5 Passed (100%)** | Validated health, auth, client routing, error handling, and E2E RAG (`backend/tests/test_cloud_gpu_inference.py`) |
| **Frontend Vitest** | **32 / 32 Passed (100%)** | All UI component and auth tests passing in 3.74s |
| **Frontend Production Build** | **PASS (0 Errors)** | `tsc -b && vite build` compiled bundle in 478ms |
| **Silent Fallback Check** | **PASS** | When GPU service is stopped/offline, strictly raises `ModelUnavailableError`; zero silent degradation to CPU or extractive mode |

---

## 17. Render Integration

- **Configuration:** Updated `render.yaml` with:
  - `SUPPORTIQ_INFERENCE_URL`: Endpoint of the deployed GPU microservice.
  - `SUPPORTIQ_INFERENCE_API_KEY`: Secret key for mutual authentication.
- **Health Check Integration:** Render `/health` and `/api/v1/health` dynamically probe the GPU microservice:
  - If GPU service is reachable: reports `gpu_inference: "connected"`, with live status for QLoRA and LoRA.
  - If GPU service is unreachable: reports `gpu_inference: "disconnected"`, while maintaining application health (`status: "healthy"`) for non-neural features.

---

## 18. Remaining Limitations

1. **Inter-Service Network Latency:** Calls between Render (e.g., Oregon or Frankfurt) and external GPU providers introduce 50–150 ms network round-trip overhead. Colocation in the same cloud region minimizes this latency.
2. **Cold-Start Latency on Serverless GPUs:** If deploying to serverless GPU backends (such as RunPod Serverless or Modal) with scale-to-zero enabled, initial container spin-up and model weight loading require 15–30 seconds. A minimum replica count of 1 is recommended for production.
3. **Stateless Request Context:** The GPU service operates statelessly without persistent KV-cache caching across multi-turn user turns; the Render backend forwards the relevant verified context window with each turn.
