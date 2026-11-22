import os
import logging
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import NearestNeighbors
from typing import List, Dict, Any, Optional

logger = logging.getLogger("soundwave.spotify_recommender")

class SpotifyRecommender:
    def __init__(self, data_path: str):
        self.data_path = data_path
        self.df: Optional[pd.DataFrame] = None
        self.X_scaled: Optional[np.ndarray] = None
        self.model: Optional[NearestNeighbors] = None
        self.song_col: str = "name"
        self.artist_col: str = "artists"
        self._load()

    def _load(self):
        if not os.path.exists(self.data_path):
            logger.warning("Spotify dataset not found at %s", self.data_path)
            return

        logger.info("Loading and preprocessing Spotify dataset from %s...", self.data_path)
        try:
            self.df = pd.read_csv(self.data_path)
            self.df.dropna(inplace=True)

            # Auto-detect song name column (preserving original logic from src/data_preprocessing.py)
            possible_song_cols = ['name', 'track_name', 'song', 'title']
            for col in possible_song_cols:
                if col in self.df.columns:
                    self.song_col = col
                    break

            for col in ['artists', 'artist', 'artist_name']:
                if col in self.df.columns:
                    self.artist_col = col
                    break

            features = [
                'danceability', 'energy', 'loudness',
                'speechiness', 'acousticness',
                'instrumentalness', 'liveness',
                'valence', 'tempo'
            ]
            valid_features = [f for f in features if f in self.df.columns]
            
            X = self.df[valid_features]
            scaler = StandardScaler()
            self.X_scaled = scaler.fit_transform(X)

            # Train KNN model (preserving original logic from src/recommender.py)
            self.model = NearestNeighbors(
                n_neighbors=15,
                metric='cosine',
                algorithm='brute'
            )
            self.model.fit(self.X_scaled)
            logger.info("Spotify KNN model trained with %d songs.", len(self.df))
        except Exception as e:
            logger.error("Failed to initialize Spotify recommender: %s", e)

    def is_ready(self) -> bool:
        return self.df is not None and self.model is not None

    def search(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        if not self.is_ready():
            return []
        q = query.strip().lower()
        mask = self.df[self.song_col].str.lower().str.contains(q, na=False)
        matched = self.df[mask].head(limit)
        
        results = []
        for _, row in matched.iterrows():
            results.append({
                "name": str(row[self.song_col]),
                "artist": str(row.get(self.artist_col, "Unknown")),
                "year": int(row.get("year", 0)) if "year" in row else None,
                "danceability": float(row.get("danceability", 0.0)),
                "energy": float(row.get("energy", 0.0)),
                "valence": float(row.get("valence", 0.0)),
                "tempo": float(row.get("tempo", 0.0)),
            })
        return results

    def recommend(self, song_name: str, top_n: int = 5) -> Dict[str, Any]:
        if not self.is_ready():
            return {"seed_song": song_name, "artist": None, "recommendations": []}

        # Case-insensitive match
        mask = self.df[self.song_col].str.lower() == song_name.strip().lower()
        if not mask.any():
            return {"seed_song": song_name, "artist": None, "recommendations": []}

        song_index = self.df[mask].index[0]
        artist_name = str(self.df.loc[song_index, self.artist_col]) if self.artist_col in self.df.columns else None

        distances, indices = self.model.kneighbors([self.X_scaled[song_index]], n_neighbors=top_n + 1)

        recommendations = []
        for dist, i in zip(distances[0][1:top_n + 1], indices[0][1:top_n + 1]):
            row = self.df.iloc[i]
            rec_artist = str(row[self.artist_col]) if self.artist_col in self.df.columns else "Unknown"
            recommendations.append({
                "song": str(row[self.song_col]),
                "artist": rec_artist,
                "similarity": round(float(1.0 - dist), 3),
                "danceability": float(row.get("danceability", 0.0)),
                "energy": float(row.get("energy", 0.0)),
                "valence": float(row.get("valence", 0.0)),
                "tempo": float(row.get("tempo", 0.0)),
            })

        return {
            "seed_song": str(self.df.loc[song_index, self.song_col]),
            "artist": artist_name,
            "recommendations": recommendations
        }
