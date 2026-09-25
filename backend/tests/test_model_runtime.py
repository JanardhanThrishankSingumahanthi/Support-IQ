import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app
from app.services.model_runtime import (
    ModelRuntimeService,
    ModelUnavailableError,
    get_model_runtime,
)

client = TestClient(app)
settings = get_settings()


def get_auth_token():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": settings.dev_admin_email, "password": settings.dev_admin_password},
    )
    assert response.status_code == 200
    return response.json()["token"]


def test_model_runtime_normalization():
    runtime = get_model_runtime()
    assert runtime.normalize_variant("SupportIQ QLoRA (4-bit NF4)") == "qlora"
    assert runtime.normalize_variant("QLoRA (Fine-tuned)") == "qlora"
    assert runtime.normalize_variant("SupportIQ LoRA (FP16)") == "lora"
    assert runtime.normalize_variant("RAG + LoRA") == "lora"
    assert runtime.normalize_variant("Base Qwen 0.5B (Zero-Shot RAG)") == "base"
    assert runtime.normalize_variant("Extractive Synthesizer") == "extractive"
    assert runtime.normalize_variant(None) == "qlora"


def test_model_runtime_metadata():
    runtime = get_model_runtime()
    models = runtime.get_models_metadata()
    assert len(models) >= 4
    ids = [m["id"] for m in models]
    assert "qlora" in ids
    assert "lora" in ids
    assert "base" in ids
    assert "extractive" in ids

    qlora_meta = next(m for m in models if m["id"] == "qlora")
    assert qlora_meta["quantization"] == "4-bit NF4"
    assert "reason" in qlora_meta


def test_model_runtime_failure_handling():
    runtime = ModelRuntimeService()
    # Test unknown variant raises error
    with pytest.raises(Exception):
        runtime.load_model("nonexistent_model_variant_xyz")

    # Test unavailable when adapter weights missing
    with patch.object(runtime, "is_model_available", return_value=(False, "Simulated missing weights")):
        with pytest.raises(ModelUnavailableError) as exc_info:
            runtime.load_model("qlora")
        assert "Simulated missing weights" in str(exc_info.value)


def test_chat_models_endpoint():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/v1/chat/models", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "models" in data
    assert any(m["id"] == "qlora" for m in data["models"])


def test_chat_message_with_model_selection():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Test chat with QLoRA
    response = client.post(
        "/api/v1/chat/messages",
        json={
            "content": "What is the warranty coverage for laptop battery?",
            "use_knowledge_base": True,
            "model_name": "SupportIQ QLoRA (4-bit NF4)",
        },
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "assistant_message" in data
    meta = data["assistant_message"]["metadata_json"]
    assert meta["model_variant"] == "qlora"
    assert "generation_latency_ms" in meta


def test_chat_message_unavailable_model_truthful_error():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Simulate model unavailability to verify truthful error state
    with patch("app.api.v1.routers.chat.routes.get_model_runtime") as mock_get_runtime:
        mock_runtime = ModelRuntimeService()
        with patch.object(
            mock_runtime,
            "generate_answer",
            side_effect=ModelUnavailableError("Simulated missing GPU adapter weights"),
        ):
            mock_get_runtime.return_value = mock_runtime

            response = client.post(
                "/api/v1/chat/messages",
                json={
                    "content": "What is the return period?",
                    "use_knowledge_base": True,
                    "model_name": "SupportIQ QLoRA (4-bit NF4)",
                },
                headers=headers,
            )
            assert response.status_code == 200
            data = response.json()
            # Must NOT use extractive synthesizer; must report model_unavailable
            assert data["generation_status"] == "model_unavailable"
            assert "Model Runtime Unavailable" in data["assistant_message"]["content"]
            assert "Simulated missing GPU adapter weights" in data["assistant_message"]["content"]
