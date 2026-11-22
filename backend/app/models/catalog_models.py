"""
PostgreSQL / SQLAlchemy ready database models for future persistence layer.
Supports: Users, Tracks, Artists, Albums, Playlists, PlaylistTracks, Favorites, ListeningHistory, UserPreferences.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class UserModel(BaseModel):
    id: str
    username: str
    email: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ArtistModel(BaseModel):
    id: str
    name: str
    bio: Optional[str] = None
    image_url: Optional[str] = None

class AlbumModel(BaseModel):
    id: str
    title: str
    artist_id: str
    release_date: Optional[str] = None
    cover_url: Optional[str] = None

class TrackModel(BaseModel):
    id: str
    title: str
    artist_id: str
    album_id: str
    duration: float
    genres: List[str] = []
    moods: List[str] = []
    instruments: List[str] = []
    audio_url: str
    cover_url: str
    license: str
    license_url: str
    attribution: str
    source_url: str

class PlaylistModel(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    cover_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    track_ids: List[str] = []

class FavoriteModel(BaseModel):
    id: str
    user_id: str
    track_id: str
    added_at: datetime = Field(default_factory=datetime.utcnow)

class ListeningHistoryModel(BaseModel):
    id: str
    user_id: str
    track_id: str
    played_at: datetime = Field(default_factory=datetime.utcnow)
    completed: bool = True
    duration_played: float = 0.0

class UserPreferencesModel(BaseModel):
    user_id: str
    preferred_genres: List[str] = []
    preferred_moods: List[str] = []
    preferred_instruments: List[str] = []
    volume: float = 0.8
    shuffle: bool = False
    repeat: str = "off"
