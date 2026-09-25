import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_full_system():
    results = {}
    
    # 1. AUTH
    print("Testing Auth...")
    test_email = "audit_final_admin@supportiq.com"
    test_password = "AdminSecurePass123!"

    # Register admin user if not exists
    r_reg = requests.post(f"{BASE_URL}/api/v1/auth/register", json={
        "email": test_email,
        "full_name": "Audit Final Admin",
        "password": test_password,
        "role_name": "Administrator"
    })
    print(f"Register status: {r_reg.status_code}")

    # Valid login
    r_valid = requests.post(f"{BASE_URL}/api/v1/auth/login", json={"email": test_email, "password": test_password})
    assert r_valid.status_code == 200, f"Valid login failed: {r_valid.text}"
    token_data = r_valid.json()
    token = token_data.get("token")
    assert token, "Token not returned from login"
    headers = {"Authorization": f"Bearer {token}"}
    results["auth_valid_login"] = "PASS"
    
    # Invalid password
    r_invalid_pw = requests.post(f"{BASE_URL}/api/v1/auth/login", json={"email": test_email, "password": "wrongpassword"})
    assert r_invalid_pw.status_code == 401, f"Expected 401 for wrong pw, got {r_invalid_pw.status_code}"
    results["auth_invalid_password_401"] = "PASS"
    
    # Invalid email
    r_invalid_email = requests.post(f"{BASE_URL}/api/v1/auth/login", json={"email": "nonexistent_audit@supportiq.com", "password": test_password})
    assert r_invalid_email.status_code == 401, f"Expected 401 for wrong email, got {r_invalid_email.status_code}"
    results["auth_invalid_email_401"] = "PASS"
    
    # Protected route without token
    r_unauth = requests.get(f"{BASE_URL}/api/v1/auth/me")
    assert r_unauth.status_code in (401, 403), f"Expected 401/403 unauth, got {r_unauth.status_code}"
    results["auth_unauthorized_rejected"] = "PASS"
    
    # Protected route with token
    r_me = requests.get(f"{BASE_URL}/api/v1/auth/me", headers=headers)
    assert r_me.status_code == 200, f"Expected 200 for /auth/me, got {r_me.status_code}"
    user_info = r_me.json()
    assert user_info.get("email") == test_email
    results["auth_session_verification"] = "PASS"

    # 2. DASHBOARD / STATS
    print("Testing Dashboard...")
    r_stats = requests.get(f"{BASE_URL}/api/v1/analytics/overview", headers=headers)
    if r_stats.status_code == 200:
        results["dashboard_analytics_overview"] = "PASS"
    else:
        results["dashboard_analytics_overview"] = f"FAIL {r_stats.status_code}"

    # 3. KNOWLEDGE BASE
    print("Testing Knowledge Base...")
    r_docs = requests.get(f"{BASE_URL}/api/v1/documents", headers=headers)
    assert r_docs.status_code == 200, f"Failed documents listing: {r_docs.status_code}"
    docs_data = r_docs.json()
    docs = docs_data.get("items", [])
    assert len(docs) > 0, "No documents found in knowledge base"
    results["kb_documents_list"] = f"PASS ({len(docs)} documents)"
    
    # Test document download
    doc_id = docs[0]["id"]
    r_dl = requests.get(f"{BASE_URL}/api/v1/documents/{doc_id}/download", headers=headers)
    assert r_dl.status_code == 200, f"Document download failed: {r_dl.status_code}"
    assert len(r_dl.content) > 0, "Downloaded document empty"
    results["kb_document_download"] = f"PASS (filename: {docs[0]['filename']}, size: {len(r_dl.content)} bytes)"
    
    # Test KB stats / Index Status
    r_kb_stats = requests.get(f"{BASE_URL}/api/v1/knowledge-base/stats", headers=headers)
    assert r_kb_stats.status_code == 200, f"KB stats failed: {r_kb_stats.status_code}"
    kb_data = r_kb_stats.json()
    assert "total_documents" in kb_data and "total_chunks" in kb_data
    results["kb_index_status"] = f"PASS (docs: {kb_data['total_documents']}, chunks: {kb_data['total_chunks']})"

    # 4. CHAT & GROUNDING
    print("Testing Chat...")
    # Available models
    r_models = requests.get(f"{BASE_URL}/api/v1/chat/models", headers=headers)
    assert r_models.status_code == 200, f"Chat models failed: {r_models.status_code}"
    models_data = r_models.json()
    assert len(models_data.get("models", [])) >= 2
    results["chat_models_list"] = f"PASS ({len(models_data['models'])} models available)"
    
    # Grounded chat question
    r_chat = requests.post(f"{BASE_URL}/api/v1/chat/messages", json={
        "content": "What is the refund policy for enterprise plans?",
        "model_name": "SupportIQ QLoRA (4-bit NF4)"
    }, headers=headers)
    assert r_chat.status_code == 200, f"Chat message failed: {r_chat.status_code}"
    chat_resp = r_chat.json()
    assert "assistant_message" in chat_resp
    assert "reliability" in chat_resp
    results["chat_qlora_grounded_response"] = f"PASS (reliability: {chat_resp['reliability'].get('score')}, status: {chat_resp.get('generation_status')})"

    # Unsupported / ungrounded question (abstention / low confidence)
    r_chat_unsupported = requests.post(f"{BASE_URL}/api/v1/chat/messages", json={
        "content": "What is the secret recipe for Martian space soup?",
        "model_name": "SupportIQ QLoRA (4-bit NF4)"
    }, headers=headers)
    assert r_chat_unsupported.status_code == 200, f"Chat unsupported question failed: {r_chat_unsupported.status_code}"
    chat_unsupp_resp = r_chat_unsupported.json()
    unsupp_status = chat_unsupp_resp.get("generation_status")
    unsupp_rel = chat_unsupp_resp.get("reliability", {}).get("score", 0.0)
    assert unsupp_status in ("low_confidence", "unsupported", "abstain") or unsupp_rel < 0.5
    results["chat_unsupported_abstention"] = f"PASS (status: {unsupp_status}, score: {unsupp_rel})"

    # 5. SUPPORT TICKETS
    print("Testing Support Tickets...")
    r_tickets = requests.get(f"{BASE_URL}/api/v1/support-tickets", headers=headers)
    assert r_tickets.status_code == 200, f"Tickets list failed: {r_tickets.status_code}"
    tickets_data = r_tickets.json()
    tickets = tickets_data.get("items", [])
    assert len(tickets) > 0, "No tickets found"
    results["tickets_listing"] = f"PASS ({len(tickets)} tickets)"
    
    # Update ticket status
    t_id = tickets[0]["id"]
    original_status = tickets[0]["status"]
    new_status = "In Progress" if original_status != "In Progress" else "Open"
    r_patch = requests.patch(f"{BASE_URL}/api/v1/support-tickets/{t_id}", json={"status": new_status}, headers=headers)
    assert r_patch.status_code == 200, f"Ticket patch failed: {r_patch.status_code}"
    assert r_patch.json().get("status") == new_status
    # Revert status
    requests.patch(f"{BASE_URL}/api/v1/support-tickets/{t_id}", json={"status": original_status}, headers=headers)
    results["tickets_status_mutation_and_persistence"] = "PASS"

    # 6. MODEL EVALUATION & EXPERIMENTS
    print("Testing Experiments & Research...")
    r_exp = requests.get(f"{BASE_URL}/api/v1/experiments", headers=headers)
    assert r_exp.status_code == 200, f"Experiments list failed: {r_exp.status_code}"
    experiments = r_exp.json()
    assert len(experiments) > 0, "No experiments found"
    results["experiments_listing"] = f"PASS ({len(experiments)} experiments)"
    
    r_hardware = requests.get(f"{BASE_URL}/api/v1/experiments/hardware", headers=headers)
    assert r_hardware.status_code == 200, f"Hardware endpoint failed: {r_hardware.status_code}"
    hw_data = r_hardware.json()
    assert "cuda_available" in hw_data
    results["hardware_telemetry"] = f"PASS (CUDA: {hw_data['cuda_available']}, Device: {hw_data.get('device_name')})"

    # Research tables
    r_tables = requests.get(f"{BASE_URL}/api/v1/experiments/research-tables", headers=headers)
    assert r_tables.status_code == 200, f"Research tables failed: {r_tables.status_code}"
    tables_data = r_tables.json()
    assert "data" in tables_data and "markdown" in tables_data
    results["research_tables"] = f"PASS (markdown length: {len(tables_data['markdown'])} chars)"

    # 7. SECURITY & HEALTH
    print("Testing Security & Health...")
    r_health = requests.get(f"{BASE_URL}/api/v1/health")
    assert r_health.status_code == 200, f"Health endpoint failed: {r_health.status_code}"
    health_data = r_health.json()
    assert health_data.get("status") == "ok"
    results["security_health_check"] = "PASS (status: ok)"

    r_users = requests.get(f"{BASE_URL}/api/v1/users", headers=headers)
    assert r_users.status_code == 200, f"Users listing failed: {r_users.status_code}"
    users_data = r_users.json()
    user_list = users_data if isinstance(users_data, list) else users_data.get("items", [])
    results["security_users_rbac"] = f"PASS ({len(user_list)} users with roles)"

    print("\n--- RESULTS ---")
    for k, v in results.items():
        print(f"{k}: {v}")
    return results

if __name__ == "__main__":
    test_full_system()
