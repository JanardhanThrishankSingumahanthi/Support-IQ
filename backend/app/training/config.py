from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class LoraTrainingConfig:
    rank: int = 8
    alpha: int = 16
    dropout: float = 0.05
    target_modules: list[str] = field(default_factory=lambda: ["q_proj", "v_proj"])
    learning_rate: float = 2e-5
    batch_size: int = 2
    gradient_accumulation_steps: int = 4
    epochs: int = 1
    max_seq_length: int = 2048

    def as_dict(self) -> dict[str, Any]:
        return {
            "rank": self.rank,
            "alpha": self.alpha,
            "dropout": self.dropout,
            "target_modules": self.target_modules,
            "learning_rate": self.learning_rate,
            "batch_size": self.batch_size,
            "gradient_accumulation_steps": self.gradient_accumulation_steps,
            "epochs": self.epochs,
            "max_seq_length": self.max_seq_length,
        }


@dataclass
class QLoraTrainingConfig:
    load_in_4bit: bool = True
    bnb_4bit_quant_type: str = "nf4"
    bnb_4bit_use_double_quant: bool = True
    bnb_4bit_compute_dtype: str = "float16"
    gradient_checkpointing: bool = True
    mixed_precision: str | None = "bf16"

    def as_dict(self) -> dict[str, Any]:
        return {
            "load_in_4bit": self.load_in_4bit,
            "bnb_4bit_quant_type": self.bnb_4bit_quant_type,
            "bnb_4bit_use_double_quant": self.bnb_4bit_use_double_quant,
            "bnb_4bit_compute_dtype": self.bnb_4bit_compute_dtype,
            "gradient_checkpointing": self.gradient_checkpointing,
            "mixed_precision": self.mixed_precision,
        }


@dataclass
class TrainingPipelineConfig:
    model_name: str
    dataset_name: str | None = None
    train_split: str = "train"
    eval_split: str | None = None
    output_dir: str = "./artifacts/experiments"
    dry_run: bool = True
    lora: LoraTrainingConfig = field(default_factory=LoraTrainingConfig)
    qlora: QLoraTrainingConfig | None = None
    sampling_limit: int = 32

    def as_dict(self) -> dict[str, Any]:
        payload = {
            "model_name": self.model_name,
            "dataset_name": self.dataset_name,
            "train_split": self.train_split,
            "eval_split": self.eval_split,
            "output_dir": self.output_dir,
            "dry_run": self.dry_run,
            "sampling_limit": self.sampling_limit,
            "lora": self.lora.as_dict(),
        }
        if self.qlora is not None:
            payload["qlora"] = self.qlora.as_dict()
        return payload
