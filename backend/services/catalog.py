import os
import sys
from typing import Dict, List, Optional, Any, Set
import numpy as np

# Ensure project root is in sys.path so src can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from src.data_preprocessing import load_and_preprocess
from src.recommender import train_knn_model, recommend_by_id

class MusicCatalog:
    _instance = None

    def __init__(self):
        self.df = None
        self.X_scaled = None
        self.id_to_index: Dict[str, int] = {}
        self.knn_model = None
        self._search_records = []
        self._precomputed_dicts = []
        self._gallery_cache: Dict[str, List[Dict[str, Any]]] = {}
        
        # Fast index lookup sets for <1ms filtering
        self._genre_indices: Dict[str, List[int]] = {}
        self._mood_indices: Dict[str, Set[int]] = {}
        self._decade_indices: Dict[int, Set[int]] = {}
        self._initialized = False

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = MusicCatalog()
        return cls._instance

    def initialize(self, csv_path: Optional[str] = None):
        if self._initialized:
            return

        if not csv_path:
            candidates = [
                "data/spotify_dataset.csv",
                os.path.join("backend", "data", "spotify", "spotify_dataset.csv"),
                os.path.join("music-recommendation-system-main", "data", "spotify_dataset.csv")
            ]
            for cand in candidates:
                if os.path.exists(cand):
                    csv_path = cand
                    break

        if not csv_path or not os.path.exists(csv_path):
            raise FileNotFoundError(f"Spotify dataset CSV not found. Checked {csv_path}")

        print(f"[Catalog] Loading and preprocessing dataset from {csv_path}...")
        self.df, self.X_scaled = load_and_preprocess(csv_path)
        self.id_to_index = self.df.attrs.get("id_to_index", {})
        
        print(f"[Catalog] Loaded {len(self.df)} unique tracks. Fitting KNN recommendation model...")
        self.knn_model = train_knn_model(self.X_scaled, n_neighbors=50)

        print("[Catalog] Pre-converting rows to fast dictionary objects...")
        # Converting all rows once so _row_to_dict is an instant array lookup
        raw_records = self.df.to_dict(orient='records')
        self._precomputed_dicts = [self._format_dict(r) for r in raw_records]

        print("[Catalog] Building fast search index & integer filter indices...")
        names = self.df['name'].astype(str).values
        artists = self.df['artists_clean'].astype(str).values
        popularities = self.df['popularity'].values
        ids = self.df['id'].astype(str).values
        genres = self.df['genre'].values
        moods = self.df['mood'].values
        decades = self.df['decade'].values

        self._search_records = [
            (
                f"{names[i].lower()} {artists[i].lower()}",
                int(popularities[i]),
                ids[i],
                i
            )
            for i in range(len(self.df))
        ]

        # Build index maps (lists keep popularity order since df is pre-sorted)
        for i in range(len(self.df)):
            g = genres[i]
            m = moods[i]
            d = decades[i]

            if g not in self._genre_indices:
                self._genre_indices[g] = []
            self._genre_indices[g].append(i)

            if m not in self._mood_indices:
                self._mood_indices[m] = set()
            self._mood_indices[m].add(i)

            if d not in self._decade_indices:
                self._decade_indices[d] = set()
            self._decade_indices[d].add(i)

        print("[Catalog] MusicCatalog ready with ultra-fast instant lookups!")
        self._initialized = True

    def _format_dict(self, row: dict) -> Dict[str, Any]:
        return {
            "id": str(row["id"]),
            "name": str(row["name"]),
            "artists": str(row.get("artists_clean", row.get("artists", ""))),
            "year": int(row.get("year", 0)),
            "popularity": int(row.get("popularity", 0)),
            "duration_ms": int(row.get("duration_ms", 0)),
            "valence": float(row.get("valence", 0.5)),
            "energy": float(row.get("energy", 0.5)),
            "danceability": float(row.get("danceability", 0.5)),
            "loudness": float(row.get("loudness", -10.0)),
            "speechiness": float(row.get("speechiness", 0.05)),
            "acousticness": float(row.get("acousticness", 0.5)),
            "instrumentalness": float(row.get("instrumentalness", 0.0)),
            "liveness": float(row.get("liveness", 0.1)),
            "tempo": float(row.get("tempo", 120.0)),
            "key": int(row.get("key", 0)),
            "mode": int(row.get("mode", 1)),
            "mood": str(row.get("mood", "chill")),
            "genre": str(row.get("genre", "indie")),
            "decade": int(row.get("decade", 2000))
        }

    def get_track(self, track_id: str) -> Optional[Dict[str, Any]]:
        idx = self.id_to_index.get(track_id)
        if idx is None:
            return None
        return self._precomputed_dicts[idx]

    def search(self, query: str, limit: int = 8) -> List[Dict[str, Any]]:
        if not query or not query.strip():
            return self._precomputed_dicts[:limit]

        q_terms = [t for t in query.lower().split() if t]
        matches = []
        for text, popularity, track_id, idx in self._search_records:
            if all(term in text for term in q_terms):
                matches.append((popularity, idx))
                if len(matches) >= limit * 10:
                    break

        matches.sort(key=lambda item: item[0], reverse=True)
        return [self._precomputed_dicts[idx] for _, idx in matches[:limit]]

    def recommend(self, track_id: str, k: int = 8) -> List[Dict[str, Any]]:
        return recommend_by_id(track_id, self.df, self.X_scaled, self.knn_model, self.id_to_index, top_k=k)

    def get_gallery(
        self,
        genre: Optional[str] = None,
        mood: Optional[str] = None,
        decade: Optional[int] = None,
        limit: int = 60
    ) -> List[Dict[str, Any]]:
        g_key = (genre or "all").lower()
        m_key = (mood or "all").lower()
        d_key = decade or 0
        cache_key = f"{g_key}_{m_key}_{d_key}"

        if cache_key in self._gallery_cache:
            return self._gallery_cache[cache_key][:limit]

        # Determine primary candidate indices (in pre-sorted descending popularity order)
        candidates = self._genre_indices.get(g_key, range(len(self.df))) if g_key != "all" else range(len(self.df))
        
        has_mood = m_key != "all" and m_key in self._mood_indices
        mood_set = self._mood_indices[m_key] if has_mood else None

        has_decade = d_key > 0 and d_key in self._decade_indices
        decade_set = self._decade_indices[d_key] if has_decade else None

        results = []
        for idx in candidates:
            if mood_set is not None and idx not in mood_set:
                continue
            if decade_set is not None and idx not in decade_set:
                continue
            results.append(self._precomputed_dicts[idx])
            if len(results) >= limit:
                break

        self._gallery_cache[cache_key] = results
        return results

catalog = MusicCatalog.get_instance()
