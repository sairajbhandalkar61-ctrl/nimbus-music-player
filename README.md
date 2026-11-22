# 🎵 Nimbus — Minimalist Audio Player & Recommender

![Nimbus Showcase Banner](nimbus_linkedin_banner.jpg)

> Production-quality, motion-rich music player web app inspired by **daydreamplayer.com**, powered by a **FastAPI** backend, **scikit-learn Cosine Nearest Neighbors** on 157,685 tracks, and a **Vite + React + Three.js** frontend with a 120Hz audio-reactive WebGL fluid shader.

---

## 🌐 Live Access (Mobile & Laptop/PC)

Nimbus is accessible across all your devices:

### 1. 🌍 Public Live Link (Works anywhere on any Phone, Laptop, Tablet, PC)
👉 **[https://logical-counties-specializing-shape.trycloudflare.com](https://logical-counties-specializing-shape.trycloudflare.com)**

### 2. 📱 Mobile Access on Same Wi-Fi (Ultra-fast LAN)
When connected to the same Wi-Fi network as this PC, open this on your phone:
👉 **`http://192.168.1.125:3000`**

### 3. 💻 Local Laptop/PC Access
👉 **`http://localhost:3000`**

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

## 🚀 How to Run

### Option A: One-Click Live Launch (With Public Tunnel & Mobile Access)
Double-click `run_live.bat` or run:
```bash
python run_live.py
```
This automatically builds the frontend, starts the unified server, generates an active public HTTPS tunnel link, and prints mobile and PC access URLs.

### Option B: Local Full-Stack Launch
```bash
python start.py
```
Available immediately at `http://localhost:3000` (PC) and `http://<YOUR_LOCAL_IP>:3000` (Mobile).

### Option C: Development Mode (Hot Reload)
```bash
# Terminal 1 - FastAPI Backend
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Vite React Frontend
cd frontend
npm run dev
```

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
