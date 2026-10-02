from __future__ import annotations

import logging
import os
import threading
import time
from pathlib import Path
from typing import Any

logger = logging.getLogger("model_server")

BASE_MODEL_ID = os.environ.get("BASE_MODEL_ID", "Qwen/Qwen2.5-0.5B-Instruct")

# Adapter path resolution: check env vars, then local ./adapters, then ../backend/artifacts/adapters
_SCRIPT_DIR = Path(__file__).resolve().parent
_REPO_DIR = _SCRIPT_DIR.parent
_DEFAULT_BACKEND_ADAPTERS = _REPO_DIR / "backend" / "artifacts" / "adapters"
_LOCAL_ADAPTERS = _SCRIPT_DIR / "adapters"

LORA_ADAPTER_DIR = Path(
    os.environ.get(
        "LORA_ADAPTER_DIR",
        str(_LOCAL_ADAPTERS / "supportiq_lora_qwen05b" if (_LOCAL_ADAPTERS / "supportiq_lora_qwen05b").exists() else _DEFAULT_BACKEND_ADAPTERS / "supportiq_lora_qwen05b")
    )
)

QLORA_ADAPTER_DIR = Path(
    os.environ.get(
        "QLORA_ADAPTER_DIR",
        str(_LOCAL_ADAPTERS / "supportiq_qlora_qwen05b" if (_LOCAL_ADAPTERS / "supportiq_qlora_qwen05b").exists() else _DEFAULT_BACKEND_ADAPTERS / "supportiq_qlora_qwen05b")
    )
)


class GPUModelServer:
    """Thread-safe GPU model server hosting Qwen2.5-0.5B, LoRA, and QLoRA on CUDA."""

    def __init__(self):
        self._lock = threading.Lock()
        self._loaded_models: dict[str, tuple[Any, Any]] = {}

    @staticmethod
    def is_cuda_available() -> bool:
        try:
            import torch
            return bool(torch.cuda.is_available())
        except Exception:
            return False

    @staticmethod
    def normalize_model_name(name: str | None) -> str:
        if not name:
            return "qlora"
        n = name.strip().lower()
        if "qlora" in n:
            return "qlora"
        elif "lora" in n:
            return "lora"
        elif "base" in n or "qwen" in n:
            return "base"
        return "unknown"

    def get_adapter_path(self, variant: str) -> Path:
        norm = self.normalize_model_name(variant)
        if norm == "qlora":
            return QLORA_ADAPTER_DIR
        elif norm == "lora":
            return LORA_ADAPTER_DIR
        raise ValueError(f"No adapter path for variant '{variant}'")

    def check_availability(self, variant: str) -> tuple[bool, str]:
        norm = self.normalize_model_name(variant)
        if norm == "unknown":
            return False, f"Unsupported model variant: {variant}"

        cuda_ok = self.is_cuda_available()

        if norm == "qlora":
            if not cuda_ok:
                return False, "4-bit NF4 QLoRA requires an active NVIDIA CUDA GPU."
            adapter_path = self.get_adapter_path("qlora")
            if not adapter_path.exists():
                return False, f"QLoRA adapter directory not found: {adapter_path}"
            if not (adapter_path / "adapter_model.safetensors").exists():
                return False, f"QLoRA adapter weights missing in: {adapter_path}"
            return True, "SupportIQ QLoRA (4-bit NF4) is ready for GPU inference."

        elif norm == "lora":
            if not cuda_ok:
                return False, "LoRA GPU inference requires an active NVIDIA CUDA GPU."
            adapter_path = self.get_adapter_path("lora")
            if not adapter_path.exists():
                return False, f"LoRA adapter directory not found: {adapter_path}"
            if not (adapter_path / "adapter_model.safetensors").exists():
                return False, f"LoRA adapter weights missing in: {adapter_path}"
            return True, "SupportIQ LoRA (FP16) is ready for GPU inference."

        elif norm == "base":
            return True, "Base Qwen2.5-0.5B-Instruct is ready for inference."

        return False, f"Unknown model variant: {variant}"

    def get_models_metadata(self) -> list[dict[str, Any]]:
        specs = [
            ("qlora", "SupportIQ QLoRA (4-bit NF4)", "Fine-tuned 4-bit NF4 adapter with double quantization", "4-bit NF4"),
            ("lora", "SupportIQ LoRA (FP16)", "Fine-tuned FP16 LoRA adapter with sub-second generation", "FP16"),
            ("base", "Base Qwen 0.5B (Zero-Shot RAG)", "Base instruction-tuned model without domain adapter", "FP16"),
        ]
        results = []
        for variant, name, desc, quant in specs:
            avail, reason = self.check_availability(variant)
            results.append({
                "id": variant,
                "name": name,
                "description": desc,
                "quantization": quant,
                "available": avail,
                "loaded": variant in self._loaded_models,
                "reason": reason,
                "device": "cuda:0" if self.is_cuda_available() else "cpu",
            })
        return results

    def load_model(self, variant: str) -> tuple[Any, Any]:
        norm = self.normalize_model_name(variant)
        if norm in self._loaded_models:
            return self._loaded_models[norm]

        with self._lock:
            if norm in self._loaded_models:
                return self._loaded_models[norm]

            avail, reason = self.check_availability(norm)
            if not avail:
                raise RuntimeError(f"Cannot load model '{norm}': {reason}")

            import torch
            from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
            from peft import PeftModel

            device = "cuda:0" if torch.cuda.is_available() else "cpu"
            logger.info("Loading model variant '%s' on %s...", norm, device)

            if norm == "qlora":
                adapter_path = self.get_adapter_path("qlora")
                bnb_config = BitsAndBytesConfig(
                    load_in_4bit=True,
                    bnb_4bit_quant_type="nf4",
                    bnb_4bit_compute_dtype=torch.float16,
                    bnb_4bit_use_double_quant=True,
                )
                tokenizer = AutoTokenizer.from_pretrained(str(adapter_path))
                if tokenizer.pad_token is None:
                    tokenizer.pad_token = tokenizer.eos_token

                base_model = AutoModelForCausalLM.from_pretrained(
                    BASE_MODEL_ID,
                    quantization_config=bnb_config,
                    device_map={"": 0},
                )
                model = PeftModel.from_pretrained(base_model, str(adapter_path))
                model.eval()
                self._loaded_models[norm] = (model, tokenizer)
                logger.info("Successfully loaded and cached QLoRA model on CUDA.")
                return model, tokenizer

            elif norm == "lora":
                adapter_path = self.get_adapter_path("lora")
                tokenizer = AutoTokenizer.from_pretrained(str(adapter_path))
                if tokenizer.pad_token is None:
                    tokenizer.pad_token = tokenizer.eos_token

                base_model = AutoModelForCausalLM.from_pretrained(
                    BASE_MODEL_ID,
                    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                    device_map=device,
                )
                model = PeftModel.from_pretrained(base_model, str(adapter_path))
                model.eval()
                self._loaded_models[norm] = (model, tokenizer)
                logger.info("Successfully loaded and cached LoRA model on CUDA.")
                return model, tokenizer

            elif norm == "base":
                tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_ID)
                if tokenizer.pad_token is None:
                    tokenizer.pad_token = tokenizer.eos_token

                model = AutoModelForCausalLM.from_pretrained(
                    BASE_MODEL_ID,
                    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                    device_map=device,
                )
                model.eval()
                self._loaded_models[norm] = (model, tokenizer)
                logger.info("Successfully loaded and cached Base Qwen model.")
                return model, tokenizer

            raise ValueError(f"Unknown variant '{norm}'")

    def generate(
        self,
        query: str,
        context: str,
        model_variant: str = "qlora",
        max_new_tokens: int = 96,
        temperature: float = 0.0,
    ) -> dict[str, Any]:
        norm = self.normalize_model_name(model_variant)
        model, tokenizer = self.load_model(norm)

        prompt = (
            f"<|im_start|>system\nYou are SupportIQ's AI customer support assistant. "
            f"Answer the customer's question accurately, professionally, and concisely using ONLY the provided support context. "
            f"Do not invent facts not supported by the context.<|im_end|>\n"
            f"<|im_start|>user\nContext:\n{context}\n\nQuestion: {query}<|im_end|>\n"
            f"<|im_start|>assistant\n"
        )

        import torch
        device = "cuda:0" if torch.cuda.is_available() else "cpu"
        inputs = tokenizer(prompt, return_tensors="pt").to(device)

        if torch.cuda.is_available():
            torch.cuda.synchronize()
            torch.cuda.reset_peak_memory_stats(0)

        start_time = time.perf_counter()

        gen_kwargs: dict[str, Any] = {
            "max_new_tokens": max_new_tokens,
            "pad_token_id": tokenizer.pad_token_id or tokenizer.eos_token_id,
        }
        if temperature > 0.0:
            gen_kwargs["do_sample"] = True
            gen_kwargs["temperature"] = temperature
        else:
            gen_kwargs["do_sample"] = False

        with torch.no_grad():
            outputs = model.generate(**inputs, **gen_kwargs)

        if torch.cuda.is_available():
            torch.cuda.synchronize()

        latency_sec = time.perf_counter() - start_time
        latency_ms = round(latency_sec * 1000, 1)

        full_output = tokenizer.decode(outputs[0], skip_special_tokens=False)
        if "<|im_start|>assistant\n" in full_output:
            answer = full_output.split("<|im_start|>assistant\n")[-1].replace("<|im_end|>", "").strip()
        else:
            answer = full_output.strip()

        peak_vram_gb = None
        gpu_name = "None"
        if torch.cuda.is_available():
            peak_vram_gb = round(torch.cuda.max_memory_allocated(0) / (1024**3), 2)
            gpu_name = torch.cuda.get_device_name(0)

        display_names = {
            "qlora": "SupportIQ QLoRA (4-bit NF4)",
            "lora": "SupportIQ LoRA (FP16)",
            "base": "Base Qwen 0.5B (Zero-Shot)",
        }

        return {
            "success": True,
            "model": norm,
            "model_display_name": display_names.get(norm, norm),
            "answer": answer,
            "device": device,
            "gpu": gpu_name,
            "cuda_available": torch.cuda.is_available(),
            "latency_seconds": round(latency_sec, 4),
            "latency_ms": latency_ms,
            "peak_vram_gb": peak_vram_gb,
        }


# Global instance
_server_instance: GPUModelServer | None = None


def get_gpu_model_server() -> GPUModelServer:
    global _server_instance
    if _server_instance is None:
        _server_instance = GPUModelServer()
    return _server_instance
