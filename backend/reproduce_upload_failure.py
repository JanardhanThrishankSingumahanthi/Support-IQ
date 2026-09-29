import requests

# 1. Login to get token
base_url = "http://127.0.0.1:8000"
login_resp = requests.post(
    f"{base_url}/api/v1/auth/login",
    json={"email": "janardhan@supportiq.com", "password": "SupportIQ2026!"}
)
print("Login status:", login_resp.status_code)
token = login_resp.json()["token"]

# 2. Try to upload a sample text file
files = {
    "file": ("test_doc.txt", b"This is a test support document for SupportIQ.", "text/plain")
}
data = {
    "category": "Chat Attachment"
}
headers = {
    "Authorization": f"Bearer {token}"
}

upload_resp = requests.post(f"{base_url}/api/v1/documents", files=files, data=data, headers=headers)
print("Upload status code:", upload_resp.status_code)
print("Upload response body:", upload_resp.text)
