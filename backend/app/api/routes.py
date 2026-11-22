import os
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse, RedirectResponse

from backend.app.schemas.schemas import (
    Track,
    RecommendationResponse,
    TrackListResponse,
    TagItem,
    HealthResponse,
    SpotifyRecommendationResponse
)

def create_api_router(catalog_service, content_recommender, spotify_recommender) -> APIRouter:
    router = APIRouter(prefix="/api")

    @router.get("/health", response_model=HealthResponse)
    def health_check():
        genres_count = len(catalog_service.get_genres()) if catalog_service else 0
        moods_count = len(catalog_service.get_moods()) if catalog_service else 0
        instruments_count = len(catalog_service.get_instruments()) if catalog_service else 0
        total_tracks = len(catalog_service.df) if catalog_service and catalog_service.df is not None else 0
        spotify_tracks = len(spotify_recommender.df) if spotify_recommender and spotify_recommender.df is not None else 0
        knn_ready = content_recommender.knn_model is not None if content_recommender else False

        return {
            "status": "healthy",
            "version": "1.0.0",
            "total_tracks": total_tracks,
            "total_genres": genres_count,
            "total_moods": moods_count,
            "total_instruments": instruments_count,
            "spotify_tracks": spotify_tracks,
            "knn_trained": knn_ready
        }

    @router.get("/dashboard/featured")
    def get_dashboard_data():
        return catalog_service.get_featured_dashboard()

    @router.get("/tracks", response_model=TrackListResponse)
    def list_tracks(
        page: int = Query(1, ge=1),
        limit: int = Query(20, ge=1, le=100),
        genre: Optional[str] = None,
        mood: Optional[str] = None,
        instrument: Optional[str] = None,
        artist: Optional[str] = None,
        album: Optional[str] = None,
        sort_by: str = Query("title", pattern="^(title|artist|duration|release_date)$")
    ):
        data = catalog_service.get_tracks(
            page=page,
            limit=limit,
            genre=genre,
            mood=mood,
            instrument=instrument,
            artist=artist,
            album=album,
            sort_by=sort_by
        )
        return data

    @router.get("/tracks/{track_id}", response_model=Track)
    def get_track(track_id: str):
        track = catalog_service.get_track_by_id(track_id)
        if not track:
            raise HTTPException(status_code=404, detail=f"Track '{track_id}' not found")
        return track

    @router.get("/search", response_model=TrackListResponse)
    def search_tracks(q: str = Query(..., min_length=1), limit: int = Query(20, ge=1, le=50)):
        results = catalog_service.search(q, limit=limit)
        return {
            "total": len(results),
            "page": 1,
            "limit": limit,
            "tracks": results
        }

    @router.get("/genres", response_model=List[TagItem])
    def get_genres():
        return catalog_service.get_genres()

    @router.get("/moods", response_model=List[TagItem])
    def get_moods():
        return catalog_service.get_moods()

    @router.get("/instruments", response_model=List[TagItem])
    def get_instruments():
        return catalog_service.get_instruments()

    @router.get("/recommendations/{track_id}", response_model=RecommendationResponse)
    def get_track_recommendations(track_id: str, limit: int = Query(10, ge=1, le=30)):
        seed = catalog_service.get_track_by_id(track_id)
        if not seed:
            raise HTTPException(status_code=404, detail=f"Track '{track_id}' not found")

        recs = content_recommender.recommend_similar(track_id, top_n=limit)
        return {
            "seed_track_id": track_id,
            "category": "content_similarity",
            "value": seed["title"],
            "total": len(recs),
            "recommendations": recs
        }

    @router.get("/recommendations/similar/{track_id}", response_model=RecommendationResponse)
    def get_similar_recommendations(track_id: str, limit: int = Query(10, ge=1, le=30)):
        return get_track_recommendations(track_id=track_id, limit=limit)

    @router.get("/recommendations/mood/{mood}", response_model=RecommendationResponse)
    def get_mood_recommendations(mood: str, limit: int = Query(15, ge=1, le=50)):
        recs = content_recommender.recommend_by_mood(mood, limit=limit)
        return {
            "seed_track_id": None,
            "category": "mood",
            "value": mood,
            "total": len(recs),
            "recommendations": recs
        }

    @router.get("/recommendations/genre/{genre}", response_model=RecommendationResponse)
    def get_genre_recommendations(genre: str, limit: int = Query(15, ge=1, le=50)):
        recs = content_recommender.recommend_by_genre(genre, limit=limit)
        return {
            "seed_track_id": None,
            "category": "genre",
            "value": genre,
            "total": len(recs),
            "recommendations": recs
        }

    @router.get("/recommendations/instrument/{instrument}", response_model=RecommendationResponse)
    def get_instrument_recommendations(instrument: str, limit: int = Query(15, ge=1, le=50)):
        recs = content_recommender.recommend_by_instrument(instrument, limit=limit)
        return {
            "seed_track_id": None,
            "category": "instrument",
            "value": instrument,
            "total": len(recs),
            "recommendations": recs
        }

    @router.get("/playlist/recommendations")
    def get_playlist_recommendations(
        seeds: Optional[str] = Query(None, description="Comma-separated track IDs"),
        genres: Optional[str] = Query(None, description="Comma-separated genres"),
        moods: Optional[str] = Query(None, description="Comma-separated moods"),
        limit: int = Query(20, ge=5, le=50)
    ):
        seed_list = [s.strip() for s in seeds.split(",")] if seeds else []
        genre_list = [g.strip() for g in genres.split(",")] if genres else []
        mood_list = [m.strip() for m in moods.split(",")] if moods else []

        recs = content_recommender.smart_playlist_recommendation(
            seed_track_ids=seed_list,
            genres=genre_list,
            moods=mood_list,
            limit=limit
        )
        return {
            "total": len(recs),
            "recommendations": recs
        }

    @router.get("/artist/{name}")
    def get_artist_detail(name: str):
        data = catalog_service.get_artist(name)
        if not data:
            raise HTTPException(status_code=404, detail=f"Artist '{name}' not found")
        return data

    @router.get("/album/{name}")
    def get_album_detail(name: str):
        data = catalog_service.get_album(name)
        if not data:
            raise HTTPException(status_code=404, detail=f"Album '{name}' not found")
        return data

    @router.get("/audio/{track_id}")
    def get_audio_stream(track_id: str):
        # 1. Check if local MP3 file exists in backend/audio/{track_num}.mp3
        try:
            track_num = int(track_id.replace("track_", ""))
            local_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "audio", f"{track_num}.mp3")
            if os.path.exists(local_path):
                return FileResponse(local_path, media_type="audio/mpeg", filename=f"{track_id}.mp3")
        except Exception:
            pass

        # 2. Otherwise get track info and redirect to direct royalty-free Jamendo stream
        track = catalog_service.get_track_by_id(track_id)
        if not track:
            raise HTTPException(status_code=404, detail="Track not found")
        
        return RedirectResponse(url=track["audio_url"])

    @router.get("/history")
    def get_history_recommendations():
        # Curated recent discovery highlights
        sample_tracks = catalog_service.df.sample(n=min(8, len(catalog_service.df)), random_state=77)
        return {
            "recent_discoveries": [catalog_service._format_track(r) for _, r in sample_tracks.iterrows()]
        }

    # --- Spotify Dataset Endpoints (Preserving user's original recommendation system) ---
    @router.get("/spotify/search")
    def search_spotify_songs(q: str = Query(..., min_length=1), limit: int = Query(20, ge=1, le=50)):
        if not spotify_recommender or not spotify_recommender.is_ready():
            return {"total": 0, "songs": []}
        songs = spotify_recommender.search(q, limit=limit)
        return {"total": len(songs), "songs": songs}

    @router.get("/spotify/recommendations/{song_name}")
    def get_spotify_recommendations(song_name: str, top_n: int = Query(5, ge=1, le=15)):
        if not spotify_recommender or not spotify_recommender.is_ready():
            raise HTTPException(status_code=503, detail="Spotify recommendation model is not available")
        result = spotify_recommender.recommend(song_name, top_n=top_n)
        if not result["recommendations"]:
            raise HTTPException(status_code=404, detail=f"Song '{song_name}' not found in Spotify dataset")
        return result

    @router.get("/analytics")
    def get_catalog_analytics():
        if catalog_service.df is None:
            return {}
        
        genres = catalog_service.get_genres()[:10]
        moods = catalog_service.get_moods()[:10]
        instruments = catalog_service.get_instruments()[:10]

        # Duration distribution
        durations = catalog_service.df["duration"]
        under_2m = int((durations < 120).sum())
        two_to_four = int(((durations >= 120) & (durations <= 240)).sum())
        four_to_six = int(((durations > 240) & (durations <= 360)).sum())
        over_six = int((durations > 360).sum())

        return {
            "top_genres": genres,
            "top_moods": moods,
            "top_instruments": instruments,
            "duration_distribution": [
                {"range": "< 2 min", "count": under_2m},
                {"range": "2-4 min", "count": two_to_four},
                {"range": "4-6 min", "count": four_to_six},
                {"range": "> 6 min", "count": over_six}
            ],
            "total_tracks": len(catalog_service.df),
            "unique_artists": int(catalog_service.df["artist"].nunique()),
            "unique_albums": int(catalog_service.df["album"].nunique())
        }

    return router
