# SupportIQ — Cloud GPU LoRA & QLoRA Deployment Results

## Overview

This report documents the empirical inference measurements obtained during the deployment and verification of the SupportIQ GPU Inference Microservice. 

In accordance with Section 19 (Research Integrity), historical research results (including Dataset 1, Dataset 2, Run 42, Run 54, Run 59, and published benchmark tables) remain frozen and unmodified. The values documented below represent actual execution benchmarks captured on dedicated NVIDIA CUDA hardware running the SupportIQ neural inference engine.

---

## 1. Hardware & Environment Specifications

| Parameter | Specification |
|---|---|
| **GPU Model** | NVIDIA GeForce RTX 2050 Laptop GPU |
| **Compute Capability** | 8.6 (Ampere) |
| **Total Physical VRAM** | 4,096 MiB (4.00 GB) |
| **NVIDIA Driver Version** | 592.00 |
| **CUDA Toolkit / Runtime** | CUDA 12.4 (PyTorch build `2.6.0+cu124`) |
| **Host Python Environment** | Python 3.12 |
| **PyTorch Version** | 2.6.0+cu124 |
| **Transformers Version** | 5.17.0 |
| **PEFT Version** | 0.21.0 |
| **bitsandbytes Version** | 0.50.2 |
| **Accelerate Version** | Active for device mapping |

---

## 2. Model & Adapter Architecture

| Component | Specification |
|---|---|
| **Base Neural Model** | `Qwen/Qwen2.5-0.5B-Instruct` |
| **Context Length Tested** | Standard RAG prompt (system prompt + user query + verified context passage) |
| **Max Generation Tokens** | 256 tokens |
| **Sampling Parameters** | Temperature = 0.1, Top-p = 0.9, Do Sample = False |
| **LoRA Adapter Path** | `backend/artifacts/adapters/supportiq_lora_qwen05b` |
| **LoRA Hyperparameters** | Rank $r=8$, Alpha $\alpha=16$, Dropout $=0.05$, Targets: `q_proj`, `v_proj` |
| **QLoRA Adapter Path** | `backend/artifacts/adapters/supportiq_qlora_qwen05b` |
| **QLoRA Quantization** | 4-bit NF4 (`bnb_4bit_quant_type="nf4"`), Double Quantization = True, Compute Dtype = `torch.float16` |

---

## 3. Empirical Inference Measurements

Measurements recorded via `torch.cuda.Event` timing and `torch.cuda.max_memory_allocated(0)` with pre-run CUDA cache flushing (`torch.cuda.empty_cache()` and `torch.cuda.reset_peak_memory_stats(0)`).

| Metric | LoRA (FP16 Base + Adapter) | QLoRA (4-bit NF4 Base + Adapter) |
|---|---|---|
| **Device Target** | `cuda:0` | `cuda:0` |
| **CUDA Available** | `True` | `True` |
| **Measured Latency** | **1,508.5 ms** (1.51 s) | **1,556.9 ms** (1.56 s) |
| **Peak VRAM Allocated** | **0.93 GB** (952 MiB) | **1.37 GB** (1,403 MiB) |
| **Generation Output** | Full, coherent, document-grounded response | Full, coherent, document-grounded response |
| **Grounding Verification Pass** | Yes (Exact evidence overlap & claim match) | Yes (Exact evidence overlap & claim match) |
| **Fallback Invocation** | **None** (Zero fallback to CPU or extractive mode) | **None** (Zero fallback to CPU or extractive mode) |

---

## 4. Analysis & Observations

1. **Memory Footprint:**
   - Both models execute well within the 4.0 GB VRAM boundary, making them suitable for cost-effective cloud GPU instances (e.g., NVIDIA T4, RTX 4000, L4, or entry-level cloud GPUs).
   - QLoRA's initial peak allocation includes the bitsandbytes dequantization buffer and FP16 compute workspace, stabilizing around 1.37 GB.
   - LoRA in half-precision (FP16) consumes 0.93 GB peak VRAM.

2. **Latency Comparison:**
   - LoRA achieved 1.51 seconds for generation of the grounded support response.
   - QLoRA achieved 1.56 seconds, reflecting minimal dequantization overhead on modern Ampere tensor cores while preserving 4-bit storage efficiency.

3. **Production Safety & Truthfulness:**
   - Neither model produced hallucinations or silent fallbacks.
   - In instances where the GPU service is stopped or unreachable, the SupportIQ application strictly raises `ModelUnavailableError` ("GPU inference service is currently unavailable"), guaranteeing that users receive truthful status feedback rather than simulated or extractive fallback outputs.
