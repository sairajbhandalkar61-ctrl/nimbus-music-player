import os
import sys
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Ensure parent directory is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app.services.catalog_service import CatalogService
from backend.app.recommender.content_recommender import ContentRecommender
from backend.app.recommender.spotify_recommender import SpotifyRecommender
from backend.app.api.routes import create_api_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("soundwave.main")

CATALOG_PATH = os.path.join(BASE_DIR, "data", "processed", "music_catalog.csv")
FEATURES_PATH = os.path.join(BASE_DIR, "data", "processed", "recommendation_features.csv")
SPOTIFY_PATH = os.path.join(BASE_DIR, "data", "spotify", "spotify_dataset.csv")
AUDIO_DIR = os.path.join(BASE_DIR, "audio")

catalog_service: CatalogService = None
content_recommender: ContentRecommender = None
spotify_recommender: SpotifyRecommender = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global catalog_service, content_recommender, spotify_recommender
    logger.info("Initializing SOUNDWAVE backend services...")
    catalog_service = CatalogService(CATALOG_PATH)
    content_recommender = ContentRecommender(CATALOG_PATH, FEATURES_PATH)
    spotify_recommender = SpotifyRecommender(SPOTIFY_PATH)
    logger.info("SOUNDWAVE backend services successfully initialized!")
    yield
    logger.info("Shutting down SOUNDWAVE backend services...")

app = FastAPI(
    title="SOUNDWAVE Music Intelligence API",
    description="High-performance music streaming and AI recommendation API powered by MTG-Jamendo and Spotify audio features.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount local audio directory
os.makedirs(AUDIO_DIR, exist_ok=True)
app.mount("/static/audio", StaticFiles(directory=AUDIO_DIR), name="audio")

# Connect routers
api_router = create_api_router(
    catalog_service=None,
    content_recommender=None,
    spotify_recommender=None
)

# Dynamic dispatch router wrapper so lifespan services are passed
@app.middleware("http")
async def attach_services(request, call_next):
    return await call_next(request)

# We initialize and pass instantiated singletons
catalog_service = CatalogService(CATALOG_PATH)
content_recommender = ContentRecommender(CATALOG_PATH, FEATURES_PATH)
spotify_recommender = SpotifyRecommender(SPOTIFY_PATH)

app.include_router(create_api_router(catalog_service, content_recommender, spotify_recommender))

@app.get("/")
def root():
    return {
        "app": "SOUNDWAVE API",
        "status": "online",
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
