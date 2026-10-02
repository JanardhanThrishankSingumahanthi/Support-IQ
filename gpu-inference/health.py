from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger("gpu_health")


def get_gpu_telemetry() -> dict[str, Any]:
    """Inspects and returns real CUDA, GPU, and system telemetry."""
    try:
        import torch
    except ImportError:
        return {
            "cuda_available": False,
            "error": "PyTorch is not installed in the environment.",
            "device": "none",
            "gpu_name": "None",
            "vram_total_gb": 0.0,
            "vram_allocated_gb": 0.0,
            "vram_reserved_gb": 0.0,
        }

    cuda_available = bool(torch.cuda.is_available())
    if not cuda_available:
        return {
            "cuda_available": False,
            "device": "cpu",
            "gpu_name": "None (CPU Only)",
            "torch_version": torch.__version__,
            "cuda_version": None,
            "vram_total_gb": 0.0,
            "vram_allocated_gb": 0.0,
            "vram_reserved_gb": 0.0,
        }

    device_idx = 0
    device_name = torch.cuda.get_device_name(device_idx)
    props = torch.cuda.get_device_properties(device_idx)
    total_mem = round(props.total_memory / (1024**3), 2)
    allocated_mem = round(torch.cuda.memory_allocated(device_idx) / (1024**3), 2)
    reserved_mem = round(torch.cuda.memory_reserved(device_idx) / (1024**3), 2)

    try:
        import bitsandbytes as bnb
        bnb_version = getattr(bnb, "__version__", "unknown")
    except Exception:
        bnb_version = "unavailable"

    try:
        import transformers
        transformers_version = getattr(transformers, "__version__", "unknown")
    except Exception:
        transformers_version = "unavailable"

    try:
        import peft
        peft_version = getattr(peft, "__version__", "unknown")
    except Exception:
        peft_version = "unavailable"

    return {
        "cuda_available": True,
        "device": f"cuda:{device_idx}",
        "gpu_name": device_name,
        "compute_capability": f"{props.major}.{props.minor}",
        "torch_version": torch.__version__,
        "cuda_version": torch.version.cuda,
        "bitsandbytes_version": bnb_version,
        "transformers_version": transformers_version,
        "peft_version": peft_version,
        "vram_total_gb": total_mem,
        "vram_allocated_gb": allocated_mem,
        "vram_reserved_gb": reserved_mem,
    }
