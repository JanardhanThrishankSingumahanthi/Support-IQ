from __future__ import annotations

from dataclasses import dataclass, field
from importlib.util import find_spec
from typing import Any


@dataclass
class HardwareProfile:
    device_type: str = "cpu"
    cpu_count: int = 1
    has_cuda: bool = False
    cuda_device_count: int = 0
    vram_gb: float | None = None
    supports_transformers: bool = False
    supports_peft: bool = False
    supports_bitsandbytes: bool = False
    supports_qlora: bool = False
    libraries: dict[str, bool] = field(default_factory=dict)
    limitation: str | None = None
    recommended_config: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "device_type": self.device_type,
            "cpu_count": self.cpu_count,
            "has_cuda": self.has_cuda,
            "cuda_device_count": self.cuda_device_count,
            "vram_gb": self.vram_gb,
            "supports_transformers": self.supports_transformers,
            "supports_peft": self.supports_peft,
            "supports_bitsandbytes": self.supports_bitsandbytes,
            "supports_qlora": self.supports_qlora,
            "libraries": self.libraries,
            "limitation": self.limitation,
            "recommended_config": self.recommended_config,
        }


def detect_hardware() -> HardwareProfile:
    cpu_count = 1
    try:
        import os

        cpu_count = max(1, len(os.sched_getaffinity(0)) if hasattr(os, "sched_getaffinity") else 1)
    except Exception:
        cpu_count = 1

    library_names = ["torch", "transformers", "peft", "bitsandbytes"]
    libraries = {name: bool(find_spec(name)) for name in library_names}

    has_cuda = False
    cuda_device_count = 0
    vram_gb = None
    try:
        import torch

        has_cuda = bool(torch.cuda.is_available())
        cuda_device_count = int(torch.cuda.device_count()) if has_cuda else 0
        if has_cuda and cuda_device_count > 0:
            total_memory = torch.cuda.get_device_properties(0).total_memory
            vram_gb = round(total_memory / (1024**3), 2)
    except Exception:
        has_cuda = False
        cuda_device_count = 0
        vram_gb = None

    supports_transformers = libraries["transformers"]
    supports_peft = libraries["peft"]
    supports_bitsandbytes = libraries["bitsandbytes"]
    supports_qlora = bool(has_cuda and supports_transformers and supports_peft and supports_bitsandbytes)

    limitation = None
    if not supports_transformers:
        limitation = "Transformers is not installed. Install transformers to enable LoRA/QLoRA training pipelines."
    elif not supports_peft:
        limitation = "PEFT is not installed. Install peft to enable LoRA adapters."
    elif not has_cuda:
        limitation = "CUDA-capable GPU is required for QLoRA. This machine is currently CPU-only. LoRA remains configurable but QLoRA is not runnable here."
    elif not supports_bitsandbytes:
        limitation = "bitsandbytes is not installed. QLoRA 4-bit quantization cannot run without it."

    recommended_config = {
        "device_type": "cuda" if has_cuda else "cpu",
        "load_in_4bit": True,
        "bnb_4bit_quant_type": "nf4",
        "bnb_4bit_use_double_quant": True,
        "gradient_checkpointing": True,
        "mixed_precision": "bf16" if has_cuda else "fp32",
    }

    return HardwareProfile(
        device_type="cuda" if has_cuda else "cpu",
        cpu_count=cpu_count,
        has_cuda=has_cuda,
        cuda_device_count=cuda_device_count,
        vram_gb=vram_gb,
        supports_transformers=supports_transformers,
        supports_peft=supports_peft,
        supports_bitsandbytes=supports_bitsandbytes,
        supports_qlora=supports_qlora,
        libraries=libraries,
        limitation=limitation,
        recommended_config=recommended_config,
    )
