import os
import sys
from contextlib import asynccontextmanager
from typing import Optional

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.services.catalog import catalog
from backend.services.itunes import itunes_service
from backend.services.proxy import proxy_audio_stream

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[Nimbus Backend] Starting up and loading catalog...")
    catalog.initialize()
    yield
    print("[Nimbus Backend] Shutting down...")

app = FastAPI(
    title="Nimbus Music Engine API",
    description="Production-quality audio recommendation and streaming engine inspired by daydreamplayer.com",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    return {"query": q, "count": len(results), "tracks": results}

@app.get("/api/track/{track_id}")
async def get_track(track_id: str):
    track = catalog.get_track(track_id)
    if not track:
        raise HTTPException(status_code=404, detail=f"Track ID '{track_id}' not found.")
    return track

@app.get("/api/recommend/{track_id}")
async def recommend(
    track_id: str,
    k: int = Query(8, ge=1, le=20, description="Number of recommendations")
):
    track = catalog.get_track(track_id)
    if not track:
        raise HTTPException(status_code=404, detail=f"Track ID '{track_id}' not found.")
    
    recommendations = catalog.recommend(track_id, k=k)
    return {
        "seed_track": track,
        "k": len(recommendations),
        "recommendations": recommendations
    }

@app.get("/api/gallery")
async def get_gallery(
    genre: Optional[str] = Query(None, description="Genre category (pop, rock, hip-hop, electronic, acoustic, jazz, classical, indie)"),
    mood: Optional[str] = Query(None, description="Mood bucket (euphoric, chill, melancholic, intense)"),
    decade: Optional[int] = Query(None, description="Decade (e.g. 1970, 1980, 1990, 2000, 2010, 2020)"),
    limit: int = Query(60, ge=1, le=120, description="Max results")
):
    tracks = catalog.get_gallery(genre=genre, mood=mood, decade=decade, limit=limit)
    return {
        "genre": genre,
        "mood": mood,
        "decade": decade,
        "count": len(tracks),
        "tracks": tracks
    }

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
    return preview_info

@app.get("/api/stream")
async def stream_audio(
    url: str = Query(..., description="Apple preview audio URL"),
    request: Request = None
):
    return await proxy_audio_stream(url, request)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
