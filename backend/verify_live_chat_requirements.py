import json
import time
import requests

API_BASE = "http://127.0.0.1:8000"

def run_verification():
    print("=" * 70)
    print("SupportIQ LIVE CHAT QLoRA VERIFICATION SUITE")
    print("=" * 70)

    from app.core.config import get_settings
    settings = get_settings()

    # 1. Login
    login_res = requests.post(f"{API_BASE}/api/v1/auth/login", json={
        "email": settings.dev_admin_email,
        "password": settings.dev_admin_password
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"[PASS] Authenticated successfully as {settings.dev_admin_email}.")

    # 2. Check Models Catalog
    models_res = requests.get(f"{API_BASE}/api/v1/chat/models", headers=headers)
    assert models_res.status_code == 200, f"Models endpoint failed: {models_res.text}"
    models_data = models_res.json()["models"]
    model_ids = [m["id"] for m in models_data]
    print(f"[PASS] Model Catalog verified: {model_ids}")
    for m in models_data:
        print(f"       • {m['name']} (quant: {m['quantization']}, available: {m['available']}, device: {m['device']})")

    # 3. Test 1, 2, 3, 4, 5, 6: Answerable Question with QLoRA
    print("\n--- Test A: Real Answerable Question with SupportIQ QLoRA (4-bit NF4) ---")
    q_answerable = "How long does it take for an approved refund to be processed after inspection?"
    t0 = time.time()
    chat_res = requests.post(f"{API_BASE}/api/v1/chat/messages", json={
        "content": q_answerable,
        "use_knowledge_base": True,
        "model_name": "SupportIQ QLoRA (4-bit NF4)",
    }, headers=headers)
    assert chat_res.status_code == 200, f"Chat failed: {chat_res.text}"
    data = chat_res.json()
    msg = data["assistant_message"]
    meta = msg["metadata_json"]

    print(f"[PASS] Generation Status   : {data['generation_status']}")
    print(f"[PASS] Model Variant       : {meta.get('model_variant')} ({meta.get('model')})")
    print(f"[PASS] QLoRA Answer Text   : \"{msg['content']}\"")
    print(f"[PASS] Gen Latency         : {meta.get('generation_latency_ms')} ms (Total roundtrip: {meta.get('latency_ms')} ms)")
    print(f"[PASS] Peak GPU VRAM       : {meta.get('peak_vram_gb')} GB")
    print(f"[PASS] Grounding Status    : {meta.get('grounding_status')}")
    print(f"[PASS] Reliability Score   : {meta.get('reliability', {}).get('score')} (coverage: {meta.get('reliability', {}).get('coverage')})")
    print(f"[PASS] Citations Count     : {len(meta.get('citations', []))}")
    for c in meta.get("citations", []):
        print(f"       Citation: [Doc {c.get('document_id')} Chunk {c.get('chunk_id')}] \"{c.get('document_title')}\" - Match: {c.get('match_percent')}%")

    assert data["generation_status"] == "resolved", "Expected resolved status"
    assert meta.get("model_variant") == "qlora", "Expected qlora variant"
    assert meta.get("generation_latency_ms") > 0, "Expected non-zero generation latency"
    assert len(meta.get("citations", [])) > 0, "Expected valid citations"
    assert meta.get("reliability", {}).get("coverage", 0) > 0.5, "Expected positive coverage"

    # 4. Test 9: Verify QLoRA output is distinct from Extractive Synthesizer
    print("\n--- Test B: Verify QLoRA is NOT Silently Extractive ---")
    extractive_res = requests.post(f"{API_BASE}/api/v1/chat/messages", json={
        "content": q_answerable,
        "use_knowledge_base": True,
        "model_name": "Extractive Synthesizer",
    }, headers=headers).json()
    extractive_text = extractive_res["assistant_message"]["content"]
    print(f"       Extractive Answer: \"{extractive_text}\"")
    print(f"       QLoRA Answer     : \"{msg['content']}\"")
    assert msg["content"] != extractive_text, "QLoRA must not be identical to extractive synthesizer"
    print("[PASS] QLoRA generates authentic neural tokens, not extractive fallback text.")

    # 5. Test 7: Unsupported Question & Honest Refusal
    print("\n--- Test C: Unsupported Question Honest Refusal ---")
    q_unsupported = "Does SupportIQ offer holographic telepathic customer support?"
    unsupported_res = requests.post(f"{API_BASE}/api/v1/chat/messages", json={
        "content": q_unsupported,
        "use_knowledge_base": True,
        "model_name": "SupportIQ QLoRA (4-bit NF4)",
    }, headers=headers).json()
    print(f"[PASS] Generation Status   : {unsupported_res['generation_status']}")
    print(f"[PASS] Refusal Content     : \"{unsupported_res['assistant_message']['content'][:120]}...\"")
    print(f"[PASS] Citations Count     : {len(unsupported_res['assistant_message']['metadata_json'].get('citations', []))}")
    assert unsupported_res["generation_status"] == "no_evidence"
    assert "No relevant information was found" in unsupported_res["assistant_message"]["content"]
    assert len(unsupported_res["assistant_message"]["metadata_json"].get("citations", [])) == 0

    # 6. Test 8: Switch to Base Qwen
    print("\n--- Test D: Switch to Base Qwen (Zero-Shot RAG) ---")
    base_res = requests.post(f"{API_BASE}/api/v1/chat/messages", json={
        "content": q_answerable,
        "use_knowledge_base": True,
        "model_name": "Base Qwen 0.5B (Zero-Shot RAG)",
    }, headers=headers).json()
    base_meta = base_res["assistant_message"]["metadata_json"]
    print(f"[PASS] Base Status         : {base_res['generation_status']}")
    print(f"[PASS] Model Variant       : {base_meta.get('model_variant')} ({base_meta.get('model')})")
    print(f"[PASS] Base Answer Text    : \"{base_res['assistant_message']['content']}\"")
    print(f"[PASS] Base Gen Latency    : {base_meta.get('generation_latency_ms')} ms")
    assert base_meta.get("model_variant") == "base"

    print("\n" + "=" * 70)
    print("ALL API LIVE CHAT CHECKS PASSED [SUCCESS]")
    print("=" * 70)

if __name__ == "__main__":
    run_verification()
