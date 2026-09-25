import requests
import re

BASE = 'http://127.0.0.1:8000'

routes = [
    ('/', 200, '<div id="root"></div>'),
    ('/docs', 200, 'swagger-ui'),
    ('/chat', 200, '<div id="root"></div>'),
    ('/knowledge-base', 200, '<div id="root"></div>'),
    ('/tickets', 200, '<div id="root"></div>'),
    ('/analytics', 200, '<div id="root"></div>'),
    ('/experiments', 200, '<div id="root"></div>'),
    ('/admin', 200, '<div id="root"></div>'),
    ('/security', 200, '<div id="root"></div>'),
    ('/login', 200, '<div id="root"></div>'),
]

print("=== VERIFYING SPA ROUTES ===")
for path, expected_status, content_check in routes:
    r = requests.get(f'{BASE}{path}')
    assert r.status_code == expected_status, f'Route {path} failed: {r.status_code}'
    assert content_check in r.text, f'Route {path} missing content {content_check}'
    print(f'ROUTE {path}: PASS ({r.status_code})')

# Static assets
print("\n=== VERIFYING ASSET SERVING ===")
r_html = requests.get(f'{BASE}/')
js_match = re.search(r'src="(/assets/[^"]+)"', r_html.text)
css_match = re.search(r'href="(/assets/[^"]+)"', r_html.text)
assert js_match, 'JS asset not found in index.html'
assert css_match, 'CSS asset not found in index.html'

js_url = f'{BASE}{js_match.group(1)}'
css_url = f'{BASE}{css_match.group(1)}'

r_js = requests.get(js_url)
assert r_js.status_code == 200, f'JS asset failed: {r_js.status_code}'
assert len(r_js.content) > 100000, 'JS asset truncated'
print(f'JS ASSET {js_match.group(1)}: PASS ({r_js.status_code}, {len(r_js.content)} bytes)')

r_css = requests.get(css_url)
assert r_css.status_code == 200, f'CSS asset failed: {r_css.status_code}'
assert len(r_css.content) > 10000, 'CSS asset truncated'
print(f'CSS ASSET {css_match.group(1)}: PASS ({r_css.status_code}, {len(r_css.content)} bytes)')

# API verification
print("\n=== VERIFYING API AND NEGATIVE ROUTING ===")
r_api = requests.get(f'{BASE}/api/v1/health')
assert r_api.status_code == 200 and r_api.json().get('status') == 'ok'
print(f'API ROUTE /api/v1/health: PASS ({r_api.status_code})')

# Negative API test (must NOT return HTML index)
r_neg = requests.get(f'{BASE}/api/v1/nonexistent_endpoint')
assert r_neg.status_code == 404 and '<div id="root">' not in r_neg.text
print(f'API 404 ROUTE /api/v1/nonexistent_endpoint: PASS (404, not SPA fallback)')
print("\n=== ALL SINGLE-HOST VERIFICATIONS PASSED ===")
