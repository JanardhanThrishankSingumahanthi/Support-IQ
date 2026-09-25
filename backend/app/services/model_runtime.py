from __future__ import annotations

import logging
import os
import threading
import time
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Base repository and artifact paths
_CURRENT_DIR = Path(__file__).resolve().parent
_BACKEND_DIR = _CURRENT_DIR.parent.parent
_ARTIFACTS_DIR = _BACKEND_DIR / "artifacts" / "adapters"

BASE_MODEL_ID = "Qwen/Qwen2.5-0.5B-Instruct"
QLORA_ADAPTER_DIR = _ARTIFACTS_DIR / "supportiq_qlora_qwen05b"
LORA_ADAPTER_DIR = _ARTIFACTS_DIR / "supportiq_lora_qwen05b"


class ModelUnavailableError(RuntimeError):
    """Raised when the requested model runtime or adapter is unavailable."""
    pass


class ModelRuntimeService:
    """Thread-safe, lazy-loading runtime service for SupportIQ models (Base, LoRA, QLoRA).
    
    Caches loaded models in memory to avoid per-request reloading overhead.
    """

    def __init__(self):
        self._lock = threading.Lock()
        self._loaded_models: dict[str, tuple[Any, Any]] = {}  # variant -> (model, tokenizer)
        self._device = "cuda:0" if self._is_cuda_available() else "cpu"

    @staticmethod
    def _is_cuda_available() -> bool:
        try:
            import torch
            return bool(torch.cuda.is_available())
        except Exception:
            return False

    def get_adapter_path(self, variant: str) -> Path:
        normalized = self.normalize_variant(variant)
        if normalized == "qlora":
            return QLORA_ADAPTER_DIR
        elif normalized == "lora":
            return LORA_ADAPTER_DIR
        raise ValueError(f"No adapter path for variant: {variant}")

    @staticmethod
    def normalize_variant(variant: str | None) -> str:
        if not variant:
            return "qlora"
        v = variant.strip().lower()
        if "qlora" in v:
            return "qlora"
        elif "lora" in v:
            return "lora"
        elif "base" in v or "qwen" in v:
            return "base"
        elif "extractive" in v:
            return "extractive"
        return "unknown"

    def is_model_available(self, variant: str) -> tuple[bool, str]:
        """Check if the requested model can be loaded without attempting full loading."""
        normalized = self.normalize_variant(variant)
        if normalized == "extractive":
            return True, "Extractive heuristic synthesizer is always available."

        try:
            import torch
        except ImportError:
            return False, "PyTorch is not installed in the environment."

        if normalized == "qlora":
            if not torch.cuda.is_available():
                return False, "4-bit NF4 QLoRA requires a CUDA GPU, but CUDA is not available."
            adapter_path = self.get_adapter_path("qlora")
            if not adapter_path.exists():
                return False, f"QLoRA adapter directory not found at {adapter_path}."
            if not (adapter_path / "adapter_model.safetensors").exists():
                return False, f"QLoRA weights 'adapter_model.safetensors' missing in {adapter_path}."
            return True, "SupportIQ QLoRA (4-bit NF4) is ready for inference."

        elif normalized == "lora":
            adapter_path = self.get_adapter_path("lora")
            if not adapter_path.exists():
                return False, f"LoRA adapter directory not found at {adapter_path}."
            if not (adapter_path / "adapter_model.safetensors").exists():
                return False, f"LoRA weights 'adapter_model.safetensors' missing in {adapter_path}."
            return True, "SupportIQ LoRA (FP16) is ready for inference."

        elif normalized == "base":
            return True, "Base Qwen 0.5B is available."

        return False, f"Unknown model variant '{variant}'."

    def get_models_metadata(self) -> list[dict[str, Any]]:
        """Return status of all supported models for UI selection."""
        results = []
        for variant, name, desc, quant in [
            ("qlora", "SupportIQ QLoRA (4-bit NF4)", "Fine-tuned 4-bit NF4 adapter with double quantization (0.46 GB VRAM)", "4-bit NF4"),
            ("lora", "SupportIQ LoRA (FP16)", "Fine-tuned FP16 LoRA adapter with 0.84s average generation latency", "FP16"),
            ("base", "Base Qwen 0.5B (Zero-Shot RAG)", "Base instruction-tuned model without domain fine-tuning", "FP16"),
            ("extractive", "Extractive Synthesizer", "Deterministic sentence-level evidence extraction (fallback)", "None"),
        ]:
            available, reason = self.is_model_available(variant)
            is_loaded = variant in self._loaded_models
            results.append({
                "id": variant,
                "name": name,
                "description": desc,
                "quantization": quant,
                "available": available,
                "loaded": is_loaded,
                "reason": reason,
                "device": self._device if variant != "extractive" else "cpu",
            })
        return results

    def load_model(self, variant: str) -> tuple[Any, Any]:
        """Loads and caches the model and tokenizer in memory. Thread-safe."""
        normalized = self.normalize_variant(variant)
        if normalized == "extractive":
            raise ValueError("Extractive synthesizer does not use a neural model runtime.")
        if normalized == "unknown":
            raise ModelUnavailableError(f"Unsupported model variant: '{variant}'")

        if normalized in self._loaded_models:
            return self._loaded_models[normalized]

        with self._lock:
            # Double-check if loaded while acquiring lock
            if normalized in self._loaded_models:
                return self._loaded_models[normalized]

            available, reason = self.is_model_available(normalized)
            if not available:
                raise ModelUnavailableError(f"Model '{normalized}' is unavailable: {reason}")

            import torch
            from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
            from peft import PeftModel

            logger.info("Loading model variant '%s' on %s...", normalized, self._device)

            if normalized == "qlora":
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
                self._loaded_models[normalized] = (model, tokenizer)
                logger.info("Successfully loaded and cached QLoRA model.")
                return model, tokenizer

            elif normalized == "lora":
                adapter_path = self.get_adapter_path("lora")
                tokenizer = AutoTokenizer.from_pretrained(str(adapter_path))
                if tokenizer.pad_token is None:
                    tokenizer.pad_token = tokenizer.eos_token

                base_model = AutoModelForCausalLM.from_pretrained(
                    BASE_MODEL_ID,
                    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                    device_map=self._device,
                )
                model = PeftModel.from_pretrained(base_model, str(adapter_path))
                model.eval()
                self._loaded_models[normalized] = (model, tokenizer)
                logger.info("Successfully loaded and cached LoRA model.")
                return model, tokenizer

            elif normalized == "base":
                tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_ID)
                if tokenizer.pad_token is None:
                    tokenizer.pad_token = tokenizer.eos_token

                model = AutoModelForCausalLM.from_pretrained(
                    BASE_MODEL_ID,
                    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                    device_map=self._device,
                )
                model.eval()
                self._loaded_models[normalized] = (model, tokenizer)
                logger.info("Successfully loaded and cached Base Qwen model.")
                return model, tokenizer

            raise ModelUnavailableError(f"Unsupported model variant: {normalized}")

    def generate_answer(
        self,
        query: str,
        context_chunks: list[dict[str, Any]],
        model_variant: str = "qlora",
        max_new_tokens: int = 96,
    ) -> dict[str, Any]:
        """Generates an answer using the requested neural model variant with support context."""
        normalized = self.normalize_variant(model_variant)
        model, tokenizer = self.load_model(normalized)

        # Build clean grounded context from top retrieved chunks
        context_text = "\n---\n".join(
            f"[Doc {c.get('document_id', '?')} Chunk {c.get('chunk_id', '?')}]: {c.get('content', '').strip()}"
            for c in context_chunks[:3]
        )

        prompt = (
            f"<|im_start|>system\nYou are SupportIQ's AI customer support assistant. "
            f"Answer the customer's question accurately, professionally, and concisely using ONLY the provided support context. "
            f"Do not invent facts not supported by the context.<|im_end|>\n"
            f"<|im_start|>user\nContext:\n{context_text}\n\nQuestion: {query}<|im_end|>\n"
            f"<|im_start|>assistant\n"
        )

        import torch
        device = self._device
        inputs = tokenizer(prompt, return_tensors="pt").to(device)

        if torch.cuda.is_available():
            torch.cuda.synchronize()
        start_time = time.perf_counter()

        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                do_sample=False,
                temperature=None,
                top_p=None,
                pad_token_id=tokenizer.pad_token_id or tokenizer.eos_token_id,
            )

        if torch.cuda.is_available():
            torch.cuda.synchronize()
        gen_duration_sec = time.perf_counter() - start_time
        gen_duration_ms = round(gen_duration_sec * 1000, 1)

        full_output = tokenizer.decode(outputs[0], skip_special_tokens=False)
        if "<|im_start|>assistant\n" in full_output:
            answer = full_output.split("<|im_start|>assistant\n")[-1].replace("<|im_end|>", "").strip()
        else:
            answer = full_output.strip()

        peak_vram_gb = None
        if torch.cuda.is_available():
            peak_vram_gb = round(torch.cuda.max_memory_allocated(0) / (1024**3), 2)

        return {
            "answer": answer,
            "latency_ms": gen_duration_ms,
            "latency_sec": round(gen_duration_sec, 4),
            "model_variant": normalized,
            "model_display_name": {
                "qlora": "SupportIQ QLoRA (4-bit NF4)",
                "lora": "SupportIQ LoRA (FP16)",
                "base": "Base Qwen 0.5B (Zero-Shot)",
            }.get(normalized, normalized),
            "peak_vram_gb": peak_vram_gb,
            "status": "resolved",
        }

    def unload_models(self):
        """Clears cached models and frees GPU VRAM."""
        with self._lock:
            self._loaded_models.clear()
            try:
                import torch
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
            except Exception:
                pass


# Global singleton instance
_model_runtime_instance: ModelRuntimeService | None = None


def get_model_runtime() -> ModelRuntimeService:
    global _model_runtime_instance
    if _model_runtime_instance is None:
        _model_runtime_instance = ModelRuntimeService()
    return _model_runtime_instance
