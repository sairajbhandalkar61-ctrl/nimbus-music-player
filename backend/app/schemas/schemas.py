from typing import List, Optional
from pydantic import BaseModel, Field

class Track(BaseModel):
    track_id: str
    title: str
    artist: str
    album: str
    artist_id: Optional[str] = ""
    album_id: Optional[str] = ""
    duration: float = 0.0
    release_date: Optional[str] = ""
    genres: List[str] = []
    moods: List[str] = []
    instruments: List[str] = []
    audio_url: str
    cover_url: str
    license: str
    license_url: str
    attribution: str
    source_url: str
    is_playable: bool = True

class RecommendationItem(BaseModel):
    track: Track
    similarity_score: float
    explanation: str
    shared_genres: List[str] = []
    shared_moods: List[str] = []
    shared_instruments: List[str] = []

class RecommendationResponse(BaseModel):
    seed_track_id: Optional[str] = None
    category: Optional[str] = None
    value: Optional[str] = None
    total: int
    recommendations: List[RecommendationItem]

class TrackListResponse(BaseModel):
    total: int
    page: int
    limit: int
    tracks: List[Track]

class TagItem(BaseModel):
    name: str
    count: int
    display_name: str
    color: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    version: str
    total_tracks: int
    total_genres: int
    total_moods: int
    total_instruments: int
    spotify_tracks: int
    knn_trained: bool

class SpotifyTrack(BaseModel):
    name: str
    artist: str
    year: Optional[int] = None
    danceability: Optional[float] = None
    energy: Optional[float] = None
    valence: Optional[float] = None
    tempo: Optional[float] = None

class SpotifyRecommendationResponse(BaseModel):
    seed_song: str
    artist: Optional[str] = None
    recommendations: List[dict]
