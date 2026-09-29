import requests

BASE_URL = "http://127.0.0.1:8000"

def run_api_audit():
    # Login
    login_res = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": "janardhan@supportiq.com",
        "password": "SupportIQ2026!"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    endpoints = [
        ("GET", "/health", None, 200, False),
        ("GET", "/api/v1/health", None, 200, False),
        ("GET", "/api/v1/auth/me", None, 200, True),
        ("GET", "/api/v1/auth/admin-check", None, 200, True),
        ("GET", "/api/v1/auth/permission-check?permission=manage_users", None, 200, True),
        ("GET", "/api/v1/documents?page=1&page_size=10", None, 200, True),
        ("GET", "/api/v1/knowledge-base/stats", None, 200, True),
        ("GET", "/api/v1/knowledge-base/index-status", None, 200, True),
        ("GET", "/api/v1/knowledge-base/settings", None, 200, True),
        ("GET", "/api/v1/retrieval/search?q=refund+policy&top_k=3&method=hybrid", None, 200, True),
        ("GET", "/api/v1/chat/models", None, 200, True),
        ("GET", "/api/v1/conversations", None, 200, True),
        ("GET", "/api/v1/evidence", None, 200, True),
        ("GET", "/api/v1/support-tickets", None, 200, True),
        ("GET", "/api/v1/analytics/dashboard", None, 200, True),
        ("GET", "/api/v1/experiments", None, 200, True),
        ("GET", "/api/v1/users", None, 200, True),
    ]

    print("=== API ENDPOINT AUDIT RESULTS ===")
    all_passed = True
    for method, path, payload, expected_status, needs_auth in endpoints:
        h = headers if needs_auth else {}
        if method == "GET":
            res = requests.get(f"{BASE_URL}{path}", headers=h)
        else:
            res = requests.post(f"{BASE_URL}{path}", headers=h, json=payload)
        
        status_ok = res.status_code == expected_status
        if not status_ok:
            all_passed = False
        print(f"[{'PASS' if status_ok else 'FAIL'}] {method:4} {path:<60} -> Status {res.status_code} (expected {expected_status})")
    
    assert all_passed, "Some API audit endpoints failed!"
    print("\nALL API ENDPOINTS AUDITED AND RETURNED EXPECTED STATUS!")

if __name__ == "__main__":
    run_api_audit()
