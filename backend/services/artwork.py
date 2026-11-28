import asyncio
import json
import os
import re
import urllib.parse
from typing import Dict, List, Optional, Any
import httpx

from backend.paths import get_cache_dir

CACHE_DIR = get_cache_dir()
ARTWORK_CACHE_FILE = os.path.join(CACHE_DIR, "artwork_cache.json")

class ArtworkService:
    def __init__(self):
        self._cache: Dict[str, str] = {}
        self._load_cache()

    def _load_cache(self):
        if os.path.exists(ARTWORK_CACHE_FILE):
            try:
                with open(ARTWORK_CACHE_FILE, "r", encoding="utf-8") as f:
                    self._cache = json.load(f)
            except Exception as e:
                print(f"[ArtworkService] Warning reading cache: {e}")
                self._cache = {}
        
        # Also migrate any existing itunes cache
        itunes_file = os.path.join(CACHE_DIR, "itunes_cache.json")
        if os.path.exists(itunes_file):
            try:
                with open(itunes_file, "r", encoding="utf-8") as f:
                    itunes_data = json.load(f)
                    for tid, val in itunes_data.items():
                        if isinstance(val, dict) and val.get("artworkUrl"):
                            if tid not in self._cache:
                                self._cache[tid] = val["artworkUrl"]
            except Exception:
                pass

    def _save_cache(self):
        try:
            os.makedirs(CACHE_DIR, exist_ok=True)
            with open(ARTWORK_CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(self._cache, f, ensure_ascii=False)
        except Exception as e:
            print(f"[ArtworkService] Warning saving cache: {e}")

    def get_cached(self, track_id: str) -> Optional[str]:
        return self._cache.get(track_id)

    async def resolve_one(
        self,
        client: httpx.AsyncClient,
        track_id: str,
        title: str = "",
        artist: str = ""
    ) -> Optional[str]:
        if track_id in self._cache:
            return self._cache[track_id]

        # 1. Try Spotify oEmbed (official, exact Spotify ID match, ultra-fast)
        try:
            spotify_url = f"https://open.spotify.com/oembed?url=https://open.spotify.com/track/{track_id}"
            resp = await client.get(spotify_url, timeout=3.5)
            if resp.status_code == 200:
                data = resp.json()
                thumb = data.get("thumbnail_url")
                if thumb:
                    self._cache[track_id] = thumb
                    return thumb
        except Exception:
            pass

        # 2. Fallback to iTunes Search API
        if title and artist:
            try:
                clean_title = re.sub(r"-\s*Remastered.*|\(Remastered.*\)|\(feat\..*?\)|\[.*?\]", "", title, flags=re.IGNORECASE).strip()
                first_artist = artist.split(",")[0].strip()
                query = f"{clean_title} {first_artist}".strip()
                itunes_url = f"https://itunes.apple.com/search?term={urllib.parse.quote(query)}&media=music&entity=song&limit=1"
                resp = await client.get(itunes_url, timeout=3.5)
                if resp.status_code == 200:
                    data = resp.json()
                    results = data.get("results", [])
                    if results:
                        art = results[0].get("artworkUrl100")
                        if art:
                            high_res = re.sub(r"\d+x\d+bb", "600x600bb", art)
                            self._cache[track_id] = high_res
                            return high_res
            except Exception:
                pass

        return None

    async def batch_resolve(self, tracks: List[Dict[str, Any]]) -> Dict[str, str]:
        missing = [t for t in tracks if t.get("id") and t.get("id") not in self._cache]
        if not missing:
            return {t["id"]: self._cache[t["id"]] for t in tracks if t.get("id") in self._cache}

        sem = asyncio.Semaphore(15)
        async with httpx.AsyncClient(headers={"User-Agent": "NimbusPlayer/1.0"}) as client:
            async def worker(t):
                async with sem:
                    return await self.resolve_one(
                        client,
                        t["id"],
                        t.get("name", ""),
                        t.get("artists", "")
                    )

            await asyncio.gather(*(worker(t) for t in missing), return_exceptions=True)

        self._save_cache()
        return {t["id"]: self._cache[t["id"]] for t in tracks if t.get("id") in self._cache}

artwork_service = ArtworkService()
