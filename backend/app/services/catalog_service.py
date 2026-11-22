import os
import re
import logging
import pandas as pd
from typing import List, Dict, Any, Optional

logger = logging.getLogger("soundwave.catalog_service")

# Curated Apple Music styled color accents for genres & moods
GENRE_COLORS = {
    "electronic": "from-cyan-500 to-blue-600",
    "soundtrack": "from-amber-500 to-orange-700",
    "pop": "from-pink-500 to-rose-600",
    "ambient": "from-teal-400 to-emerald-700",
    "rock": "from-red-600 to-rose-900",
    "classical": "from-yellow-400 to-amber-700",
    "easylistening": "from-sky-400 to-indigo-600",
    "experimental": "from-purple-600 to-fuchsia-900",
    "alternative": "from-violet-500 to-purple-800",
    "chillout": "from-emerald-400 to-teal-600",
    "dance": "from-fuchsia-500 to-pink-700",
    "hiphop": "from-amber-600 to-yellow-800",
    "indie": "from-rose-400 to-red-600",
    "folk": "from-orange-400 to-amber-600",
    "orchestral": "from-indigo-600 to-purple-900",
    "metal": "from-zinc-700 to-neutral-950",
    "jazz": "from-amber-600 to-amber-950"
}

MOOD_COLORS = {
    "happy": "from-amber-400 to-orange-500",
    "film": "from-blue-600 to-indigo-900",
    "energetic": "from-rose-500 to-red-600",
    "relaxing": "from-teal-400 to-cyan-600",
    "emotional": "from-purple-500 to-pink-600",
    "melodic": "from-violet-500 to-indigo-600",
    "dark": "from-zinc-800 to-black",
    "epic": "from-amber-600 to-red-800",
    "dream": "from-fuchsia-400 to-purple-700",
    "love": "from-pink-500 to-rose-500",
    "inspiring": "from-sky-400 to-blue-600",
    "sad": "from-slate-600 to-zinc-800",
    "meditative": "from-emerald-500 to-teal-700",
    "uplifting": "from-yellow-400 to-amber-500",
    "party": "from-fuchsia-500 to-pink-600"
}

class CatalogService:
    def __init__(self, catalog_path: str):
        self.catalog_path = catalog_path
        self.df: Optional[pd.DataFrame] = None
        self._load()

    def _load(self):
        if not os.path.exists(self.catalog_path):
            logger.error("Catalog CSV not found at %s", self.catalog_path)
            return
        logger.info("Loading catalog dataframe from %s...", self.catalog_path)
        self.df = pd.read_csv(self.catalog_path)
        logger.info("Loaded catalog with %d tracks.", len(self.df))

    def _format_track(self, row: pd.Series) -> Dict[str, Any]:
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

    def get_tracks(
        self,
        page: int = 1,
        limit: int = 20,
        genre: Optional[str] = None,
        mood: Optional[str] = None,
        instrument: Optional[str] = None,
        artist: Optional[str] = None,
        album: Optional[str] = None,
        sort_by: str = "title"
    ) -> Dict[str, Any]:
        if self.df is None:
            return {"total": 0, "page": page, "limit": limit, "tracks": []}

        filtered = self.df

        if genre:
            g = genre.strip().lower()
            filtered = filtered[filtered["genres"].fillna("").str.lower().str.contains(g)]
        if mood:
            m = mood.strip().lower()
            filtered = filtered[filtered["moods"].fillna("").str.lower().str.contains(m)]
        if instrument:
            i = instrument.strip().lower()
            filtered = filtered[filtered["instruments"].fillna("").str.lower().str.contains(i)]
        if artist:
            a = artist.strip().lower()
            filtered = filtered[filtered["artist"].fillna("").str.lower().str.contains(a)]
        if album:
            al = album.strip().lower()
            filtered = filtered[filtered["album"].fillna("").str.lower().str.contains(al)]

        # Sorting
        if sort_by == "duration":
            filtered = filtered.sort_values(by="duration", ascending=False)
        elif sort_by == "release_date":
            filtered = filtered.sort_values(by="release_date", ascending=False)
        elif sort_by == "artist":
            filtered = filtered.sort_values(by="artist", ascending=True)
        else:
            filtered = filtered.sort_values(by="title", ascending=True)

        total = len(filtered)
        start = (page - 1) * limit
        end = start + limit
        page_df = filtered.iloc[start:end]

        tracks = [self._format_track(row) for _, row in page_df.iterrows()]
        return {"total": total, "page": page, "limit": limit, "tracks": tracks}

    def get_track_by_id(self, track_id: str) -> Optional[Dict[str, Any]]:
        if self.df is None:
            return None
        match = self.df[self.df["track_id"] == track_id]
        if match.empty:
            return None
        return self._format_track(match.iloc[0])

    def search(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        if self.df is None or not query.strip():
            return []

        q = query.strip().lower()
        
        # Scored search: title > artist > album > tags
        title_mask = self.df["title"].fillna("").str.lower().str.contains(q)
        artist_mask = self.df["artist"].fillna("").str.lower().str.contains(q)
        album_mask = self.df["album"].fillna("").str.lower().str.contains(q)
        tag_mask = self.df["all_tags"].fillna("").str.lower().str.contains(q)

        matched_title = self.df[title_mask]
        matched_artist = self.df[artist_mask & ~title_mask]
        matched_album = self.df[album_mask & ~title_mask & ~artist_mask]
        matched_tags = self.df[tag_mask & ~title_mask & ~artist_mask & ~album_mask]

        combined = pd.concat([matched_title, matched_artist, matched_album, matched_tags]).head(limit)
        return [self._format_track(row) for _, row in combined.iterrows()]

    def get_genres(self) -> List[Dict[str, Any]]:
        if self.df is None:
            return []
        genre_series = self.df["genres"].dropna().apply(lambda s: [g.strip().lower() for g in s.split(",") if g.strip()])
        all_genres = [g for sublist in genre_series for g in sublist]
        counts = pd.Series(all_genres).value_counts()

        items = []
        for g_name, count in counts.items():
            if count >= 10:
                color = GENRE_COLORS.get(g_name, "from-zinc-600 to-zinc-900")
                items.append({
                    "name": g_name,
                    "count": int(count),
                    "display_name": g_name.replace("_", " ").title(),
                    "color": color
                })
        return items

    def get_moods(self) -> List[Dict[str, Any]]:
        if self.df is None:
            return []
        mood_series = self.df["moods"].dropna().apply(lambda s: [m.strip().lower() for m in s.split(",") if m.strip()])
        all_moods = [m for sublist in mood_series for m in sublist]
        counts = pd.Series(all_moods).value_counts()

        items = []
        for m_name, count in counts.items():
            if count >= 5:
                color = MOOD_COLORS.get(m_name, "from-purple-600 to-slate-900")
                items.append({
                    "name": m_name,
                    "count": int(count),
                    "display_name": m_name.replace("_", " ").title(),
                    "color": color
                })
        return items

    def get_instruments(self) -> List[Dict[str, Any]]:
        if self.df is None:
            return []
        inst_series = self.df["instruments"].dropna().apply(lambda s: [i.strip().lower() for i in s.split(",") if i.strip()])
        all_instruments = [i for sublist in inst_series for i in sublist]
        counts = pd.Series(all_instruments).value_counts()

        items = []
        for i_name, count in counts.items():
            if count >= 5:
                items.append({
                    "name": i_name,
                    "count": int(count),
                    "display_name": i_name.replace("_", " ").title(),
                    "color": "from-zinc-700 to-zinc-900"
                })
        return items

    def get_artist(self, artist_name: str) -> Optional[Dict[str, Any]]:
        if self.df is None:
            return None
        mask = self.df["artist"].fillna("").str.lower() == artist_name.strip().lower()
        matched = self.df[mask]
        if matched.empty:
            return None
        
        tracks = [self._format_track(row) for _, row in matched.iterrows()]
        albums = matched["album"].dropna().unique().tolist()
        
        return {
            "name": matched.iloc[0]["artist"],
            "artist_id": matched.iloc[0].get("artist_id", ""),
            "total_tracks": len(tracks),
            "albums": albums,
            "cover_url": tracks[0]["cover_url"] if tracks else "",
            "tracks": tracks
        }

    def get_album(self, album_name: str) -> Optional[Dict[str, Any]]:
        if self.df is None:
            return None
        mask = self.df["album"].fillna("").str.lower() == album_name.strip().lower()
        matched = self.df[mask]
        if matched.empty:
            return None
        
        tracks = [self._format_track(row) for _, row in matched.iterrows()]
        first = matched.iloc[0]
        total_duration = sum(t["duration"] for t in tracks)
        
        return {
            "title": first["album"],
            "artist": first["artist"],
            "album_id": first.get("album_id", ""),
            "artist_id": first.get("artist_id", ""),
            "release_date": first.get("release_date", ""),
            "cover_url": first.get("cover_url", ""),
            "total_tracks": len(tracks),
            "total_duration": total_duration,
            "tracks": tracks
        }

    def get_featured_dashboard(self) -> Dict[str, Any]:
        if self.df is None:
            return {}

        # Featured banners (top melodic, electronic, chill tracks with verified covers)
        featured_pool = self.df[self.df["duration"] > 60].sample(n=min(5, len(self.df)), random_state=101)
        featured = [self._format_track(row) for _, row in featured_pool.iterrows()]

        # Trending tracks (electronic, pop, rock)
        trending_pool = self.df[self.df["genres"].fillna("").str.contains("electronic|pop|rock", case=False)].head(10)
        trending = [self._format_track(row) for _, row in trending_pool.iterrows()]

        # Made for you
        made_for_you_pool = self.df.sample(n=min(10, len(self.df)), random_state=42)
        made_for_you = [self._format_track(row) for _, row in made_for_you_pool.iterrows()]

        # Popular albums
        popular_album_names = self.df["album"].value_counts().head(6).index.tolist()
        albums = []
        for alb in popular_album_names:
            alb_data = self.get_album(alb)
            if alb_data:
                albums.append(alb_data)

        return {
            "featured": featured,
            "trending": trending,
            "made_for_you": made_for_you,
            "popular_albums": albums
        }
