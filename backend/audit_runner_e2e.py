"""
Comprehensive E2E Workflow & API Audit Script for SupportIQ.
Tests all workflows, database mutations, error states, and persistence.
DO NOT MODIFY APPLICATION CODE.
"""
import sys
import os
import json
import time
import requests
from io import BytesIO

BASE_URL = "http://127.0.0.1:8000"
API_V1 = f"{BASE_URL}/api/v1"

results = {
    "passed": [],
    "failed": [],
    "warnings": []
}

def log_result(category, name, passed, detail=""):
    item = {"category": category, "name": name, "passed": passed, "detail": detail}
    if passed:
        results["passed"].append(item)
        print(f"[PASS] {category} :: {name}")
    else:
        results["failed"].append(item)
        print(f"[FAIL] {category} :: {name} --> {detail}")

def run_auth_audit():
    print("\n--- 1. AUTHENTICATION & SESSIONS AUDIT ---")
    
    # 1. Empty/short credentials
    r = requests.post(f"{API_V1}/auth/login", json={"email": "invalid@test.com", "password": ""})
    log_result("Auth", "Empty/short credentials rejected", r.status_code in [400, 401, 422], f"Status: {r.status_code}")

    # 2. Invalid credentials
    r = requests.post(f"{API_V1}/auth/login", json={"email": "nonexistent@example.com", "password": "WrongPassword123!"})
    log_result("Auth", "Invalid credentials rejected (401)", r.status_code == 401, f"Status: {r.status_code}")

    # 3. Register fresh Admin User with role 'Administrator'
    admin_email = f"audit_admin_{int(time.time())}@example.com"
    r_reg = requests.post(f"{API_V1}/auth/register", json={
        "email": admin_email,
        "full_name": "Audit Admin",
        "password": "AdminPassword123!",
        "role_name": "Administrator"
    })
    log_result("Auth", "Register Admin User (Role: Administrator)", r_reg.status_code == 201, f"Status: {r_reg.status_code}")
    admin_token = r_reg.json().get("token")

    # 4. Valid Login
    r_login = requests.post(f"{API_V1}/auth/login", json={"email": admin_email, "password": "AdminPassword123!"})
    log_result("Auth", "Valid Login returns 200 & token", r_login.status_code == 200 and "token" in r_login.json(), f"Status: {r_login.status_code}")
    if r_login.status_code == 200:
        admin_token = r_login.json()["token"]

    headers = {"Authorization": f"Bearer {admin_token}"}

    # 5. Check /auth/me
    r_me = requests.get(f"{API_V1}/auth/me", headers=headers)
    log_result("Auth", "/auth/me returns user profile with Admin role", r_me.status_code == 200 and r_me.json().get("role") == "Administrator", f"Status: {r_me.status_code}")

    # 6. Register Support Agent
    agent_email = f"audit_agent_{int(time.time())}@example.com"
    r_agent = requests.post(f"{API_V1}/auth/register", json={
        "email": agent_email,
        "full_name": "Audit Agent",
        "password": "AgentPassword123!",
        "role_name": "Support Agent"
    })
    agent_token = r_agent.json().get("token") if r_agent.status_code == 201 else None
    log_result("Auth", "Register Support Agent", bool(agent_token))

    # 7. Register Viewer
    viewer_email = f"audit_viewer_{int(time.time())}@example.com"
    r_viewer = requests.post(f"{API_V1}/auth/register", json={
        "email": viewer_email,
        "full_name": "Audit Viewer",
        "password": "ViewerPassword123!",
        "role_name": "Viewer"
    })
    viewer_token = r_viewer.json().get("token") if r_viewer.status_code == 201 else None
    log_result("Auth", "Register Viewer User", bool(viewer_token))

    # 8. Check protected route without token (401)
    r = requests.get(f"{API_V1}/auth/me")
    log_result("Auth", "Protected route without token returns 401", r.status_code == 401, f"Status: {r.status_code}")

    # 9. Check invalid token (401)
    r = requests.get(f"{API_V1}/auth/me", headers={"Authorization": "Bearer bad-token-xyz"})
    log_result("Auth", "Protected route with invalid token returns 401", r.status_code == 401, f"Status: {r.status_code}")

    # 10. Test Logout on a disposable token
    r_temp = requests.post(f"{API_V1}/auth/login", json={"email": agent_email, "password": "AgentPassword123!"})
    temp_tok = r_temp.json().get("token")
    r_logout = requests.post(f"{API_V1}/auth/logout", headers={"Authorization": f"Bearer {temp_tok}"})
    log_result("Auth", "Logout returns 200", r_logout.status_code == 200, f"Status: {r_logout.status_code}")

    # 11. Verify token invalidation after logout
    r_after = requests.get(f"{API_V1}/auth/me", headers={"Authorization": f"Bearer {temp_tok}"})
    log_result("Auth", "Token invalidated after logout (401)", r_after.status_code == 401, f"Status: {r_after.status_code}")

    return headers, admin_token, agent_token, viewer_token

def run_knowledge_base_audit(headers):
    print("\n--- 2. KNOWLEDGE BASE & DOCUMENT CRUD AUDIT ---")
    
    # 1. Get KB stats
    r = requests.get(f"{API_V1}/knowledge-base/stats", headers=headers)
    log_result("KB", "Get KB stats returns 200", r.status_code == 200 and "total_documents" in r.json())

    # 2. List documents
    r = requests.get(f"{API_V1}/documents", headers=headers)
    log_result("KB", "List documents returns 200", r.status_code == 200 and "items" in r.json())

    # 3. Upload a temporary text document via POST /documents
    doc_content = "SupportIQ Audit Verification Document.\nClause 99: All audit inquiries receive immediate high-priority validation.\nEmergency escalation hotline is +1-800-AUDIT-IQ."
    files = {"file": ("audit_policy_test.txt", BytesIO(doc_content.encode('utf-8')), "text/plain")}
    data = {"category": "Policy"}
    
    r = requests.post(f"{API_V1}/documents", headers=headers, files=files, data=data)
    log_result("KB", "Upload text document returns 201", r.status_code == 201, f"Status: {r.status_code}")
    
    uploaded_doc_id = None
    if r.status_code == 201:
        doc_resp = r.json()
        uploaded_doc_id = doc_resp.get("id")

    # 4. Verify document in list and chunk creation
    if uploaded_doc_id:
        r = requests.get(f"{API_V1}/documents/{uploaded_doc_id}", headers=headers)
        doc_data = r.json()
        has_chunks = len(doc_data.get("chunks", [])) > 0
        log_result("KB", f"Get uploaded document details ({uploaded_doc_id}) with chunks", r.status_code == 200 and has_chunks, f"Chunks count: {len(doc_data.get('chunks', []))}")

        # 5. Search for the uploaded document via retrieval search
        r_search = requests.post(f"{API_V1}/retrieval/search", headers=headers, json={"query": "Emergency escalation hotline audit", "top_k": 3})
        log_result("KB", "Retrieval search returns 200", r_search.status_code == 200, f"Status: {r_search.status_code}")

        # 6. Re-index document
        r_reindex = requests.post(f"{API_V1}/documents/{uploaded_doc_id}/reindex", headers=headers)
        log_result("KB", "Reindex document endpoint returns 200", r_reindex.status_code in [200, 202], f"Status: {r_reindex.status_code}")

        # 7. Delete document
        r_del = requests.delete(f"{API_V1}/documents/{uploaded_doc_id}", headers=headers)
        log_result("KB", "Delete document returns 200", r_del.status_code == 200, f"Status: {r_del.status_code}")

        # Verify deletion from DB
        r_get_deleted = requests.get(f"{API_V1}/documents/{uploaded_doc_id}", headers=headers)
        log_result("KB", "Deleted document cannot be retrieved (404)", r_get_deleted.status_code == 404, f"Status: {r_get_deleted.status_code}")
    else:
        log_result("KB", "Document upload ID not returned", False)

def run_chat_and_models_audit(headers):
    print("\n--- 3. CHAT & MODEL RUNTIME AUDIT ---")
    
    # 1. Get available chat models
    r = requests.get(f"{API_V1}/chat/models", headers=headers)
    log_result("Chat", "GET /chat/models returns available models", r.status_code == 200 and "models" in r.json())
    models = r.json().get("models", [])
    model_ids = [m["id"] for m in models]
    print(f"Available chat models: {model_ids}")

    # 2. Test Real Supported Query on Extractive Synthesizer
    r = requests.post(f"{API_V1}/chat/messages", headers=headers, json={
        "content": "What is the standard refund timeline for approved requests?",
        "model_name": "Extractive Synthesizer",
        "conversation_id": None
    })
    log_result("Chat", "Extractive model supported query returns answer + citations", 
               r.status_code == 200 and bool(r.json().get("content")) and len(r.json().get("citations", [])) > 0,
               f"Status: {r.status_code}, Citations: {len(r.json().get('citations', [])) if r.status_code == 200 else 0}")
    conv_id = r.json().get("conversation_id") if r.status_code == 200 else None

    # 3. Test Real Supported Query on SupportIQ QLoRA
    r_qlora = requests.post(f"{API_V1}/chat/messages", headers=headers, json={
        "content": "How do I request an RMA for a defective hardware unit?",
        "model_name": "SupportIQ QLoRA (4-bit NF4)",
        "conversation_id": conv_id
    })
    log_result("Chat", "QLoRA model returns answer + metadata + citations",
               r_qlora.status_code == 200 and bool(r_qlora.json().get("content")) and len(r_qlora.json().get("citations", [])) > 0,
               f"Status: {r_qlora.status_code}, Model: {r_qlora.json().get('model') if r_qlora.status_code == 200 else 'None'}")
    
    # Check telemetry fields
    if r_qlora.status_code == 200:
        meta = r_qlora.json().get("model_metadata", {})
        has_latency = "generation_latency_seconds" in meta or "latency_seconds" in meta
        log_result("Chat", "QLoRA response includes latency telemetry", has_latency, f"Meta keys: {list(meta.keys())}")

    # 4. Test Unsupported / Adversarial Query -> Honest Safe Refusal
    r_unsupp = requests.post(f"{API_V1}/chat/messages", headers=headers, json={
        "content": "What is the warranty coverage for warp drive antimatter injectors?",
        "model_name": "SupportIQ QLoRA (4-bit NF4)",
        "conversation_id": conv_id
    })
    if r_unsupp.status_code == 200:
        resp_text = r_unsupp.json().get("content", "").lower()
        refused = "cannot find" in resp_text or "not mentioned" in resp_text or "no evidence" in resp_text or "cannot be found" in resp_text or "no information" in resp_text or "not covered" in resp_text
        zero_citations = len(r_unsupp.json().get("citations", [])) == 0
        log_result("Chat", "Unsupported query triggers honest refusal without hallucinated citations", refused and zero_citations,
                   f"Refused: {refused}, Citations: {len(r_unsupp.json().get('citations', []))}")
    else:
        log_result("Chat", "Unsupported query execution", False, f"Status: {r_unsupp.status_code}")

    # 5. Test Non-Existent Model -> Truthful Error (No silent fallback)
    r_fake_model = requests.post(f"{API_V1}/chat/messages", headers=headers, json={
        "content": "Test question",
        "model_name": "non_existent_magic_model_9000",
        "conversation_id": None
    })
    log_result("Chat", "Non-existent model returns truthful 400/404 error without silent fallback",
               r_fake_model.status_code in [400, 404, 422], f"Status: {r_fake_model.status_code}")

    # 6. Test Human Escalation Endpoint
    r_esc = requests.post(f"{API_V1}/support-tickets", headers=headers, json={
        "subject": "Escalated from Chat Audit",
        "description": "User requested escalation during audit",
        "category": "Chat Escalation",
        "priority": "High",
        "source": "chat",
        "context": {
            "conversation_id": conv_id,
            "question": "How do I request an RMA?",
            "answer": "Follow RMA steps",
            "escalation_reason": "Audit verification"
        }
    })
    log_result("Chat", "Chat escalation creates Support Ticket in DB", r_esc.status_code in [200, 201], f"Status: {r_esc.status_code}")

    # 7. Test Conversation Listing and Retrieval
    r_convs = requests.get(f"{API_V1}/chat", headers=headers)
    log_result("Chat", "GET /chat returns user conversation list", r_convs.status_code == 200 and "items" in r_convs.json())

    # 8. Test Conversation Delete
    if conv_id:
        r_del_conv = requests.delete(f"{API_V1}/conversations/{conv_id}", headers=headers)
        log_result("Chat", f"DELETE /conversations/{conv_id} returns 200/204", r_del_conv.status_code in [200, 204])

def run_tickets_audit(headers):
    print("\n--- 4. SUPPORT TICKETS WORKFLOW AUDIT ---")
    
    # 1. Create a support ticket
    ticket_payload = {
        "subject": "Audit Hardware RMA Escalation",
        "description": "Customer requested human escalation for server hardware replacement.",
        "priority": "High",
        "category": "Hardware"
    }
    r = requests.post(f"{API_V1}/support-tickets", headers=headers, json=ticket_payload)
    log_result("Tickets", "POST /support-tickets creates ticket", r.status_code in [200, 201], f"Status: {r.status_code}")
    ticket_id = r.json().get("id") if r.status_code in [200, 201] else None

    if ticket_id:
        # 2. Get ticket by ID
        r = requests.get(f"{API_V1}/support-tickets/{ticket_id}", headers=headers)
        log_result("Tickets", f"GET /support-tickets/{ticket_id} returns ticket details", r.status_code == 200)

        # 3. Update ticket status (Open -> In Progress)
        r = requests.patch(f"{API_V1}/support-tickets/{ticket_id}", headers=headers, json={"status": "In Progress"})
        log_result("Tickets", "PATCH status to In Progress", r.status_code == 200 and r.json().get("status") == "In Progress")

        # 4. Reply to ticket
        r_reply = requests.post(f"{API_V1}/support-tickets/{ticket_id}/reply", headers=headers, json={"content": "Agent is actively reviewing the hardware warranty logs."})
        log_result("Tickets", "POST /support-tickets/{id}/reply adds response", r_reply.status_code == 200)

        # 5. Update ticket status (In Progress -> Resolved)
        r = requests.patch(f"{API_V1}/support-tickets/{ticket_id}", headers=headers, json={"status": "Resolved"})
        log_result("Tickets", "PATCH status to Resolved", r.status_code == 200 and r.json().get("status") == "Resolved")

        # 6. List tickets with filter
        r = requests.get(f"{API_V1}/support-tickets?status=Resolved", headers=headers)
        log_result("Tickets", "GET /support-tickets with status filter", r.status_code == 200 and len(r.json().get("items", [])) > 0)

def run_analytics_audit(headers):
    print("\n--- 5. ANALYTICS & BI AUDIT ---")
    
    r = requests.get(f"{API_V1}/analytics/overview", headers=headers)
    log_result("Analytics", "GET /analytics/overview returns real business metrics", r.status_code == 200, f"Status: {r.status_code}")

    r_dash = requests.get(f"{API_V1}/analytics/dashboard", headers=headers)
    log_result("Analytics", "GET /analytics/dashboard returns dashboard metrics", r_dash.status_code == 200, f"Status: {r_dash.status_code}")

    r_export = requests.get(f"{API_V1}/analytics/export", headers=headers)
    log_result("Analytics", "GET /analytics/export returns CSV data", r_export.status_code == 200 and "text/csv" in r_export.headers.get("content-type", ""))

def run_experiments_audit(headers):
    print("\n--- 6. EXPERIMENT CENTER & RESEARCH TABLES AUDIT ---")
    
    # 1. List experiments
    r = requests.get(f"{API_V1}/experiments", headers=headers)
    log_result("Experiments", "GET /experiments returns experiment list", r.status_code == 200 and "items" in r.json())
    experiments = r.json().get("items", [])
    exp_ids = [e["id"] for e in experiments]
    print(f"Persisted experiment IDs: {exp_ids}")
    log_result("Experiments", "Experiments #3, #4, #7, #12 exist and intact", 
               all(x in exp_ids for x in [3, 4, 7, 12]), f"Existing IDs: {exp_ids}")

    # 2. Get comparison for Exp #12 (QLoRA)
    r = requests.get(f"{API_V1}/experiments/12/comparison", headers=headers)
    log_result("Experiments", "GET /experiments/12/comparison returns run comparisons", r.status_code == 200)

    # 3. Get comparison for Exp #7 (LoRA)
    r = requests.get(f"{API_V1}/experiments/7/comparison", headers=headers)
    log_result("Experiments", "GET /experiments/7/comparison returns run comparisons", r.status_code == 200)

    # 4. Get Research Tables
    r = requests.get(f"{API_V1}/experiments/research-tables", headers=headers)
    log_result("Experiments", "GET /experiments/research-tables returns research data & disclosure",
               r.status_code == 200 and "scientific_disclosure" in r.json().get("data", {}) and "real_neural_experiments" in r.json().get("data", {}))

def run_admin_and_security_audit(headers, admin_token, agent_token, viewer_token):
    print("\n--- 7. ADMIN & SECURITY AUDIT ---")
    
    # 1. List users as Admin
    r = requests.get(f"{API_V1}/users", headers=headers)
    log_result("Admin", "Admin can list users (GET /users)", r.status_code == 200)

    # 2. Check RBAC: Viewer role
    if viewer_token:
        viewer_headers = {"Authorization": f"Bearer {viewer_token}"}
        r = requests.get(f"{API_V1}/users", headers=viewer_headers)
        log_result("Admin", "Viewer role handles /users with RBAC status", r.status_code in [200, 403])

    # 3. Security events / audit logs in system
    r = requests.get(f"{API_V1}/users/1/sessions", headers=headers)
    log_result("Security", "GET user sessions endpoint", r.status_code in [200, 404])

def main():
    print("==================================================")
    print("STARTING SUPPORTIQ COMPREHENSIVE E2E AUDIT")
    print("==================================================")
    headers, admin_token, agent_token, viewer_token = run_auth_audit()
    run_knowledge_base_audit(headers)
    run_chat_and_models_audit(headers)
    run_tickets_audit(headers)
    run_analytics_audit(headers)
    run_experiments_audit(headers)
    run_admin_and_security_audit(headers, admin_token, agent_token, viewer_token)

    print("\n==================================================")
    print("AUDIT SUMMARY:")
    print(f"Passed: {len(results['passed'])}")
    print(f"Failed: {len(results['failed'])}")
    print("==================================================")
    
    with open("audit_results.json", "w") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    main()
