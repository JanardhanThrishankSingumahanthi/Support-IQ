# SupportIQ — RunPod Cloud GPU Deployment Final Report

**Date:** October 2, 2026  
**Auditor / Engineer:** SupportIQ Infrastructure & QA Lead  
**Branch:** `feature/cloud-gpu-inference`  

---

## 1. Provider
- **Provider:** RunPod (Community Cloud / Secure Cloud GPU Pods)
- **Deployment Model:** Containerized GPU Pod exposing public HTTPS proxy on port 8001.

---

## 2. Pod / Instance Configuration
- **Base Docker Image:** `nvidia/cuda:12.4.1-runtime-ubuntu22.04` (or RunPod official PyTorch template: `runpod/pytorch:2.4.0-py3.11-cuda12.4.1-devel-ubuntu22.04`)
- **Port Mapping:** Port `8001` exposed via RunPod HTTP/HTTPS Proxy.
- **Environment Variables Required on RunPod:**
  - `SUPPORTIQ_INFERENCE_API_KEY`: Strong secret key for mutual authentication.
  - `PORT`: `8001`

---

## 3. GPU Selection & Suitability
- **Recommended Hardware:**
  - NVIDIA RTX 3070 (8 GB VRAM) — ~$0.13/hr
  - NVIDIA RTX A4000 (16 GB VRAM) — ~$0.17/hr
  - NVIDIA RTX 3080 (10 GB VRAM) — ~$0.17/hr
  - NVIDIA RTX 3090 (24 GB VRAM) — ~$0.22/hr
- *Note:* Qwen2.5-0.5B requires only 0.93 GB (LoRA) and 1.37 GB (QLoRA) peak VRAM, meaning any 8GB+ GPU will operate with ample headroom.

---

## 4. VRAM
- **Required Model VRAM:** ~1.5 GB total for 4-bit NF4 QLoRA + base weights + KV-cache workspace.
- **Physical GPU VRAM on Target Pods:** 8 GB to 24 GB.

---

## 5. CUDA Version
- **CUDA Runtime:** 12.4
- **PyTorch CUDA Build:** `cu124`

---

## 6. PyTorch Version
- `2.6.0+cu124` (or PyTorch `2.4.0+` with CUDA 12.4 support)

---

## 7. Transformers Version
- `5.17.0` (compatible with `Qwen/Qwen2.5-0.5B-Instruct` architecture)

---

## 8. PEFT Version
- `0.21.0` (compatible with `supportiq_lora_qwen05b` and `supportiq_qlora_qwen05b`)

---

## 9. bitsandbytes Version
- `0.50.2` (Verified operational for 4-bit NF4 quantization on CUDA 12.4)

---

## 10. LoRA Status & Result
- **Status:** Code ready and verified on NVIDIA CUDA hardware.
- **Adapter Configuration:** $r=8$, $\alpha=16$, dropout $=0.05$, targets `q_proj`, `v_proj`.
- **Cloud RunPod Status:** Awaiting user manual Pod creation and URL configuration.

---

## 11. QLoRA Status & Result
- **Status:** Code ready and verified with 4-bit NF4 and double quantization on NVIDIA CUDA hardware.
- **Cloud RunPod Status:** Awaiting user manual Pod creation and URL configuration.

---

## 12. Actual Latency
- **Host GPU Measurement (RTX 2050 baseline):**
  - LoRA: **1,508.5 ms** (1.51 s)
  - QLoRA: **1,556.9 ms** (1.56 s)
- **Live RunPod Cloud Measurement:** NOT VERIFIED (Pending active RunPod Pod deployment).

---

## 13. Actual VRAM
- **Host GPU Measurement (RTX 2050 baseline):**
  - LoRA Peak VRAM: **0.93 GB**
  - QLoRA Peak VRAM: **1.37 GB**
- **Live RunPod Cloud Measurement:** NOT VERIFIED (Pending active RunPod Pod deployment).

---

## 14. HTTPS Endpoint Status
- **Status:** **NOT VERIFIED**
- **Details:** Requires manual RunPod Pod creation. Once running, the endpoint will be structured as:
  `https://<pod-id>-8001.proxy.runpod.net`

---

## 15. Render Connection
- Fully implemented in `backend/app/services/model_runtime.py` and documented in `render.yaml`.
- Features dynamic health probing (`GET /models` and `GET /health`).
- Strictly enforces `ModelUnavailableError` if the RunPod service is offline or unreachable—**no silent fallback** to CPU or simulated answers.

---

## 16. RAG E2E Architecture
- RAG lifecycle is preserved entirely on Render:
  1. User authenticates.
  2. Document access control validates ownership.
  3. Hybrid retrieval (BM25 + Dense) retrieves candidate passages.
  4. RRF re-ranking selects top evidence.
  5. Intent verification validates relevance.
  6. Verified context is forwarded to RunPod via `POST /generate`.
  7. RunPod executes LoRA/QLoRA inference on CUDA.
  8. Render performs grounding check and claim verification.
  9. Citations are attached with direct page links.
  10. Unsupported questions receive safe refusals without invoking RunPod.

---

## 17. Security
- Mutual API key authentication using `SUPPORTIQ_INFERENCE_API_KEY` via `X-API-Key` or `Authorization: Bearer`.
- Secrets are confined to Render backend environment variables; never exposed to React or frontend code.
- Tenant isolation: User document authorization occurs strictly on Render prior to context dispatch.

---

## 18. Persistence
- Preserved on Render via `SUPPORTIQ_DATA_DIR=/data` persistent disk (`/data/supportiq.db` and `/data/uploads/`).
- RunPod is strictly stateless and retains zero user documents or SQLite databases.

---

## 19. Tests
- **Backend Pytest:** 67 / 67 Passed (100%)
- **Frontend Vitest:** 32 / 32 Passed (100%)
- **Frontend Production Build:** Passed (0 errors, 439ms)
- **Dedicated Cloud GPU Tests:** 5 / 5 Passed (100%)

---

## 20. Cost Considerations
- **Hourly Rate:** ~$0.13 – $0.22 / hour on RunPod Community Cloud (e.g., RTX 3070 or RTX 3080).
- **Billing Model:** Per-second billing.
- **Estimated Verification Cost:** Less than **$0.05** for a 15-minute demonstration session.
- **Pod Lifecycle Management:**
  - **Stopping Pod:** In RunPod Web Console, click the "Stop" button on the Pod. Compute charges cease immediately; only minimal volume disk storage (~$0.07/GB/month) is billed.
  - **Terminating Pod:** Click "Terminate" / "Delete" to destroy the Pod and avoid all recurring charges.

---

## 21. Remaining Limitations
1. **Manual User Provisioning:** In compliance with project safety rules, the agent cannot automatically create RunPod accounts or bill user credit cards. The user must manually launch the Pod.
2. **Proxy Cold-Start / Sleep:** If a RunPod Pod is stopped or network proxy pauses, initial request latency may see a 5–10s reconnect window.
3. **Stateless Request Window:** RunPod does not persist multi-turn KV-cache; Render sends the verified context with each turn.
