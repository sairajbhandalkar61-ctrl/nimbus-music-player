import json
import os
import re
import urllib.parse
from typing import Dict, Optional, Any
import httpx

from backend.paths import get_cache_dir

CACHE_DIR = get_cache_dir()
CACHE_FILE = os.path.join(CACHE_DIR, "itunes_cache.json")

class ITunesService:
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._load_cache()

    def _load_cache(self):
        if os.path.exists(CACHE_FILE):
            try:
                with open(CACHE_FILE, "r", encoding="utf-8") as f:
                    self._cache = json.load(f)
            except Exception as e:
                print(f"[iTunesService] Warning: Failed to read cache: {e}")
                self._cache = {}

    def _save_cache(self):
        try:
            os.makedirs(CACHE_DIR, exist_ok=True)
            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(self._cache, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[iTunesService] Warning: Failed to write cache: {e}")

    def _clean_query(self, title: str, artist: str) -> str:
        # Strip featured tags, remaster labels for better iTunes matching
        clean_title = re.sub(r"-\s*Remastered.*|\(Remastered.*\)|\(feat\..*?\)|\[.*?\]", "", title, flags=re.IGNORECASE).strip()
        first_artist = artist.split(",")[0].strip()
        return f"{clean_title} {first_artist}".strip()

    def _upgrade_artwork_url(self, url: Optional[str]) -> Optional[str]:
        if not url:
            return None
        # Replace e.g. 100x100bb.jpg or 60x60bb.jpg with 600x600bb.jpg
        return re.sub(r"\d+x\d+bb", "600x600bb", url)

    async def get_preview(self, track_id: str, title: str, artist: str) -> Dict[str, Any]:
        # Check cache by track_id
        if track_id in self._cache:
            return self._cache[track_id]

        search_query = self._clean_query(title, artist)
        url = f"https://itunes.apple.com/search?term={urllib.parse.quote(search_query)}&media=music&entity=song&limit=1"

        result = {
            "track_id": track_id,
            "artworkUrl": None,
            "previewUrl": None,
            "trackViewUrl": None,
            "artistName": artist,
            "trackName": title
        }

        try:
            async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
                resp = await client.get(url, headers={"User-Agent": "NimbusMusic/1.0"})
                if resp.status_code == 200:
                    data = resp.json()
                    results = data.get("results", [])
                    if results:
                        match = results[0]
                        raw_artwork = match.get("artworkUrl100") or match.get("artworkUrl60")
                        result["artworkUrl"] = self._upgrade_artwork_url(raw_artwork)
                        result["previewUrl"] = match.get("previewUrl")
                        result["trackViewUrl"] = match.get("trackViewUrl")
                        result["artistName"] = match.get("artistName", artist)
                        result["trackName"] = match.get("trackName", title)
        except Exception as e:
            print(f"[iTunesService] Error querying iTunes for '{title} - {artist}': {e}")

        # Store in cache and persist
        self._cache[track_id] = result
        self._save_cache()
        return result

itunes_service = ITunesService()
