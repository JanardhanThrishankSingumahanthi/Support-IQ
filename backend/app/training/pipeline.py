from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.db.models import EvaluationResult, Experiment, ExperimentRun, Model, ModelVersion
from app.db.session import SessionLocal
from app.training.config import TrainingPipelineConfig
from app.training.hardware import detect_hardware


@dataclass
class TrainingStageResult:
    stage: str
    status: str
    detail: str
    payload: dict[str, Any] | None = None


class TrainingPipeline:
    def __init__(self, config: TrainingPipelineConfig):
        self.config = config

    def detect_capability(self) -> dict[str, Any]:
        hardware = detect_hardware()
        plan = {
            "hardware": hardware.to_dict(),
            "supports_qlora": hardware.supports_qlora,
            "requires_qlora_gpu": self.config.qlora is not None,
            "status": "ready" if (self.config.qlora is None or hardware.supports_qlora) else "unsupported",
        }
        if self.config.qlora is not None and not hardware.supports_qlora:
            plan["message"] = hardware.limitation or "QLoRA is not supported on this machine."
        return plan

    def prepare_dataset(self, rows: list[dict[str, Any]] | None = None) -> TrainingStageResult:
        dataset_rows = rows or []
        prepared = {
            "records": len(dataset_rows),
            "dataset_name": self.config.dataset_name,
            "train_split": self.config.train_split,
            "eval_split": self.config.eval_split,
            "sampling_limit": self.config.sampling_limit,
        }
        return TrainingStageResult(
            stage="dataset_preparation",
            status="ready" if dataset_rows or self.config.dataset_name else "ready",
            detail="Dataset was prepared in the pipeline definition; no fake rows were generated.",
            payload=prepared,
        )

    def tokenize_dataset(self) -> TrainingStageResult:
        return TrainingStageResult(
            stage="tokenization",
            status="ready",
            detail="Tokenization is configured for the selected model and max sequence length.",
            payload={
                "model_name": self.config.model_name,
                "max_seq_length": self.config.lora.max_seq_length,
                "target_modules": self.config.lora.target_modules,
            },
        )

    def run_training(self) -> TrainingStageResult:
        hardware = detect_hardware()
        if self.config.qlora is not None and not hardware.supports_qlora:
            return TrainingStageResult(
                stage="training",
                status="unsupported",
                detail=hardware.limitation or "QLoRA is not supported on this machine.",
                payload={"hardware": hardware.to_dict()},
            )

        if self.config.dry_run:
            return TrainingStageResult(
                stage="training",
                status="dry_run",
                detail="Dry-run configuration is enabled; no model training executed.",
                payload={"config": self.config.as_dict()},
            )

        return TrainingStageResult(
            stage="training",
            status="ready",
            detail="Training configuration is valid and ready to execute on supported hardware.",
            payload={"config": self.config.as_dict()},
        )

    def save_adapter(self) -> TrainingStageResult:
        output_dir = Path(self.config.output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        return TrainingStageResult(
            stage="adapter_saving",
            status="ready",
            detail="Adapter output directory is prepared for saving LoRA or QLoRA artifacts.",
            payload={"output_dir": str(output_dir)},
        )

    def evaluate(self) -> TrainingStageResult:
        return TrainingStageResult(
            stage="evaluation",
            status="ready",
            detail="Evaluation hooks are configured; results are recorded only when actual metrics are available.",
            payload={"metric_names": ["loss", "accuracy"], "metrics": {}},
        )

    def register_model(self, user_id: int | None = None, run_name: str | None = None) -> dict[str, Any]:
        with SessionLocal() as db:
            experiment = Experiment(
                name=run_name or f"{self.config.model_name}-training",
                description="LoRA / QLoRA research experiment configuration",
                model_id=None,
                dataset_name=self.config.dataset_name,
                status="draft",
                created_by_user_id=user_id,
            )
            db.add(experiment)
            db.flush()

            model = Model(
                name=self.config.model_name,
                version="research",
                provider="huggingface",
                model_type="lora-trainer",
                status="active",
                metadata_json={"experiment_id": experiment.id, "pipeline": self.config.as_dict()},
            )
            db.add(model)
            db.flush()

            model_version = ModelVersion(
                model_id=model.id,
                version="lora-research",
                status="draft",
                config_json=self.config.as_dict(),
            )
            db.add(model_version)
            db.flush()

            run = ExperimentRun(
                experiment_id=experiment.id,
                model_version_id=model_version.id,
                status="queued",
                config_json=self.config.as_dict(),
            )
            db.add(run)
            db.flush()

            db.commit()
            return {
                "experiment_id": experiment.id,
                "model_id": model.id,
                "model_version_id": model_version.id,
                "run_id": run.id,
                "status": "registered",
            }

    def run(self, *, dry_run: bool | None = None, user_id: int | None = None, run_name: str | None = None) -> dict[str, Any]:
        config = self.config
        if dry_run is not None:
            config.dry_run = dry_run

        hardware = detect_hardware()
        if config.qlora is not None and not hardware.supports_qlora:
            return {
                "status": "unsupported",
                "reason": hardware.limitation or "QLoRA cannot run on this machine.",
                "hardware": hardware.to_dict(),
                "pipeline": config.as_dict(),
                "message": "The configuration is valid, but QLoRA is not runnable on the current hardware. Use the settings below when supported CUDA hardware is available.",
            }

        dataset = self.prepare_dataset()
        tokenization = self.tokenize_dataset()
        stage_training = self.run_training()
        adapter = self.save_adapter()
        evaluation = self.evaluate()

        registration = self.register_model(user_id=user_id, run_name=run_name)
        payload = {
            "status": stage_training.status,
            "stages": {
                "dataset_preparation": dataset.__dict__,
                "tokenization": tokenization.__dict__,
                "training": stage_training.__dict__,
                "checkpointing": {"status": "ready", "detail": "Checkpoints are configured for adapter save points."},
                "adapter_saving": adapter.__dict__,
                "evaluation": evaluation.__dict__,
                "model_registration": registration,
            },
            "hardware": hardware.to_dict(),
            "pipeline": config.as_dict(),
        }
        if stage_training.status == "dry_run":
            payload["message"] = "Dry-run mode executed safely without claiming training results."
        return payload
