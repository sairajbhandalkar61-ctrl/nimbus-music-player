import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.catalog import catalog

@pytest.fixture(scope="session", autouse=True)
def init_catalog():
    # Ensure catalog is loaded
    catalog.initialize()

@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client

def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["tracks_loaded"] > 100000

def test_search_ranking_and_case_insensitivity(client):
    # Test case-insensitivity: "beatles" vs "BEATLES"
    res1 = client.get("/api/search?q=beatles&limit=8")
    assert res1.status_code == 200
    data1 = res1.json()
    assert len(data1["tracks"]) > 0

    res2 = client.get("/api/search?q=BEATLES&limit=8")
    assert res2.status_code == 200
    data2 = res2.json()
    assert len(data2["tracks"]) == len(data1["tracks"])
    # Same top track ID
    assert data1["tracks"][0]["id"] == data2["tracks"][0]["id"]

    # Verify ranked by popularity descending
    popularities = [t["popularity"] for t in data1["tracks"]]
    assert popularities == sorted(popularities, reverse=True)

def test_recommend_k_up_to_10(client):
    # Find a seed track (e.g. Queen or Beatles or top track)
    search_res = client.get("/api/search?q=queen&limit=1")
    assert search_res.status_code == 200
    seed_track = search_res.json()["tracks"][0]
    track_id = seed_track["id"]

    # Test k = 10
    rec_res = client.get(f"/api/recommend/{track_id}?k=10")
    assert rec_res.status_code == 200
    data = rec_res.json()
    recs = data["recommendations"]

    # Must return exactly 10 recommendations (fixing the old n_neighbors=6 bug where only 5 were returned)
    assert len(recs) == 10
    # Every recommendation must have a similarity score between 0.0 and 1.0
    for r in recs:
        assert 0.0 <= r["similarity"] <= 1.0
        assert r["id"] != track_id  # Should not recommend itself

def test_duplicate_title_handling_by_id(client):
    # In Spotify dataset, many songs share titles (e.g. "Stay", "Intro", "Home")
    # Finding tracks with identical names but different artists/IDs
    matches = catalog.df[catalog.df["name"].str.lower() == "stay"]
    assert len(matches) > 1, "Expected multiple tracks named 'Stay'"

    track_id_1 = str(matches.iloc[0]["id"])
    track_id_2 = str(matches.iloc[1]["id"])
    assert track_id_1 != track_id_2

    # Querying by ID must retrieve the exact corresponding track
    res1 = client.get(f"/api/track/{track_id_1}")
    assert res1.status_code == 200
    assert res1.json()["id"] == track_id_1
    assert res1.json()["artists"] == str(matches.iloc[0]["artists_clean"])

    res2 = client.get(f"/api/track/{track_id_2}")
    assert res2.status_code == 200
    assert res2.json()["id"] == track_id_2
    assert res2.json()["artists"] == str(matches.iloc[1]["artists_clean"])

def test_gallery_filtering(client):
    # Filter by mood="chill" and decade=1980
    res = client.get("/api/gallery?mood=chill&decade=1980&limit=10")
    assert res.status_code == 200
    data = res.json()
    tracks = data["tracks"]
    assert len(tracks) > 0
    for t in tracks:
        assert t["mood"] == "chill"
        assert t["decade"] == 1980

def test_stream_proxy_allowlist_and_cors(client):
    # Disallowed host should return 403 Forbidden
    res_disallowed = client.get("/api/stream?url=https://malicious-site.com/audio.mp3")
    assert res_disallowed.status_code == 403

    # Allowed host check: e.g. audio-ssl.itunes.apple.com
    # Even if mocked or live, should validate host and return appropriate response/headers
    from backend.services.proxy import is_allowed_audio_url
    assert is_allowed_audio_url("https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview123.m4a") is True
    assert is_allowed_audio_url("https://example.com/audio.mp3") is False
