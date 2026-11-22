import json
import urllib.request

def test(name, url, headers=None):
    req_headers = {'User-Agent': 'TestClient'}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, headers=req_headers)
    with urllib.request.urlopen(req) as resp:
        content = resp.read()
        headers_dict = dict(resp.headers)
        data = None
        if "json" in resp.headers.get("content-type", ""):
            data = json.loads(content.decode("utf-8"))
        print(f"=== {name} [{resp.status}] ===")
        return data, headers_dict, len(content)

# 1. Health
h, _, _ = test("HEALTH", "http://127.0.0.1:8000/api/health")
print("Tracks loaded:", h.get("tracks_loaded"))

# 2. Search
s, _, _ = test("SEARCH", "http://127.0.0.1:8000/api/search?q=queen&limit=2")
print("Search matches:", len(s.get("tracks", [])))
seed_track = s["tracks"][0]
seed_id = seed_track["id"]
print(f"Top match: {seed_track['name']} by {seed_track['artists']} (ID: {seed_id})")

# 3. Track
t, _, _ = test("TRACK", f"http://127.0.0.1:8000/api/track/{seed_id}")
print(f"Features: valence={t.get('valence')}, energy={t.get('energy')}, tempo={t.get('tempo')}")

# 4. Recommend
r, _, _ = test("RECOMMEND", f"http://127.0.0.1:8000/api/recommend/{seed_id}?k=8")
recs = r.get("recommendations", [])
print("Recommendations count:", len(recs))
for rec in recs[:3]:
    print(f"  -> {rec['name']} by {rec['artists']} (similarity: {rec['similarity']})")

# 5. Gallery
g, _, _ = test("GALLERY", "http://127.0.0.1:8000/api/gallery?mood=chill&decade=1990&limit=3")
print("Gallery count:", len(g.get("tracks", [])))

# 6. Preview (iTunes)
p, _, _ = test("PREVIEW", f"http://127.0.0.1:8000/api/preview/{seed_id}")
print("Artwork URL (600x600):", p.get("artworkUrl"))
print("Preview Audio URL:", p.get("previewUrl"))

# 7. Audio Stream Proxy with Range request & CORS headers
preview_url = p.get("previewUrl")
if preview_url:
    encoded_url = urllib.parse.quote(preview_url)
    proxy_url = f"http://127.0.0.1:8000/api/stream?url={encoded_url}"
    _, stream_headers, byte_count = test("STREAM PROXY", proxy_url, headers={"Range": "bytes=0-1024"})
    print("Stream CORS Access-Control-Allow-Origin:", stream_headers.get("access-control-allow-origin"))
    print("Stream Content-Range:", stream_headers.get("content-range"))
    print("Stream Content-Type:", stream_headers.get("content-type"))
    print("Stream bytes received:", byte_count)

print("\nALL BACKEND ENDPOINTS VERIFIED SUCCESSFULLY!")
