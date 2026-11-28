import gc
import os
import sys
from typing import Dict, List, Optional, Any, Set
import numpy as np

# Ensure project root is in sys.path so src can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.paths import get_resource_path
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
        self._cols: Dict[str, Any] = {}
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
                get_resource_path("data", "spotify_dataset.csv"),
                os.path.join(os.getcwd(), "data", "spotify_dataset.csv"),
                "data/spotify_dataset.csv",
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

        print("[Catalog] Indexing lightweight columnar arrays & search tables...")
        n = len(self.df)
        self._cols = {
            "id": self.df["id"].astype(str).to_numpy(),
            "name": self.df["name"].astype(str).to_numpy(),
            "artists": self.df["artists_clean"].astype(str).to_numpy(),
            "year": self.df["year"].to_numpy(dtype=np.int32) if "year" in self.df.columns else np.zeros(n, dtype=np.int32),
            "popularity": self.df["popularity"].to_numpy(dtype=np.int32) if "popularity" in self.df.columns else np.zeros(n, dtype=np.int32),
            "duration_ms": self.df["duration_ms"].to_numpy(dtype=np.int32) if "duration_ms" in self.df.columns else np.zeros(n, dtype=np.int32),
            "valence": self.df["valence"].to_numpy(dtype=np.float32) if "valence" in self.df.columns else np.full(n, 0.5, dtype=np.float32),
            "energy": self.df["energy"].to_numpy(dtype=np.float32) if "energy" in self.df.columns else np.full(n, 0.5, dtype=np.float32),
            "danceability": self.df["danceability"].to_numpy(dtype=np.float32) if "danceability" in self.df.columns else np.full(n, 0.5, dtype=np.float32),
            "loudness": self.df["loudness"].to_numpy(dtype=np.float32) if "loudness" in self.df.columns else np.full(n, -10.0, dtype=np.float32),
            "speechiness": self.df["speechiness"].to_numpy(dtype=np.float32) if "speechiness" in self.df.columns else np.full(n, 0.05, dtype=np.float32),
            "acousticness": self.df["acousticness"].to_numpy(dtype=np.float32) if "acousticness" in self.df.columns else np.full(n, 0.5, dtype=np.float32),
            "instrumentalness": self.df["instrumentalness"].to_numpy(dtype=np.float32) if "instrumentalness" in self.df.columns else np.zeros(n, dtype=np.float32),
            "liveness": self.df["liveness"].to_numpy(dtype=np.float32) if "liveness" in self.df.columns else np.full(n, 0.1, dtype=np.float32),
            "tempo": self.df["tempo"].to_numpy(dtype=np.float32) if "tempo" in self.df.columns else np.full(n, 120.0, dtype=np.float32),
            "key": self.df["key"].to_numpy(dtype=np.int32) if "key" in self.df.columns else np.zeros(n, dtype=np.int32),
            "mode": self.df["mode"].to_numpy(dtype=np.int32) if "mode" in self.df.columns else np.ones(n, dtype=np.int32),
            "mood": self.df["mood"].to_numpy(),
            "genre": self.df["genre"].to_numpy(),
            "decade": self.df["decade"].to_numpy(dtype=np.int32) if "decade" in self.df.columns else np.full(n, 2000, dtype=np.int32),
        }

        names = self._cols["name"]
        artists = self._cols["artists"]
        popularities = self._cols["popularity"]
        genres = self._cols["genre"]
        moods = self._cols["mood"]
        decades = self._cols["decade"]

        self._search_records = [
            (
                f"{names[i].lower()} {artists[i].lower()}",
                int(popularities[i]),
                i,
            )
            for i in range(n)
        ]

        # Build index maps (lists keep popularity order since df is pre-sorted)
        for i in range(n):
            g = str(genres[i])
            m = str(moods[i])
            d = int(decades[i])

            if g not in self._genre_indices:
                self._genre_indices[g] = []
            self._genre_indices[g].append(i)

            if m not in self._mood_indices:
                self._mood_indices[m] = set()
            self._mood_indices[m].add(i)

            if d not in self._decade_indices:
                self._decade_indices[d] = set()
            self._decade_indices[d].add(i)

        gc.collect()
        print("[Catalog] MusicCatalog ready with low-memory instant lookups!")
        self._initialized = True

    def _row_to_dict(self, idx: int) -> Dict[str, Any]:
        c = self._cols
        return {
            "id": str(c["id"][idx]),
            "name": str(c["name"][idx]),
            "artists": str(c["artists"][idx]),
            "year": int(c["year"][idx]),
            "popularity": int(c["popularity"][idx]),
            "duration_ms": int(c["duration_ms"][idx]),
            "valence": float(c["valence"][idx]),
            "energy": float(c["energy"][idx]),
            "danceability": float(c["danceability"][idx]),
            "loudness": float(c["loudness"][idx]),
            "speechiness": float(c["speechiness"][idx]),
            "acousticness": float(c["acousticness"][idx]),
            "instrumentalness": float(c["instrumentalness"][idx]),
            "liveness": float(c["liveness"][idx]),
            "tempo": float(c["tempo"][idx]),
            "key": int(c["key"][idx]),
            "mode": int(c["mode"][idx]),
            "mood": str(c["mood"][idx]),
            "genre": str(c["genre"][idx]),
            "decade": int(c["decade"][idx]),
        }

    def get_track(self, track_id: str) -> Optional[Dict[str, Any]]:
        idx = self.id_to_index.get(track_id)
        if idx is None:
            return None
        return self._row_to_dict(idx)

    def search(self, query: str, limit: int = 8) -> List[Dict[str, Any]]:
        if not query or not query.strip():
            return [self._row_to_dict(i) for i in range(min(limit, len(self._search_records)))]

        q_terms = [t for t in query.lower().split() if t]
        matches = []
        for text, popularity, idx in self._search_records:
            if all(term in text for term in q_terms):
                matches.append((popularity, idx))
                if len(matches) >= limit * 10:
                    break

        matches.sort(key=lambda item: item[0], reverse=True)
        return [self._row_to_dict(idx) for _, idx in matches[:limit]]

    def recommend(self, track_id: str, k: int = 8) -> List[Dict[str, Any]]:
        return recommend_by_id(track_id, self.df, self.X_scaled, self.knn_model, self.id_to_index, top_k=k)

    def mix(
        self,
        valence: float = 0.5,
        energy: float = 0.5,
        danceability: float = 0.5,
        acousticness: float = 0.5,
        tempo: float = 120.0,
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        """Find tracks closest to target acoustic parameters via standardized Euclidean distance."""
        if self.df is None or self.X_scaled is None:
            return []

        scaler = self.df.attrs.get("scaler")
        features = self.df.attrs.get("features", [])
        target_map = {
            "valence": float(np.clip(valence, 0.0, 1.0)),
            "energy": float(np.clip(energy, 0.0, 1.0)),
            "danceability": float(np.clip(danceability, 0.0, 1.0)),
            "acousticness": float(np.clip(acousticness, 0.0, 1.0)),
            "tempo": float(np.clip(tempo, 40.0, 220.0)),
        }

        col_indices = [features.index(name) for name in target_map if name in features]
        if not col_indices or scaler is None:
            return [self._row_to_dict(i) for i in range(min(limit, len(self._search_records)))]

        target_scaled = np.array(
            [
                (target_map[features[c]] - scaler.mean_[c]) / (scaler.scale_[c] or 1.0)
                for c in col_indices
            ],
            dtype=np.float32,
        )

        X_sub = self.X_scaled[:, col_indices]
        dists = np.linalg.norm(X_sub - target_scaled, axis=1)

        pop = self._cols["popularity"].astype(np.float32) / 100.0
        score = dists - (pop * 0.12)

        k = min(limit, len(score))
        top_idx = np.argpartition(score, k - 1)[:k]
        top_idx = top_idx[np.argsort(score[top_idx])]

        results = []
        for idx in top_idx:
            item = self._row_to_dict(int(idx))
            item["similarity"] = round(float(1.0 / (1.0 + dists[int(idx)])), 4)
            results.append(item)
        return results

    def get_gallery(
        self,
        genre: Optional[str] = None,
        mood: Optional[str] = None,
        decade: Optional[int] = None,
        limit: int = 60,
    ) -> List[Dict[str, Any]]:
        g_key = (genre or "all").lower()
        m_key = (mood or "all").lower()
        d_key = decade or 0
        cache_key = f"{g_key}_{m_key}_{d_key}"

        if cache_key in self._gallery_cache:
            return self._gallery_cache[cache_key][:limit]

        total = len(self._search_records)
        candidates = self._genre_indices.get(g_key, range(total)) if g_key != "all" else range(total)

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
            results.append(self._row_to_dict(idx))
            if len(results) >= limit:
                break

        self._gallery_cache[cache_key] = results
        return results


catalog = MusicCatalog.get_instance()
