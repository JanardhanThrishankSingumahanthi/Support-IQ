from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, get_pagination
from app.db.models import EvaluationResult, Experiment, ExperimentRun, Model, ModelVersion, User

router = APIRouter(prefix="/experiments", tags=["experiments"])

EVALUATION_METRICS = [
    "accuracy",
    "faithfulness",
    "recall_at_5",
    "mrr",
    "hallucination_rate",
    "response_time",
    "gpu_memory",
    "parameter_count",
    "precision_at_k",
    "ndcg",
    "answer_relevance",
    "evidence_coverage",
]

MODEL_VARIANTS = [
    "Base LLM",
    "RAG Base",
    "LoRA",
    "QLoRA",
    "RAG + LoRA",
    "RAG + QLoRA",
]

VALID_STATES = {"QUEUED", "RUNNING", "COMPLETED", "FAILED", "CANCELLED"}


class ExperimentCreateRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    model_name: str | None = None
    dataset_name: str | None = None
    configuration: dict[str, Any] | None = None
    model_variant: str | None = Field(default=None, max_length=120)
    status: str = "QUEUED"


class ExperimentUpdateRequest(BaseModel):
    status: str | None = None
    metrics: dict[str, float | int | str | None] | None = None
    logs: list[str] | None = None
    artifacts: dict[str, Any] | None = None
    resource_usage: dict[str, Any] | None = None
    notes: str | None = None


class ExperimentRunRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    model_name: str | None = None
    dataset_name: str | None = None
    model_variant: str | None = None
    configuration: dict[str, Any] | None = None
    metrics: dict[str, float | int | str | None] | None = None


def _serialize_metric(metric: EvaluationResult) -> dict[str, Any]:
    value = metric.metric_value
    try:
        numeric_value = float(value) if value is not None else None
    except (TypeError, ValueError):
        numeric_value = None
    return {
        "id": metric.id,
        "metric_name": metric.metric_name,
        "metric_value": value,
        "numeric_value": numeric_value,
        "details_json": metric.details_json,
        "created_at": metric.created_at,
        "updated_at": metric.updated_at,
    }


def _serialize_run(run: ExperimentRun) -> dict[str, Any]:
    metrics = {item.metric_name: item.metric_value for item in run.evaluation_results}
    return {
        "id": run.id,
        "experiment_id": run.experiment_id,
        "model_version_id": run.model_version_id,
        "status": run.status,
        "config_json": run.config_json or {},
        "metrics": metrics,
        "metrics_details": [_serialize_metric(item) for item in sorted(run.evaluation_results, key=lambda item: item.metric_name)],
        "started_at": run.started_at,
        "finished_at": run.finished_at,
        "created_at": run.created_at,
        "updated_at": run.updated_at,
    }


def _serialize_experiment(experiment: Experiment) -> dict[str, Any]:
    latest_run = sorted(experiment.runs, key=lambda item: (item.created_at or datetime.min.replace(tzinfo=timezone.utc)), reverse=True)[0] if experiment.runs else None
    latest_metrics = latest_run.metrics_json if latest_run and latest_run.metrics_json else {}
    return {
        "id": experiment.id,
        "name": experiment.name,
        "description": experiment.description,
        "model_id": experiment.model_id,
        "dataset_name": experiment.dataset_name,
        "status": experiment.status,
        "model_variant": latest_run.config_json.get("model_variant") if latest_run and latest_run.config_json else None,
        "created_by_user_id": experiment.created_by_user_id,
        "created_at": experiment.created_at,
        "updated_at": experiment.updated_at,
        "runs": [_serialize_run(item) for item in sorted(experiment.runs, key=lambda item: item.created_at or datetime.min.replace(tzinfo=timezone.utc), reverse=True)],
        "latest_metrics": latest_metrics,
    }


@router.get("")
def list_experiments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    pagination: dict = Depends(get_pagination),
    status: str | None = Query(default=None),
    model_variant: str | None = Query(default=None),
):
    query = db.query(Experiment)
    if status:
        query = query.filter(Experiment.status == status)
    if model_variant:
        query = query.filter(Experiment.name.ilike(f"%{model_variant}%"))
    items = query.order_by(Experiment.updated_at.desc()).offset((pagination["page"] - 1) * pagination["page_size"]).limit(pagination["page_size"]).all()
    total = query.count()
    return {
        "items": [_serialize_experiment(item) for item in items],
        "total": total,
        "page": pagination["page"],
        "page_size": pagination["page_size"],
        "has_next": (pagination["page"] * pagination["page_size"]) < total,
        "has_previous": pagination["page"] > 1,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_experiment(payload: ExperimentCreateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    status_value = payload.status.upper()
    if status_value not in VALID_STATES:
        raise HTTPException(status_code=400, detail={"status": "invalid_status", "message": f"Status must be one of: {', '.join(sorted(VALID_STATES))}"})

    model_variant = (payload.model_variant or payload.model_name or "Base LLM").strip()
    experiment = Experiment(
        name=payload.name,
        description=payload.description,
        model_id=None,
        dataset_name=payload.dataset_name,
        status=status_value,
        created_by_user_id=current_user.id,
    )
    db.add(experiment)
    db.commit()
    db.refresh(experiment)

    run = ExperimentRun(
        experiment_id=experiment.id,
        model_version_id=None,
        status=status_value,
        config_json={
            "model_name": payload.model_name,
            "dataset_name": payload.dataset_name,
            "model_variant": model_variant,
            "configuration": payload.configuration or {},
            "evaluation_metrics": EVALUATION_METRICS,
        },
        metrics_json=payload.configuration.get("metrics") if isinstance(payload.configuration, dict) and payload.configuration.get("metrics") else {},
        started_at=datetime.now(timezone.utc),
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    return {
        "status": "ok",
        "experiment": _serialize_experiment(experiment),
        "run": _serialize_run(run),
    }


@router.get("/{experiment_id}")
def get_experiment(experiment_id: int = Path(..., gt=0), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if experiment is None:
        raise HTTPException(status_code=404, detail={"status": "not_found", "message": "Experiment not found."})
    return _serialize_experiment(experiment)


@router.post("/{experiment_id}/runs")
def start_run(experiment_id: int = Path(..., gt=0), payload: ExperimentRunRequest = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if experiment is None:
        raise HTTPException(status_code=404, detail={"status": "not_found", "message": "Experiment not found."})

    run = ExperimentRun(
        experiment_id=experiment.id,
        model_version_id=None,
        status="QUEUED",
        config_json={
            "model_name": payload.model_name if payload else None,
            "dataset_name": payload.dataset_name if payload else None,
            "model_variant": payload.model_variant if payload else None,
            "configuration": (payload.configuration if payload else {}) or {},
            "evaluation_metrics": EVALUATION_METRICS,
        },
        metrics_json=(payload.metrics if payload else None) or {},
        started_at=datetime.now(timezone.utc),
    )
    db.add(run)
    experiment.status = "RUNNING"
    db.commit()
    db.refresh(run)
    return {"status": "ok", "run": _serialize_run(run)}


@router.post("/{experiment_id}/runs/{run_id}/evaluate")
def set_run_metrics(
    experiment_id: int = Path(..., gt=0),
    run_id: int = Path(..., gt=0),
    payload: ExperimentUpdateRequest = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if experiment is None:
        raise HTTPException(status_code=404, detail={"status": "not_found", "message": "Experiment not found."})
    run = db.query(ExperimentRun).filter(ExperimentRun.id == run_id, ExperimentRun.experiment_id == experiment.id).first()
    if run is None:
        raise HTTPException(status_code=404, detail={"status": "not_found", "message": "Experiment run not found."})

    if payload and payload.status:
        normalized = payload.status.upper()
        if normalized not in VALID_STATES:
            raise HTTPException(status_code=400, detail={"status": "invalid_status", "message": f"Status must be one of: {', '.join(sorted(VALID_STATES))}"})
        run.status = normalized
        experiment.status = normalized

    if payload and payload.metrics:
        run.metrics_json = {**(run.metrics_json or {}), **payload.metrics}
        for metric_name, metric_value in payload.metrics.items():
            numeric_value = None
            try:
                numeric_value = float(metric_value) if metric_value is not None else None
            except (TypeError, ValueError):
                numeric_value = None
            existing = db.query(EvaluationResult).filter(EvaluationResult.run_id == run.id, EvaluationResult.metric_name == metric_name).first()
            if existing:
                existing.metric_value = str(metric_value) if metric_value is not None else None
                existing.details_json = {"value": metric_value}
            else:
                db.add(EvaluationResult(run_id=run.id, metric_name=metric_name, metric_value=str(metric_value) if metric_value is not None else None, details_json={"value": metric_value}))

    if payload and payload.logs:
        run.config_json = {**(run.config_json or {}), "logs": payload.logs}
    if payload and payload.artifacts:
        run.config_json = {**(run.config_json or {}), "artifacts": payload.artifacts}
    if payload and payload.resource_usage:
        run.config_json = {**(run.config_json or {}), "resource_usage": payload.resource_usage}
    if payload and payload.notes:
        run.config_json = {**(run.config_json or {}), "notes": payload.notes}

    if run.status == "COMPLETED":
        run.finished_at = datetime.now(timezone.utc)
        experiment.status = "COMPLETED"
    elif run.status in {"FAILED", "CANCELLED"}:
        run.finished_at = datetime.now(timezone.utc)
        experiment.status = run.status

    db.commit()
    db.refresh(run)
    return {"status": "ok", "run": _serialize_run(run), "experiment": _serialize_experiment(experiment)}


@router.get("/{experiment_id}/comparison")
def experiment_comparison(experiment_id: int = Path(..., gt=0), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if experiment is None:
        raise HTTPException(status_code=404, detail={"status": "not_found", "message": "Experiment not found."})

    comparison = []
    for variant in MODEL_VARIANTS:
        latest_run = next((run for run in sorted(experiment.runs, key=lambda item: item.created_at or datetime.min.replace(tzinfo=timezone.utc), reverse=True) if (run.config_json or {}).get("model_variant") == variant), None)
        metrics = (latest_run.metrics_json if latest_run else {}) or {}
        comparison.append({
            "variant": variant,
            "status": latest_run.status if latest_run else "Not evaluated yet",
            "metrics": metrics,
            "has_results": bool(latest_run and metrics),
        })

    return {"status": "ok", "comparison": comparison, "proposed_configuration": "RAG + QLoRA"}
