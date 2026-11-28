import asyncio
import mimetypes
import os
import sys
from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any

# Ensure project root is in sys.path
PROJECT_ROOT = getattr(sys, "_MEIPASS", os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Register explicit MIME types for PWA assets (especially on Windows)
mimetypes.add_type("application/manifest+json", ".webmanifest")
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("image/x-icon", ".ico")
mimetypes.add_type("image/png", ".png")
mimetypes.add_type("image/svg+xml", ".svg")

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from backend.paths import get_resource_path
from backend.services.catalog import catalog
from backend.services.itunes import itunes_service
from backend.services.proxy import proxy_audio_stream
from backend.services.artwork import artwork_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[Nimbus Backend] Starting up and loading catalog...")
    catalog.initialize()
    
    # Prewarm top gallery tracks so initial view renders 100% with artworks immediately
    async def prewarm():
        try:
            top_tracks = catalog.get_gallery(limit=60)
            await artwork_service.batch_resolve(top_tracks)
            print(f"[Nimbus Backend] Artwork cache pre-warmed ({len(artwork_service._cache)} covers ready).")
        except Exception as e:
            print(f"[Nimbus Backend] Notice during artwork prewarm: {e}")

    asyncio.create_task(prewarm())
    yield
    print("[Nimbus Backend] Shutting down...")

app = FastAPI(
    title="Nimbus Music Engine API",
    description="Production-quality audio recommendation and streaming engine inspired by daydreamplayer.com",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend development, Capacitor native mobile, and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://localhost",
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:5173",
        "capacitor://localhost",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Range", "Content-Length", "Accept-Ranges"]
)

@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "service": "nimbus-backend",
        "tracks_loaded": len(catalog.df) if catalog.df is not None else 0
    }

@app.get("/api/search")
async def search(
    q: str = Query("", description="Search term for title and artist"),
    limit: int = Query(8, ge=1, le=50, description="Max results")
):
    results = catalog.search(query=q, limit=limit)
    enriched = []
    for t in results:
        tc = dict(t)
        tc["artworkUrl"] = artwork_service.get_cached(t["id"])
        enriched.append(tc)
    return {"query": q, "count": len(enriched), "tracks": enriched}

@app.get("/api/track/{track_id}")
async def get_track(track_id: str):
    track = catalog.get_track(track_id)
    if not track:
        raise HTTPException(status_code=404, detail=f"Track ID '{track_id}' not found.")
    tc = dict(track)
    tc["artworkUrl"] = artwork_service.get_cached(track_id)
    return tc

@app.get("/api/recommend/{track_id}")
async def recommend(
    track_id: str,
    k: int = Query(8, ge=1, le=20, description="Number of recommendations")
):
    track = catalog.get_track(track_id)
    if not track:
        raise HTTPException(status_code=404, detail=f"Track ID '{track_id}' not found.")
    
    seed = dict(track)
    seed["artworkUrl"] = artwork_service.get_cached(track_id)

    recommendations = catalog.recommend(track_id, k=k)
    enriched_recs = []
    missing_for_resolve = []
    for r in recommendations:
        rc = dict(r)
        art = artwork_service.get_cached(r["id"])
        if art:
            rc["artworkUrl"] = art
        else:
            missing_for_resolve.append(rc)
        enriched_recs.append(rc)

    if missing_for_resolve:
        resolved = await artwork_service.batch_resolve(missing_for_resolve)
        for rc in enriched_recs:
            if not rc.get("artworkUrl") and rc["id"] in resolved:
                rc["artworkUrl"] = resolved[rc["id"]]

    return {
        "seed_track": seed,
        "k": len(enriched_recs),
        "recommendations": enriched_recs
    }

@app.get("/api/gallery")
async def get_gallery(
    genre: Optional[str] = Query(None, description="Genre category (pop, rock, hip-hop, electronic, acoustic, jazz, classical, indie)"),
    mood: Optional[str] = Query(None, description="Mood bucket (euphoric, chill, melancholic, intense)"),
    decade: Optional[int] = Query(None, description="Decade (e.g. 1970, 1980, 1990, 2000, 2010, 2020)"),
    limit: int = Query(60, ge=1, le=120, description="Max results")
):
    tracks = catalog.get_gallery(genre=genre, mood=mood, decade=decade, limit=limit)
    enriched = []
    missing_for_resolve = []
    for t in tracks:
        tc = dict(t)
        art = artwork_service.get_cached(t["id"])
        if art:
            tc["artworkUrl"] = art
        else:
            missing_for_resolve.append(tc)
        enriched.append(tc)

    # Concurrently resolve top missing items (up to 30) for fast immediate display
    if missing_for_resolve:
        resolved = await artwork_service.batch_resolve(missing_for_resolve[:30])
        for tc in enriched:
            if not tc.get("artworkUrl") and tc["id"] in resolved:
                tc["artworkUrl"] = resolved[tc["id"]]

    return {
        "genre": genre,
        "mood": mood,
        "decade": decade,
        "count": len(enriched),
        "tracks": enriched
    }

class MixRequest(BaseModel):
    valence: float = Field(0.5, ge=0.0, le=1.0)
    energy: float = Field(0.5, ge=0.0, le=1.0)
    danceability: float = Field(0.5, ge=0.0, le=1.0)
    acousticness: float = Field(0.5, ge=0.0, le=1.0)
    tempo: float = Field(120.0, ge=40.0, le=220.0)
    limit: int = Field(20, ge=1, le=50)


@app.post("/api/mix")
async def create_vibe_mix(req: MixRequest):
    tracks = catalog.mix(
        valence=req.valence,
        energy=req.energy,
        danceability=req.danceability,
        acousticness=req.acousticness,
        tempo=req.tempo,
        limit=req.limit,
    )
    enriched = []
    missing = []
    for t in tracks:
        tc = dict(t)
        art = artwork_service.get_cached(t["id"])
        if art:
            tc["artworkUrl"] = art
        else:
            missing.append(tc)
        enriched.append(tc)

    if missing:
        resolved = await artwork_service.batch_resolve(missing[:20])
        for tc in enriched:
            if not tc.get("artworkUrl") and tc["id"] in resolved:
                tc["artworkUrl"] = resolved[tc["id"]]

    return {"count": len(enriched), "tracks": enriched}


@app.get("/api/artworks")
async def get_artworks(ids: str = Query(..., description="Comma-separated track IDs")):
    track_ids = [i.strip() for i in ids.split(",") if i.strip()]
    tracks = []
    for tid in track_ids:
        t = catalog.get_track(tid)
        if t:
            tracks.append(t)
        else:
            tracks.append({"id": tid})
    results = await artwork_service.batch_resolve(tracks)
    return {"artworks": results}

@app.get("/api/preview/{track_id}")
async def get_preview(track_id: str):
    track = catalog.get_track(track_id)
    if not track:
        raise HTTPException(status_code=404, detail=f"Track ID '{track_id}' not found.")
    
    preview_info = await itunes_service.get_preview(
        track_id=track_id,
        title=track["name"],
        artist=track["artists"]
    )
    if preview_info.get("artworkUrl"):
        artwork_service._cache[track_id] = preview_info["artworkUrl"]
    elif track_id in artwork_service._cache:
        preview_info["artworkUrl"] = artwork_service._cache[track_id]
        
    return preview_info

@app.get("/api/stream")
async def stream_audio(
    url: str = Query(..., description="Apple preview audio URL"),
    request: Request = None
):
    return await proxy_audio_stream(url, request)

# Mount frontend dist static files if built
frontend_dist = os.path.abspath(get_resource_path("frontend", "dist"))
MIME_OVERRIDES = {
    ".webmanifest": "application/manifest+json",
    ".js": "application/javascript",
    ".mjs": "application/javascript",
    ".css": "text/css",
    ".html": "text/html",
    ".png": "image/png",
    ".ico": "image/x-icon",
    ".svg": "image/svg+xml",
    ".json": "application/json",
    ".woff2": "font/woff2",
}
NO_CACHE_FILES = {"sw.js", "registerSW.js", "manifest.webmanifest"}

if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API route not found")

        clean_path = full_path.lstrip("/")
        if clean_path:
            candidate = os.path.abspath(os.path.join(frontend_dist, clean_path))
            if candidate.startswith(frontend_dist + os.sep) and os.path.isfile(candidate):
                ext = os.path.splitext(candidate)[1].lower()
                media_type = MIME_OVERRIDES.get(ext)
                headers = {"Cache-Control": "no-cache"} if clean_path in NO_CACHE_FILES else {}
                return FileResponse(candidate, media_type=media_type, headers=headers)
            if os.path.splitext(clean_path)[1]:
                raise HTTPException(status_code=404, detail="Static file not found")

        return FileResponse(os.path.join(frontend_dist, "index.html"), media_type="text/html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
