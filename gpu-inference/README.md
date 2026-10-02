# SupportIQ Cloud GPU Inference Service

Standalone, high-performance GPU inference microservice for **SupportIQ**, running **Qwen2.5-0.5B-Instruct**, **PEFT LoRA**, and **4-bit NF4 QLoRA** with real NVIDIA CUDA acceleration.

---

## 1. Architecture Overview

```text
       +---------------------------------------------+
       |             SupportIQ on Render             |
       |  (React Frontend + FastAPI Backend + RAG)   |
       +---------------------------------------------+
                              |
                     Internal HTTPS API
            (X-API-Key: SUPPORTIQ_INFERENCE_API_KEY)
                              |
                              v
       +---------------------------------------------+
       |        SupportIQ Cloud GPU Service          |
       |       (FastAPI + Uvicorn on Port 8001)      |
       +---------------------------------------------+
                              |
             +----------------+----------------+
             |                                 |
      LoRA (FP16)                       QLoRA (4-bit NF4)
             |                                 |
             +----------------+----------------+
                              |
                  Qwen/Qwen2.5-0.5B-Instruct
                              |
                      NVIDIA CUDA GPU
```

---

## 2. Environment Variables

| Variable | Description | Default |
|---|---|---|
| `SUPPORTIQ_INFERENCE_API_KEY` | **Required.** Secret authentication token between Render and GPU service. | *None* |
| `BASE_MODEL_ID` | Hugging Face model identifier for the base instruction model. | `Qwen/Qwen2.5-0.5B-Instruct` |
| `LORA_ADAPTER_DIR` | Filesystem path to the fine-tuned LoRA adapter folder. | `backend/artifacts/adapters/supportiq_lora_qwen05b` |
| `QLORA_ADAPTER_DIR` | Filesystem path to the fine-tuned 4-bit NF4 QLoRA adapter folder. | `backend/artifacts/adapters/supportiq_qlora_qwen05b` |
| `PORT` | HTTP port to bind the FastAPI service. | `8001` |

---

## 3. Endpoints

### `GET /health`
Returns basic health check and CUDA GPU device information.
```json
{
  "status": "ok",
  "service": "supportiq-gpu-inference",
  "cuda_available": true,
  "device": "cuda:0",
  "gpu_name": "NVIDIA GeForce RTX 2050",
  "vram_total_gb": 4.0,
  "vram_allocated_gb": 1.37
}
```

### `GET /models`
Lists available model variants (`qlora`, `lora`, `base`), quantization status, and readiness.

### `GET /runtime`
Returns deep hardware telemetry (driver versions, PyTorch build, compute capability, VRAM statistics).

### `POST /generate`
Secured generation endpoint. Requires header:
`X-API-Key: <SUPPORTIQ_INFERENCE_API_KEY>`

**Request Body:**
```json
{
  "model": "qlora",
  "query": "What is the return policy?",
  "context": "Annual subscriptions may be refunded within 14 days...",
  "max_new_tokens": 96,
  "temperature": 0.0
}
```

**Response Body:**
```json
{
  "success": true,
  "model": "qlora",
  "model_display_name": "SupportIQ QLoRA (4-bit NF4)",
  "answer": "Annual subscriptions may be refunded within 14 days of purchase...",
  "device": "cuda:0",
  "gpu": "NVIDIA GeForce RTX 2050",
  "cuda_available": true,
  "latency_seconds": 1.55,
  "latency_ms": 1550.0,
  "peak_vram_gb": 1.37
}
```

---

## 4. Cloud Deployment Options

### Option A: RunPod (Recommended Serverless / Pod)
1. Deploy a PyTorch 2.4+ template pod with an NVIDIA GPU (e.g. RTX 3090, RTX 4090, or A4000).
2. Clone repository or copy `gpu-inference/` and `backend/artifacts/adapters/`.
3. Set environment variable: `SUPPORTIQ_INFERENCE_API_KEY=your-secure-secret-token`.
4. Run:
   ```bash
   pip install -r requirements.txt
   python -m uvicorn app:app --host 0.0.0.0 --port 8001
   ```
5. Copy the exposed HTTPS public URL (e.g., `https://<pod-id>-8001.proxy.runpod.net`) to Render's `SUPPORTIQ_INFERENCE_URL`.

### Option B: Docker on GCP / AWS (EC2 G5/G6 or Vertex AI)
1. Build the Docker image:
   ```bash
   docker build -t supportiq-gpu-inference:latest -f Dockerfile .
   ```
2. Run with NVIDIA Container Toolkit:
   ```bash
   docker run --gpus all -d \
     -p 8001:8001 \
     -e SUPPORTIQ_INFERENCE_API_KEY="your-secure-secret-token" \
     supportiq-gpu-inference:latest
   ```

### Option C: Modal
Deploy `app.py` as an auto-scaling ASGI web service with `@app.function(gpu="T4")`.

---

## 5. Connecting with Render Main Application

On your Render Web Service dashboard (or in `render.yaml`):
1. Add environment variable:
   `SUPPORTIQ_INFERENCE_URL=https://your-gpu-service.example.com`
2. Add environment variable:
   `SUPPORTIQ_INFERENCE_API_KEY=your-secure-secret-token`
3. Trigger deploy. Render will automatically forward LoRA and QLoRA neural inference requests to the cloud GPU service while keeping RAG retrieval, persistence, and citations local.
