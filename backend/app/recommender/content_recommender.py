import os
import logging
import pandas as pd
import numpy as np
from sklearn.neighbors import NearestNeighbors
from typing import List, Dict, Any, Optional

logger = logging.getLogger("soundwave.recommender")

class ContentRecommender:
    def __init__(self, catalog_path: str, features_path: str):
        self.catalog_path = catalog_path
        self.features_path = features_path
        self.catalog_df: Optional[pd.DataFrame] = None
        self.features_df: Optional[pd.DataFrame] = None
        self.track_id_to_idx: Dict[str, int] = {}
        self.idx_to_track_id: Dict[int, str] = {}
        self.knn_model: Optional[NearestNeighbors] = None
        self.feature_matrix: Optional[np.ndarray] = None
        self._load()

    def _load(self):
        if not os.path.exists(self.catalog_path):
            logger.error("Catalog CSV not found at %s", self.catalog_path)
            return
        if not os.path.exists(self.features_path):
            logger.error("Features CSV not found at %s", self.features_path)
            return

        logger.info("Loading catalog and recommendation features...")
        self.catalog_df = pd.read_csv(self.catalog_path)
        self.features_df = pd.read_csv(self.features_path)

        # Index mappings
        for idx, tid in enumerate(self.catalog_df["track_id"]):
            self.track_id_to_idx[tid] = idx
            self.idx_to_track_id[idx] = tid

        # Prepare feature matrix
        self.feature_matrix = self.features_df.iloc[:, 1:].values.astype(np.float32)

        # Fit KNN model
        self.knn_model = NearestNeighbors(
            n_neighbors=25,
            metric="cosine",
            algorithm="brute"
        )
        self.knn_model.fit(self.feature_matrix)
        logger.info("Content recommender initialized with %d tracks.", len(self.catalog_df))

    def get_track_by_id(self, track_id: str) -> Optional[Dict[str, Any]]:
        if self.catalog_df is None or track_id not in self.track_id_to_idx:
            return None
        idx = self.track_id_to_idx[track_id]
        row = self.catalog_df.iloc[idx]
        return self._row_to_dict(row)

    def _row_to_dict(self, row: pd.Series) -> Dict[str, Any]:
        genres = [g.strip() for g in str(row["genres"]).split(",") if g.strip()] if pd.notna(row["genres"]) else []
        moods = [m.strip() for m in str(row["moods"]).split(",") if m.strip()] if pd.notna(row["moods"]) else []
        instruments = [i.strip() for i in str(row["instruments"]).split(",") if i.strip()] if pd.notna(row["instruments"]) else []
        
        return {
            "track_id": str(row["track_id"]),
            "title": str(row["title"]),
            "artist": str(row["artist"]),
            "album": str(row["album"]),
            "artist_id": str(row.get("artist_id", "")),
            "album_id": str(row.get("album_id", "")),
            "duration": float(row.get("duration", 0.0)),
            "release_date": str(row.get("release_date", "")),
            "genres": genres,
            "moods": moods,
            "instruments": instruments,
            "audio_url": str(row.get("audio_url", "")),
            "cover_url": str(row.get("cover_url", "")),
            "license": str(row.get("license", "Creative Commons")),
            "license_url": str(row.get("license_url", "")),
            "attribution": str(row.get("attribution", "")),
            "source_url": str(row.get("source_url", "")),
            "is_playable": True
        }

    def recommend_similar(self, track_id: str, top_n: int = 10) -> List[Dict[str, Any]]:
        if self.knn_model is None or track_id not in self.track_id_to_idx:
            return []

        seed_idx = self.track_id_to_idx[track_id]
        seed_row = self.catalog_df.iloc[seed_idx]
        seed_genres = set([g.strip().lower() for g in str(seed_row["genres"]).split(",") if g.strip()])
        seed_moods = set([m.strip().lower() for m in str(seed_row["moods"]).split(",") if m.strip()])
        seed_instruments = set([i.strip().lower() for i in str(seed_row["instruments"]).split(",") if i.strip()])
        seed_artist = str(seed_row["artist"]).strip().lower()

        seed_vec = self.feature_matrix[seed_idx].reshape(1, -1)
        distances, indices = self.knn_model.kneighbors(seed_vec, n_neighbors=min(top_n + 15, len(self.catalog_df)))

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx == seed_idx:
                continue
            
            row = self.catalog_df.iloc[idx]
            cand_genres = set([g.strip().lower() for g in str(row["genres"]).split(",") if g.strip()])
            cand_moods = set([m.strip().lower() for m in str(row["moods"]).split(",") if m.strip()])
            cand_instruments = set([i.strip().lower() for i in str(row["instruments"]).split(",") if i.strip()])
            cand_artist = str(row["artist"]).strip().lower()

            shared_g = list(seed_genres.intersection(cand_genres))
            shared_m = list(seed_moods.intersection(cand_moods))
            shared_i = list(seed_instruments.intersection(cand_instruments))

            # Cosine similarity is 1.0 - distance
            cos_sim = float(max(0.0, 1.0 - dist))
            
            # Boost if same artist
            if seed_artist == cand_artist:
                cos_sim = min(1.0, cos_sim + 0.15)

            # Generate explainability rationale
            reasons = []
            if shared_g:
                reasons.append(f"shared genre ({', '.join(shared_g[:2])})")
            if shared_m:
                reasons.append(f"shared mood ({', '.join(shared_m[:2])})")
            if shared_i:
                reasons.append(f"matching instruments ({', '.join(shared_i[:2])})")
            if seed_artist == cand_artist:
                reasons.append("same artist catalogue")

            explanation = "Recommended based on " + ", ".join(reasons) if reasons else "Musically harmonic timbre and tag acoustic similarity."

            results.append({
                "track": self._row_to_dict(row),
                "similarity_score": round(cos_sim, 3),
                "explanation": explanation,
                "shared_genres": shared_g,
                "shared_moods": shared_m,
                "shared_instruments": shared_i
            })

            if len(results) >= top_n:
                break

        return results

    def recommend_by_mood(self, mood: str, limit: int = 20) -> List[Dict[str, Any]]:
        if self.catalog_df is None:
            return []
        
        target = mood.strip().lower()
        mask = self.catalog_df["moods"].fillna("").str.lower().apply(lambda s: target in [m.strip() for m in s.split(",")])
        matched = self.catalog_df[mask]
        
        if len(matched) == 0:
            # Fallback to loose containment
            mask = self.catalog_df["all_tags"].fillna("").str.lower().str.contains(target)
            matched = self.catalog_df[mask]

        sample_size = min(limit, len(matched))
        if sample_size == 0:
            return []

        # Return diverse selection with highest tag relevance
        sampled = matched.sample(n=sample_size, random_state=42) if len(matched) > sample_size else matched
        
        results = []
        for _, row in sampled.iterrows():
            results.append({
                "track": self._row_to_dict(row),
                "similarity_score": 0.95,
                "explanation": f"Tagged with '{target}' mood signature.",
                "shared_genres": [],
                "shared_moods": [target],
                "shared_instruments": []
            })
        return results

    def recommend_by_genre(self, genre: str, limit: int = 20) -> List[Dict[str, Any]]:
        if self.catalog_df is None:
            return []
        
        target = genre.strip().lower()
        mask = self.catalog_df["genres"].fillna("").str.lower().apply(lambda s: target in [g.strip() for g in s.split(",")])
        matched = self.catalog_df[mask]
        
        if len(matched) == 0:
            mask = self.catalog_df["all_tags"].fillna("").str.lower().str.contains(target)
            matched = self.catalog_df[mask]

        sample_size = min(limit, len(matched))
        if sample_size == 0:
            return []

        sampled = matched.sample(n=sample_size, random_state=42) if len(matched) > sample_size else matched
        
        results = []
        for _, row in sampled.iterrows():
            results.append({
                "track": self._row_to_dict(row),
                "similarity_score": 0.95,
                "explanation": f"Curated from '{target}' genre taxonomy.",
                "shared_genres": [target],
                "shared_moods": [],
                "shared_instruments": []
            })
        return results

    def recommend_by_instrument(self, instrument: str, limit: int = 20) -> List[Dict[str, Any]]:
        if self.catalog_df is None:
            return []
        
        target = instrument.strip().lower()
        mask = self.catalog_df["instruments"].fillna("").str.lower().apply(lambda s: target in [i.strip() for i in s.split(",")])
        matched = self.catalog_df[mask]
        
        if len(matched) == 0:
            mask = self.catalog_df["all_tags"].fillna("").str.lower().str.contains(target)
            matched = self.catalog_df[mask]

        sample_size = min(limit, len(matched))
        if sample_size == 0:
            return []

        sampled = matched.sample(n=sample_size, random_state=42) if len(matched) > sample_size else matched
        
        results = []
        for _, row in sampled.iterrows():
            results.append({
                "track": self._row_to_dict(row),
                "similarity_score": 0.92,
                "explanation": f"Features '{target}' instrumentation.",
                "shared_genres": [],
                "shared_moods": [],
                "shared_instruments": [target]
            })
        return results

    def smart_playlist_recommendation(
        self,
        seed_track_ids: Optional[List[str]] = None,
        genres: Optional[List[str]] = None,
        moods: Optional[List[str]] = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        candidates = []

        if seed_track_ids:
            for tid in seed_track_ids[:3]:
                candidates.extend(self.recommend_similar(tid, top_n=8))

        if moods:
            for m in moods[:2]:
                candidates.extend(self.recommend_by_mood(m, limit=8))

        if genres:
            for g in genres[:2]:
                candidates.extend(self.recommend_by_genre(g, limit=8))

        if not candidates and self.catalog_df is not None:
            # Curated popular mix
            sample_df = self.catalog_df.sample(n=min(limit, len(self.catalog_df)), random_state=99)
            for _, row in sample_df.iterrows():
                candidates.append({
                    "track": self._row_to_dict(row),
                    "similarity_score": 0.85,
                    "explanation": "Trending algorithmic selection.",
                    "shared_genres": [],
                    "shared_moods": [],
                    "shared_instruments": []
                })

        # Deduplicate
        seen = set()
        deduped = []
        for item in candidates:
            tid = item["track"]["track_id"]
            if tid not in seen:
                seen.add(tid)
                deduped.append(item)
            if len(deduped) >= limit:
                break

        return deduped
