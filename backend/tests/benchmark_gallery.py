import urllib.request, json, time

t0 = time.time()
resp = urllib.request.urlopen("http://127.0.0.1:8000/api/gallery?genre=rock&decade=1980&limit=6")
dt = (time.time() - t0) * 1000
data = json.loads(resp.read().decode("utf-8"))

print(f"Gallery response time: {round(dt, 2)} ms")
print(f"Tracks count: {len(data.get('tracks', []))}")
if data.get('tracks'):
    first = data['tracks'][0]
    print(f"Top track: {first['name']} by {first['artists']} (genre: {first.get('genre')}, mood: {first.get('mood')}, pop: {first.get('popularity')})")

# Test 2nd request (cache hit)
t0 = time.time()
resp = urllib.request.urlopen("http://127.0.0.1:8000/api/gallery?genre=rock&decade=1980&limit=6")
dt2 = (time.time() - t0) * 1000
print(f"Cached response time: {round(dt2, 2)} ms")
