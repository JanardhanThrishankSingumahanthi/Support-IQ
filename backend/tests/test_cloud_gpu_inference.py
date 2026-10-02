from __future__ import annotations

import os
import sys
from pathlib import Path
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

import importlib.util

# Add gpu-inference directory to sys.path for importing the standalone GPU service
REPO_ROOT = Path(__file__).resolve().parents[2]
GPU_INFERENCE_DIR = REPO_ROOT / "gpu-inference"
if str(GPU_INFERENCE_DIR) not in sys.path:
    sys.path.insert(0, str(GPU_INFERENCE_DIR))

spec = importlib.util.spec_from_file_location("gpu_inference_service", GPU_INFERENCE_DIR / "app.py")
gpu_app_module = importlib.util.module_from_spec(spec)
sys.modules["gpu_inference_service"] = gpu_app_module
spec.loader.exec_module(gpu_app_module)

from app.core.config import Settings
from app.services.model_runtime import ModelRuntimeService, ModelUnavailableError


@pytest.fixture
def gpu_test_client():
    os.environ["SUPPORTIQ_INFERENCE_API_KEY"] = "test-secret-cloud-gpu-key-2026"
    client = TestClient(gpu_app_module.app)
    return client


def test_gpu_service_health_and_runtime_endpoints(gpu_test_client):
    """Verifies that the standalone GPU inference service exposes health and hardware telemetry."""
    res_health = gpu_test_client.get("/health")
    assert res_health.status_code == 200
    data_health = res_health.json()
    assert data_health["status"] == "ok"
    assert data_health["service"] == "supportiq-gpu-inference"
    assert "cuda_available" in data_health
    assert "device" in data_health
    assert "gpu_name" in data_health

    res_models = gpu_test_client.get("/models")
    assert res_models.status_code == 200
    data_models = res_models.json()
    assert "models" in data_models
    model_ids = [m["id"] for m in data_models["models"]]
    assert "qlora" in model_ids
    assert "lora" in model_ids
    assert "base" in model_ids

    res_runtime = gpu_test_client.get("/runtime")
    assert res_runtime.status_code == 200
    data_runtime = res_runtime.json()
    assert "cuda_available" in data_runtime
    assert "device" in data_runtime


def test_gpu_service_authentication_enforcement(gpu_test_client):
    """Verifies that POST /generate strictly enforces API key authentication."""
    payload = {
        "model": "qlora",
        "query": "What is the return period?",
        "context": "Annual subscriptions may be refunded within 14 days of purchase.",
    }

    # 1. Missing API Key
    res_no_key = gpu_test_client.post("/generate", json=payload)
    assert res_no_key.status_code == 401
    assert "Invalid or missing inference API key" in res_no_key.json()["detail"]

    # 2. Invalid API Key
    res_bad_key = gpu_test_client.post(
        "/generate",
        json=payload,
        headers={"X-API-Key": "wrong-secret-token"},
    )
    assert res_bad_key.status_code == 401

    # 3. Valid API Key via X-API-Key header
    res_valid_header = gpu_test_client.post(
        "/generate",
        json=payload,
        headers={"X-API-Key": "test-secret-cloud-gpu-key-2026"},
    )
    assert res_valid_header.status_code == 200
    data = res_valid_header.json()
    assert data["success"] is True
    assert data["model"] == "qlora"
    assert len(data["answer"]) > 0
    assert data["latency_seconds"] > 0
    assert data["latency_ms"] > 0

    # 4. Valid API Key via Bearer Authorization header
    res_bearer = gpu_test_client.post(
        "/generate",
        json=payload,
        headers={"Authorization": "Bearer test-secret-cloud-gpu-key-2026"},
    )
    assert res_bearer.status_code == 200
    assert res_bearer.json()["success"] is True


def test_model_runtime_cloud_gpu_client_integration(gpu_test_client):
    """Verifies that SupportIQ ModelRuntimeService forwards requests to Cloud GPU when configured."""
    mock_settings = Settings(
        supportiq_inference_url="http://test-gpu-cloud.local:8001",
        supportiq_inference_api_key="test-secret-cloud-gpu-key-2026",
    )

    with patch("app.services.model_runtime.get_settings", return_value=mock_settings):
        runtime = ModelRuntimeService()
        assert runtime.is_cloud_inference_configured is True

        import httpx

        # Mock the remote HTTP transport by invoking the GPU app handlers directly
        def mock_post(*args, **kwargs):
            headers = kwargs.get("headers") or {}
            key = headers.get("X-API-Key")
            if key != "test-secret-cloud-gpu-key-2026":
                return httpx.Response(401, json={"detail": "Invalid or missing inference API key."})
            json_payload = kwargs.get("json") or {}
            req = gpu_app_module.GenerateRequest(**json_payload)
            res_dict = gpu_app_module.generate(req, _auth=key)
            return httpx.Response(200, json=res_dict)

        def mock_get(*args, **kwargs):
            models_data = gpu_app_module.list_models()
            return httpx.Response(200, json=models_data)

        with patch("httpx.Client.post", side_effect=mock_post), \
             patch("httpx.Client.get", side_effect=mock_get):

            # Check availability
            avail, reason = runtime.is_model_available("qlora")
            assert avail is True, f"Failed with reason: {reason}"
            assert "Cloud GPU" in reason

            # Check generation
            context_chunks = [
                {
                    "document_id": 1,
                    "chunk_id": 10,
                    "content": "Refund requests are typically processed within 5-7 business days to the original payment method.",
                }
            ]
            result = runtime.generate_answer(
                query="How many days does a refund take?",
                context_chunks=context_chunks,
                model_variant="qlora",
                max_new_tokens=48,
            )
            assert result["status"] == "resolved"
            assert "5-7" in result["answer"] or "refund" in result["answer"].lower()
            assert result["latency_ms"] > 0
            assert "qlora" in result["model_variant"].lower()


def test_model_runtime_handles_cloud_gpu_failure_truthfully():
    """Verifies that Cloud GPU network timeouts or errors raise ModelUnavailableError without silent fallback."""
    mock_settings = Settings(
        supportiq_inference_url="https://unreachable-gpu-service.example.com",
        supportiq_inference_api_key="secret",
    )

    with patch("app.services.model_runtime.get_settings", return_value=mock_settings):
        runtime = ModelRuntimeService()
        assert runtime.is_cloud_inference_configured is True

        import httpx
        with patch("httpx.Client.post", side_effect=httpx.ConnectError("Connection refused")):
            with pytest.raises(ModelUnavailableError) as exc_info:
                runtime.generate_answer(
                    query="What is the return period?",
                    context_chunks=[{"document_id": 1, "chunk_id": 1, "content": "Refunds within 14 days."}],
                    model_variant="qlora",
                )
            assert "Unable to reach Cloud GPU inference service" in str(exc_info.value)


def test_cloud_gpu_chat_pipeline_e2e():
    """
    End-to-End Test: RAG + Hybrid Retrieval + RRF + Cloud GPU QLoRA Inference + Grounding + Citations.
    Verifies that live chat messages use Cloud GPU generation when configured,
    and safely refuse without GPU invocation when evidence is missing.
    """
    from fastapi.testclient import TestClient
    from app.main import app

    test_client = TestClient(app)

    # 1. Login
    login_res = test_client.post(
        "/api/v1/auth/login",
        json={"email": "janardhan@supportiq.com", "password": "SupportIQ2026!"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Configure Cloud GPU settings and mock transport
    mock_settings = Settings(
        supportiq_inference_url="http://cloud-gpu.internal:8001",
        supportiq_inference_api_key="test-secret-cloud-gpu-key-2026",
    )

    def mock_generate_remote(self, query, context_chunks, model_variant, max_new_tokens):
        context_text = "\n---\n".join(
            f"[Doc {c.get('document_id', '?')} Chunk {c.get('chunk_id', '?')}]: {c.get('content', '').strip()}"
            for c in context_chunks[:4]
        )
        server = gpu_app_module.get_gpu_model_server()
        return server.generate(
            query=query,
            context=context_text,
            model_variant=model_variant,
            max_new_tokens=max_new_tokens,
        )

    with patch("app.services.model_runtime.get_settings", return_value=mock_settings), \
         patch.object(ModelRuntimeService, "_generate_remote", side_effect=mock_generate_remote, autospec=True):

        # A. Query answerable with Return Policy
        answerable_res = test_client.post(
            "/api/v1/chat/messages",
            json={
                "content": "What is the refund policy for annual subscriptions?",
                "use_knowledge_base": True,
                "model_name": "SupportIQ QLoRA (4-bit NF4)",
            },
            headers=headers,
        )
        assert answerable_res.status_code == 200
        a_data = answerable_res.json()
        assert a_data["generation_status"] == "resolved"
        assert len(a_data["citations"]) > 0
        assert a_data["citations"][0]["document_title"] == "Return_Policy.pdf"
        assert a_data["reliability"]["score"] >= 0.40
        assert "14" in a_data["assistant_message"]["content"]

        # B. Query unanswerable (Cancellation when no cancellation document exists) -> safe refusal
        unanswerable_res = test_client.post(
            "/api/v1/chat/messages",
            json={
                "content": "How do I cancel my annual subscription?",
                "use_knowledge_base": True,
                "model_name": "SupportIQ QLoRA (4-bit NF4)",
            },
            headers=headers,
        )
        assert unanswerable_res.status_code == 200
        u_data = unanswerable_res.json()
        assert u_data["generation_status"] == "no_evidence"
        assert len(u_data["citations"]) == 0
        assert "No relevant information was found" in u_data["assistant_message"]["content"]
