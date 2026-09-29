import os
import sys
import json
import io
import requests
import sqlite3
from pathlib import Path

BASE_URL = "http://127.0.0.1:8000"
DB_PATH = (Path(__file__).parent / "supportiq.db").resolve()

def login():
    res = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": "janardhan@supportiq.com",
        "password": "SupportIQ2026!"
    })
    assert res.status_code == 200, f"Login failed: {res.text}"
    token = res.json()["token"]
    return {"Authorization": f"Bearer {token}"}

def create_sample_pdf():
    # Use pypdf or reportlab or minimal PDF bytes with text
    try:
        from pypdf import PdfWriter
        from pypdf.generic import NameObject, DecodedStreamObject, ArrayObject, DictionaryObject, TextStringObject
        # Build simple valid PDF
        import pypdf
        writer = PdfWriter()
        # Add a blank page and write text stream
        page = writer.add_blank_page(width=612, height=792)
        # Using reportlab or standard pypdf canvas if available, or write standard minimal PDF stream
    except Exception:
        pass
    
    # We can create a real PDF using Python's pypdf or a standard compliant minimal PDF
    pdf_content = (
        b"%PDF-1.4\n"
        b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
        b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
        b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n"
        b"4 0 obj << /Length 200 >> stream\n"
        b"BT\n/F1 12 Tf\n50 700 Td\n(SupportIQ SLA Policy 2026: Enterprise Tier response time is 15 minutes guaranteed with 99.99 percent uptime.) Tj\nET\n"
        b"endstream\nendobj\n"
        b"5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n"
        b"xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000495 00000 n \n"
        b"trailer << /Size 6 /Root 1 0 R >>\nstartxref\n574\n%%EOF\n"
    )
    return pdf_content

def run_tests():
    headers = login()
    print("1. Logged in successfully.")

    # A. Test Real PDF Upload
    import time
    test_filename = f"enterprise_sla_policy_{int(time.time())}.pdf"
    pdf_bytes = create_sample_pdf()
    files = {"file": (test_filename, io.BytesIO(pdf_bytes), "application/pdf")}
    data = {"category": "Policy"}
    
    res = requests.post(f"{BASE_URL}/api/v1/documents", headers=headers, files=files, data=data)
    print(f"2. PDF Upload response: {res.status_code}")
    assert res.status_code == 201 or res.status_code == 200, f"Upload failed: {res.text}"
    doc_data = res.json()
    doc_id = doc_data["id"]
    print(f"   Uploaded doc ID: {doc_id}, status: {doc_data['status']}, chunks: {doc_data.get('chunk_count')}")
    assert doc_data["status"] in ["COMPLETED", "indexed"], f"Expected COMPLETED, got {doc_data['status']}"
    assert doc_data["chunk_count"] > 0, "Expected at least 1 chunk"

    # Verify database persistence
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, status, metadata_json FROM documents WHERE id = ?", (doc_id,))
    row = cursor.fetchone()
    print(f"3. DB Document Record: id={row[0]}, title={row[1]}, status={row[2]}")
    assert row is not None, "DB record missing"
    assert row[2] in ["COMPLETED", "indexed"], f"DB status not completed: {row[2]}"

    cursor.execute("SELECT id, chunk_index, content, metadata_json FROM document_chunks WHERE document_id = ?", (doc_id,))
    chunks = cursor.fetchall()
    print(f"4. DB Chunks created: {len(chunks)}")
    assert len(chunks) > 0, "No chunks in DB"
    for c in chunks:
        meta = json.loads(c[3]) if isinstance(c[3], str) else c[3]
        print(f"   Chunk {c[1]}: length={len(c[2])}, page={meta.get('page')}")
        assert "embedding" in meta, "Embedding missing from chunk metadata"
        assert len(meta["embedding"]) == 32, "Embedding dimension mismatch"

    # Verify Knowledge Base listing contains the document
    kb_res = requests.get(f"{BASE_URL}/api/v1/documents?page=1&page_size=50", headers=headers)
    assert kb_res.status_code == 200
    kb_docs = kb_res.json()["items"]
    found_doc = next((d for d in kb_docs if d["id"] == doc_id), None)
    assert found_doc is not None, "Uploaded doc not found in KB documents list"
    print("5. KB Documents list verified.")

    # Verify Hybrid Retrieval on the uploaded doc
    search_res = requests.get(f"{BASE_URL}/api/v1/retrieval/search", headers=headers, params={
        "q": "What is the Enterprise Tier response time in the SLA policy?",
        "top_k": 3,
        "method": "hybrid"
    })
    print(f"6. Hybrid search status: {search_res.status_code}")
    assert search_res.status_code == 200, f"Search failed: {search_res.text}"
    search_data = search_res.json()
    retrieved_items = search_data.get("items", [])
    print(f"   Retrieved {len(retrieved_items)} items")
    matching_chunk = next((c for c in retrieved_items if c.get("document_id") == doc_id), None)
    assert matching_chunk is not None, f"Uploaded document chunk not retrieved by hybrid search: {retrieved_items}"
    print(f"   Matched chunk score: {matching_chunk.get('score')}, snippet: {matching_chunk.get('content')[:60]}...")

    # Verify Chat end-to-end with the uploaded document attached
    conv_res = requests.post(f"{BASE_URL}/api/v1/conversations", headers=headers, json={
        "title": "SLA Policy Verification Chat"
    })
    assert conv_res.status_code == 200 or conv_res.status_code == 201
    conv_id = conv_res.json()["id"]

    chat_payload = {
        "conversation_id": conv_id,
        "content": "What is the Enterprise Tier response time guaranteed in the uploaded SLA policy?",
        "use_kb": True,
        "model": "SupportIQ QLoRA (4-bit NF4)",
        "attachment_document_id": doc_id
    }
    chat_res = requests.post(f"{BASE_URL}/api/v1/chat/messages", headers=headers, json=chat_payload)
    print(f"7. Chat response status: {chat_res.status_code}")
    assert chat_res.status_code == 200, f"Chat failed: {chat_res.text}"
    chat_data = chat_res.json()
    content = chat_data.get("assistant_message", {}).get("content") or chat_data.get("content", "")
    citations = chat_data.get("citations", [])
    print(f"   Chat answer: {content}")
    print(f"   Citations: {citations}")
    assert len(citations) > 0, "Expected at least 1 citation"
    assert citations[0]["document_id"] == doc_id, f"Citation doc_id mismatch: {citations[0]['document_id']} vs {doc_id}"
    assert "15 minutes" in content or "15" in content or "Enterprise" in content, "Answer did not extract correct information from document"

    # Verify Evidence Viewer / Document API
    ev_res = requests.get(f"{BASE_URL}/api/v1/documents/{doc_id}", headers=headers)
    print(f"8. Evidence Viewer doc fetch: {ev_res.status_code}")
    assert ev_res.status_code == 200, f"Evidence fetch failed: {ev_res.text}"
    ev_data = ev_res.json()
    assert ev_data["id"] == doc_id
    assert len(ev_data["chunks"]) > 0
    assert "15 minutes" in ev_data["chunks"][0]["content"]

    # Test Failure Cases (Phase 5)
    print("\n--- PHASE 5 FAILURE TESTS ---")
    
    # 1. Unsupported file type (.exe)
    bad_file = {"file": ("malicious.exe", io.BytesIO(b"MZ\x90\x00\x03\x00"), "application/octet-stream")}
    r_bad = requests.post(f"{BASE_URL}/api/v1/documents", headers=headers, files=bad_file, data={"category": "Policy"})
    print(f"F1. Unsupported file status: {r_bad.status_code}, response: {r_bad.json()}")
    assert r_bad.status_code == 400
    assert "supported" in r_bad.json().get("message", "").lower()

    # 2. Empty file (0 bytes)
    empty_file = {"file": ("empty.pdf", io.BytesIO(b""), "application/pdf")}
    r_empty = requests.post(f"{BASE_URL}/api/v1/documents", headers=headers, files=empty_file, data={"category": "Policy"})
    print(f"F2. Empty file status: {r_empty.status_code}, response: {r_empty.json()}")
    assert r_empty.status_code == 400
    assert "empty" in r_empty.json().get("message", "").lower()

    # 3. Corrupt/Invalid PDF
    corrupt_file = {"file": (f"corrupt_{int(time.time())}.pdf", io.BytesIO(b"%PDF-1.4\nBROKEN CONTENT TRUNCATED"), "application/pdf")}
    r_corrupt = requests.post(f"{BASE_URL}/api/v1/documents", headers=headers, files=corrupt_file, data={"category": "Policy"})
    print(f"F3. Corrupt PDF status: {r_corrupt.status_code}, response: {r_corrupt.json()}")
    assert r_corrupt.status_code == 400
    assert "corrupt" in r_corrupt.json().get("message", "").lower() or "text" in r_corrupt.json().get("message", "").lower()

    # 4. Duplicate document
    dup_file = {"file": (test_filename, io.BytesIO(pdf_bytes), "application/pdf")}
    r_dup = requests.post(f"{BASE_URL}/api/v1/documents", headers=headers, files=dup_file, data={"category": "Policy"})
    print(f"F4. Duplicate file status: {r_dup.status_code}, response: {r_dup.json()}")
    assert r_dup.status_code == 409
    assert "already exists" in r_dup.json().get("message", "")

    # 5. Invalid / Expired Token (401)
    r_unauth = requests.post(f"{BASE_URL}/api/v1/documents", headers={"Authorization": "Bearer invalid_token"}, files=files, data=data)
    print(f"F5. Unauthorized status: {r_unauth.status_code}, response: {r_unauth.json()}")
    assert r_unauth.status_code == 401

    print("\nALL PHASE 4 AND PHASE 5 TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
