# SupportIQ — Cloud GPU Deployment Results

## Overview

This document records the empirical measurements, configuration specifications, and deployment status for the SupportIQ cloud GPU inference microservice.

Historical research metrics, frozen experiment runs (Runs 42, 54, 59), research datasets, and research paper tables remain strictly isolated and unmodified.

---

## 1. Cloud Provider Specification

- **Target Cloud Provider:** RunPod
- **Target GPU Options (Cost-Effective Tier):**
  - NVIDIA RTX 3070 (8 GB VRAM) — ~$0.13/hr
  - NVIDIA RTX A4000 (16 GB VRAM) — ~$0.17/hr
  - NVIDIA RTX 3080 (10 GB VRAM) — ~$0.17/hr
  - NVIDIA RTX 3090 (24 GB VRAM) — ~$0.22/hr
- **Target Runtime Container:** PyTorch 2.4+ / CUDA 12.4+ (Ubuntu 22.04)
- **Deployment Status:** Service package prepared (`gpu-inference/`); awaiting user manual RunPod Pod creation / API key entry.

---

## 2. Model & Quantization Stack

| Component | Specification |
|---|---|
| **Base Model** | `Qwen/Qwen2.5-0.5B-Instruct` |
| **LoRA Adapter** | `supportiq_lora_qwen05b` (FP16 base, $r=8$, $\alpha=16$, targets `q_proj`, `v_proj`) |
| **QLoRA Adapter** | `supportiq_qlora_qwen05b` (4-bit NF4 base, double quantization, float16 compute, $r=8$, $\alpha=16$, targets `q_proj`, `v_proj`) |
| **Frameworks** | PyTorch 2.6.0+cu124, Transformers 5.17.0, PEFT 0.21.0, bitsandbytes 0.50.2 |

---

## 3. Hardware Benchmarks (Host GPU Validation)

*Executed on physical NVIDIA Ampere GPU to establish baseline operational metrics prior to cloud deployment:*

| Metric | SupportIQ LoRA (FP16) | SupportIQ QLoRA (4-bit NF4) |
|---|---|---|
| **Host Device** | NVIDIA GeForce RTX 2050 | NVIDIA GeForce RTX 2050 |
| **CUDA Available** | `True` (CUDA 12.4) | `True` (CUDA 12.4) |
| **Measured Latency** | 1,508.5 ms (1.51 s) | 1,556.9 ms (1.56 s) |
| **Peak VRAM Allocated** | 0.93 GB | 1.37 GB |
| **Quantization Scheme** | FP16 Half-Precision | 4-bit NF4 + Double Quantization |
| **Grounding Pass** | `True` | `True` |
| **Silent Fallback** | `None` (Zero fallback) | `None` (Zero fallback) |

---

## 4. RunPod Remote Inference Verification Status

- **RunPod Instance Provisioning:** NOT VERIFIED (Requires user manual RunPod account authorization / billing).
- **RunPod HTTPS Proxy URL:** NOT VERIFIED (Awaiting active pod ID).
- **Render → RunPod Live HTTP Call:** NOT VERIFIED (Awaiting remote URL configuration in `SUPPORTIQ_INFERENCE_URL`).
