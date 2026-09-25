import sys
import httpx
import json

BASE = "http://127.0.0.1:8000/api/v1"

def get_auth_token():
    login_res = httpx.post(
        f"{BASE}/auth/login",
        json={"email": "janardhan@supportiq.com", "password": "Password123!"}
    )
    if login_res.status_code != 200:
        raise RuntimeError(f"Login failed: {login_res.text}")
    return login_res.json()["token"]

def test_no_evidence():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    query = "What is the SupportIQ policy on intergalactic quantum teleportation insurance?"
    res = httpx.post(
        f"{BASE}/chat/messages",
        headers=headers,
        json={"content": query, "conversation_id": None},
        timeout=30.0
    )
    assert res.status_code == 200, f"Error: {res.status_code} - {res.text}"
    data = res.json()
    asst = data.get("assistant_message", {})
    meta = asst.get("metadata_json", {})
    answer = asst.get("content", "")
    citations = data.get("citations", [])
    candidates = meta.get("retrieval_candidates", [])

    print(f"Retrieval candidates count: {len(candidates)}")
    print(f"Generation status: {meta.get('status')}")
    print(f"Answer: {answer}")
    print(f"Citations count: {len(citations)}")

    is_no_evidence = (
        meta.get("status") == "no_evidence" or 
        "No relevant information was found" in answer or
        "does not fabricate" in answer
    )
    if is_no_evidence and len(citations) == 0:
        print("RESULT: PASS - System honestly refused unsupported query and attached 0 citations.")
    else:
        print("RESULT: FAIL - System fabricated an answer or returned invalid status.")

if __name__ == "__main__":
    test_no_evidence()
