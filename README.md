# 🎵 Nimbus — Minimalist Audio Player & Recommender

> Production-quality, motion-rich music player web app inspired by **daydreamplayer.com**, powered by a **FastAPI** backend, **scikit-learn Cosine Nearest Neighbors** on 157,685 tracks, and a **Vite + React + Three.js** frontend with a 120Hz audio-reactive WebGL fluid shader.

---

## 🌐 Live Link

You can open and enjoy Nimbus on any device (phone, laptop, tablet, desktop):

**[https://0b64133c61db90.app.lhr.life](https://0b64133c61db90.app.lhr.life)**

---

## 🌟 Key Features

1. **Orchestrated Wordmark Loader & Audio Unlock**
   - Letter-by-letter reveal for `N I M B U S`.
   - "Press to listen" interaction that unlocks the Web Audio Context.

2. **Kinetic Typography & Variable Weight Morph**
   - Bricolage Grotesque variable optical font.
   - Smooth `font-variation-settings` morph toggle (`REGULAR / BOLD`).
   - Kinetic letter-by-letter animated song title on track changes.

3. **120Hz Audio-Reactive Fluid Aurora Shader**
   - Full-screen Three.js WebGL shader reacting to:
     - **Valence**: Shifts color palette from moody deep indigo/cyan to warm amber/crimson.
     - **Energy**: Controls wave flow velocity and turbulence.
     - **Bass**: Dynamic ripple pulse and scale displacement in real time via Web Audio `AnalyserNode`.
   - Delta-time exponential damping ($1 - e^{-\lambda \Delta t}$) with zero per-frame allocations.

4. **Radial Visualizer & Inertia Vinyl Disc**
   - 64 radial frequency bars circling the album artwork.
   - Vinyl rotational physics with smooth acceleration and deceleration damping.
   - Fallback Web Audio ambient synthesizer when an iTunes preview is unavailable.

5. **Cosine KNN Machine Learning Engine**
   - 157,685 unique tracks from the Spotify dataset, deduplicated on `(name, artists)` and indexed by Spotify ID.
   - `StandardScaler` normalization over 9 acoustic features (`valence`, `energy`, `danceability`, `loudness`, `tempo`, `acousticness`, `instrumentalness`, `liveness`, `speechiness`).
   - Dynamic $k$-nearest neighbors query with exact cosine similarity match percentages.

6. **Curated Gallery & Instant Search**
   - Filter tracks by mood quadrants (Euphoric, Chill, Melancholic, Intense) and decade (1960s – 2020s).
   - Instant search modal (`⌘K` or `/`) with real-time popularity ranking.
   - Media Session API support (OS lock screen controls, metadata, and artwork).

---

## 🚀 Running Locally

### 1. Backend (FastAPI)
```bash
# Start FastAPI backend
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend (Vite + React)
```bash
# Navigate to frontend and start Vite dev server
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`.

---

## 🧪 Testing

Run the automated backend test suite:
```bash
python -m pytest backend/tests/test_api.py -v
```
All 6 tests verify:
- Health check
- Search ranking & case-insensitivity
- Dynamic recommendation with $k=10$
- Duplicate song title handling by Spotify ID
- Gallery mood and decade filtering
- Audio stream proxy allowlist & CORS Range headers

---

## 🛠️ API Reference

| Endpoint | Description |
|---|---|
| `GET /api/search?q=&limit=8` | Fast case-insensitive search ranked by popularity |
| `GET /api/track/{id}` | Metadata and audio features (valence, energy, tempo, key, etc.) |
| `GET /api/recommend/{id}?k=8` | Cosine KNN similarity recommendations with match scores |
| `GET /api/gallery?mood=&decade=&limit=60` | Curated gallery filterable by mood and decade |
| `GET /api/preview/{id}` | 600x600 artwork and 30s preview clip lookup |
| `GET /api/stream?url=` | Audio stream proxy with HTTP 206 Range & CORS headers |
