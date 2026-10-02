from __future__ import annotations

import logging
import os
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

from health import get_gpu_telemetry
from model_server import get_gpu_model_server

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("supportiq_gpu_inference")

API_KEY_ENV_NAME = "SUPPORTIQ_INFERENCE_API_KEY"

app = FastAPI(
    title="SupportIQ GPU Inference Service",
    description="High-performance cloud GPU inference endpoint for Qwen2.5-0.5B, LoRA, and 4-bit NF4 QLoRA.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def verify_api_key(
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
    authorization: str | None = Header(default=None),
) -> str:
    """Verifies that the request provides a valid SUPPORTIQ_INFERENCE_API_KEY."""
    expected_key = os.environ.get(API_KEY_ENV_NAME)
    if not expected_key:
        # If no key configured in environment, warn and reject for security
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Inference API key not configured on GPU server. Set SUPPORTIQ_INFERENCE_API_KEY.",
        )

    provided_key = None
    if x_api_key:
        provided_key = x_api_key.strip()
    elif authorization and authorization.lower().startswith("bearer "):
        provided_key = authorization[7:].strip()

    if not provided_key or provided_key != expected_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing inference API key.",
        )
    return provided_key


class GenerateRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    model: str = Field(default="qlora", description="Model variant: 'qlora', 'lora', or 'base'")
    query: str = Field(..., min_length=1, max_length=12000, description="Customer question")
    context: str | None = Field(default=None, description="Pre-formatted verified context text")
    context_chunks: list[dict[str, Any]] | None = Field(
        default=None, description="Structured verified evidence chunks from RAG retrieval"
    )
    max_new_tokens: int = Field(default=96, ge=1, le=512)
    temperature: float = Field(default=0.0, ge=0.0, le=1.0)


class GenerateResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    success: bool
    model: str
    model_display_name: str
    answer: str
    device: str
    gpu: str
    cuda_available: bool
    latency_seconds: float
    latency_ms: float
    peak_vram_gb: float | None = None


@app.get("/health")
def health() -> dict[str, Any]:
    """Exposes GPU inference service health and basic CUDA status."""
    telemetry = get_gpu_telemetry()
    return {
        "status": "ok",
        "service": "supportiq-gpu-inference",
        "cuda_available": telemetry["cuda_available"],
        "device": telemetry["device"],
        "gpu_name": telemetry["gpu_name"],
        "vram_total_gb": telemetry.get("vram_total_gb", 0.0),
        "vram_allocated_gb": telemetry.get("vram_allocated_gb", 0.0),
    }


@app.get("/models")
def list_models() -> dict[str, Any]:
    """Returns available models metadata."""
    server = get_gpu_model_server()
    return {"models": server.get_models_metadata()}


@app.get("/runtime")
def runtime_telemetry() -> dict[str, Any]:
    """Returns deep hardware and environment telemetry."""
    return get_gpu_telemetry()


@app.post("/generate", response_model=GenerateResponse)
def generate(
    request: GenerateRequest,
    _auth: str = Depends(verify_api_key),
):
    """Executes real GPU neural generation with grounded support context."""
    server = get_gpu_model_server()

    # Build context string from context_chunks if context not passed directly
    context_text = request.context
    if not context_text:
        if request.context_chunks:
            context_text = "\n---\n".join(
                f"[Doc {c.get('document_id', '?')} Chunk {c.get('chunk_id', '?')}]: {c.get('content', '').strip()}"
                for c in request.context_chunks[:4]
            )
        else:
            context_text = ""

    try:
        result = server.generate(
            query=request.query,
            context=context_text,
            model_variant=request.model,
            max_new_tokens=request.max_new_tokens,
            temperature=request.temperature,
        )
        return result
    except Exception as exc:
        logger.error("Generation failed for model '%s': %s", request.model, exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"GPU generation failed: {str(exc)}",
        )


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)
