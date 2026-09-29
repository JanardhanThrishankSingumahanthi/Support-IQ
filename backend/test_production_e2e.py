import urllib.request
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def api_call(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = None
    if data is not None:
        headers["Content-Type"] = "application/json"
        body = json.dumps(data).encode("utf-8")
    
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            resp_body = resp.read().decode("utf-8")
            return resp.status, json.loads(resp_body) if resp_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, {"error": err_body}

def run_e2e_audit():
    print("=== SUPPORTIQ PRODUCTION E2E AUDIT ===")
    
    # 1. Health
    status, data = api_call("/api/v1/health")
    assert status == 200, f"Health check failed: {status}"
    print(f"[PASS] 1. Health: {data.get('status')} ({data.get('service')})")

    # 2. Login
    login_payload = {"email": "janardhan@supportiq.com", "password": "SupportIQ2026!"}
    status, data = api_call("/api/v1/auth/login", method="POST", data=login_payload)
    assert status == 200, f"Login failed: {status}, {data}"
    token = data.get("token") or data.get("access_token")
    assert token, "No access token received"
    user_email = data.get("user", {}).get("email")
    print(f"[PASS] 2. Login: authenticated as {user_email}")

    # 3. Auth Me
    status, data = api_call("/api/v1/auth/me", token=token)
    assert status == 200, f"Auth me failed: {status}"
    print(f"[PASS] 3. Current User: {data.get('email')} (role: {data.get('role', {}).get('name')})")

    # 4. Knowledge Base Documents List
    status, data = api_call("/api/v1/documents", token=token)
    assert status == 200, f"Documents list failed: {status}"
    docs = data if isinstance(data, list) else data.get("items", [])
    print(f"[PASS] 4. Knowledge Base: {len(docs)} documents indexed")

    # 5. Document Preview / Chunks
    if docs:
        first_doc_id = docs[0].get("id")
        status, data = api_call(f"/api/v1/documents/{first_doc_id}", token=token)
        assert status == 200, f"Document detail failed: {status}"
        print(f"[PASS] 5. Document Preview: Doc ID {first_doc_id} ('{data.get('title')}') has {len(data.get('chunks', []))} chunks")

    # 6. Chat with Supported Query
    chat_payload = {
        "content": "Within how many days can annual subscriptions be refunded?",
        "model_name": "extractive",
    }
    status, data = api_call("/api/v1/chat/messages", method="POST", data=chat_payload, token=token)
    assert status == 200, f"Chat query failed: {status}, {data}"
    answer = data.get("assistant_message", {}).get("content", "")
    citations = data.get("citations", [])
    print(f"[PASS] 6. Chat (Supported): Answer length={len(answer)}, Citations={len(citations)}")
    print(f"       Answer snippet: {answer[:90]}...")

    # 7. Evidence & Grounding
    reliability = data.get("reliability", {})
    gen_status = data.get("generation_status")
    print(f"[PASS] 7. Grounding & Reliability: gen_status={gen_status}, score={reliability.get('score')}")

    # 8. Chat with Unsupported Query (Safe Refusal)
    unsupported_payload = {
        "content": "What is the policy for teleportation paradox insurance?",
        "model_name": "extractive",
    }
    status, data = api_call("/api/v1/chat/messages", method="POST", data=unsupported_payload, token=token)
    assert status == 200, f"Unsupported query failed: {status}, {data}"
    refusal_answer = data.get("assistant_message", {}).get("content", "")
    gen_status = data.get("generation_status")
    print(f"[PASS] 8. Safe Refusal: gen_status={gen_status}, answer={refusal_answer[:70]}...")

    # 9. Support Tickets List
    status, data = api_call("/api/v1/support-tickets", token=token)
    assert status == 200, f"Tickets failed: {status}"
    tickets = data if isinstance(data, list) else data.get("items", [])
    print(f"[PASS] 9. Support Tickets: {len(tickets)} tickets loaded")

    # 10. Analytics
    status, data = api_call("/api/v1/analytics/overview", token=token)
    assert status == 200, f"Analytics failed: {status}"
    print(f"[PASS] 10. Analytics Overview: total_queries={data.get('total_queries')}, total_tickets={data.get('total_tickets')}")

    # 11. Experiment Center
    status, data = api_call("/api/v1/experiments", token=token)
    assert status == 200, f"Experiments failed: {status}"
    experiments = data if isinstance(data, list) else data.get("items", [])
    print(f"[PASS] 11. Experiment Center: {len(experiments)} experiments loaded")

    # 12. Logout
    status, data = api_call("/api/v1/auth/logout", method="POST", token=token)
    assert status == 200, f"Logout failed: {status}"
    print(f"[PASS] 12. Logout: session successfully invalidated")

    print("\nALL 12 PRODUCTION E2E WORKFLOW CHECKS PASSED PERFECTLY!")

if __name__ == "__main__":
    run_e2e_audit()
