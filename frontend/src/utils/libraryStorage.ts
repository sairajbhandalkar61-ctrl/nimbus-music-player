import { CrossfadeDuration, EqPresetId, PlayHistoryItem, Playlist, Track } from '../types';

const KEYS = {
  LIKED: 'nimbus_liked_tracks_v1',
  PLAYLISTS: 'nimbus_playlists_v1',
  HISTORY: 'nimbus_play_history_v1',
  LOCAL_TRACKS: 'nimbus_local_tracks_v1',
  EQ: 'nimbus_eq_settings_v1',
  CROSSFADE: 'nimbus_crossfade_v1',
};

const IDB_NAME = 'nimbus_local_audio_db';
const IDB_STORE = 'audio_files';

function safeParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSave<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`[Storage] Failed saving ${key}:`, e);
  }
}

/** Strip transient blob: URLs before serializing to JSON/localStorage */
export function sanitizeTrackForStorage(track: Track): Track {
  if (!track.localUrl) return track;
  const { localUrl: _omit, ...rest } = track;
  return rest;
}

export function loadLikedTracks(): Track[] {
  return safeParse<Track[]>(KEYS.LIKED, []);
}

export function saveLikedTracks(tracks: Track[]): void {
  safeSave(KEYS.LIKED, tracks.map(sanitizeTrackForStorage));
}

export function loadPlaylists(): Playlist[] {
  return safeParse<Playlist[]>(KEYS.PLAYLISTS, []);
}

export function savePlaylists(playlists: Playlist[]): void {
  safeSave(
    KEYS.PLAYLISTS,
    playlists.map((p) => ({
      ...p,
      tracks: p.tracks.map(sanitizeTrackForStorage),
    }))
  );
}

export function loadPlayHistory(): PlayHistoryItem[] {
  return safeParse<PlayHistoryItem[]>(KEYS.HISTORY, []);
}

export function savePlayHistory(history: PlayHistoryItem[]): void {
  safeSave(
    KEYS.HISTORY,
    history.slice(0, 200).map((item) => ({
      playedAt: item.playedAt,
      track: sanitizeTrackForStorage(item.track),
    }))
  );
}

export function loadLocalTracks(): Track[] {
  return safeParse<Track[]>(KEYS.LOCAL_TRACKS, []);
}

export function saveLocalTracks(tracks: Track[]): void {
  safeSave(KEYS.LOCAL_TRACKS, tracks.map(sanitizeTrackForStorage));
}

export interface StoredEqSettings {
  preset: EqPresetId;
  bands: number[];
}

export function loadEqSettings(): StoredEqSettings {
  const parsed = safeParse<StoredEqSettings | null>(KEYS.EQ, null);
  if (parsed && Array.isArray(parsed.bands) && parsed.bands.length === 5) {
    return parsed;
  }
  return { preset: 'flat', bands: [0, 0, 0, 0, 0] };
}

export function saveEqSettings(settings: StoredEqSettings): void {
  safeSave(KEYS.EQ, settings);
}

export function loadCrossfade(): CrossfadeDuration {
  const val = safeParse<number>(KEYS.CROSSFADE, 0);
  if (val === 2 || val === 4 || val === 6) return val;
  return 0;
}

export function saveCrossfade(seconds: CrossfadeDuration): void {
  safeSave(KEYS.CROSSFADE, seconds);
}

/** IndexedDB helpers so imported local audio files persist across sessions */
function openAudioDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveLocalAudioBlob(trackId: string, file: Blob): Promise<void> {
  try {
    const db = await openAudioDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(file, trackId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (e) {
    console.warn('[IDB] Could not persist local audio blob:', e);
  }
}

export async function loadLocalAudioUrl(trackId: string): Promise<string | null> {
  try {
    const db = await openAudioDb();
    const blob = await new Promise<Blob | undefined>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(trackId);
      req.onsuccess = () => resolve(req.result as Blob | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (blob) {
      return URL.createObjectURL(blob);
    }
  } catch (e) {
    console.warn('[IDB] Could not load local audio blob:', e);
  }
  return null;
}

/** Parse basic filename metadata ("Artist - Title.mp3") into a playable Track */
export function parseLocalAudioFile(file: File): Track {
  const baseName = file.name.replace(/\.[^/.]+$/, '').trim();
  let artists = 'Local Audio';
  let title = baseName || 'Untitled Track';

  const dashMatch = baseName.split(/\s+[-\u2013\u2014]\s+/);
  if (dashMatch.length >= 2 && dashMatch[0].trim() && dashMatch[1].trim()) {
    artists = dashMatch[0].trim();
    title = dashMatch.slice(1).join(' - ').trim();
  }

  let hash = 0;
  const seed = `${file.name}:${file.size}`;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const id = `local-${Math.abs(hash).toString(36)}`;
  const nowYear = new Date().getFullYear();

  return {
    id,
    name: title,
    artists,
    year: nowYear,
    popularity: 100,
    duration_ms: 180000,
    valence: 0.55,
    energy: 0.65,
    danceability: 0.6,
    acousticness: 0.25,
    tempo: 120,
    key: 0,
    mode: 1,
    mood: 'local',
    genre: 'local',
    decade: Math.floor(nowYear / 10) * 10,
    isLocal: true,
    localUrl: URL.createObjectURL(file),
    previewUrl: null,
  };
}

export interface LibraryExportPayload {
  version: number;
  exportedAt: string;
  likedTracks: Track[];
  playlists: Playlist[];
  playHistory: PlayHistoryItem[];
}

export function buildLibraryExportJson(
  likedTracks: Track[],
  playlists: Playlist[],
  playHistory: PlayHistoryItem[]
): string {
  const payload: LibraryExportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    likedTracks: likedTracks.map(sanitizeTrackForStorage),
    playlists: playlists.map((p) => ({
      ...p,
      tracks: p.tracks.map(sanitizeTrackForStorage),
    })),
    playHistory: playHistory.map((h) => ({
      playedAt: h.playedAt,
      track: sanitizeTrackForStorage(h.track),
    })),
  };
  return JSON.stringify(payload, null, 2);
}

export function parseLibraryImportJson(raw: string): LibraryExportPayload | null {
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return null;
    const likedTracks = Array.isArray(data.likedTracks) ? data.likedTracks : [];
    const playlists = Array.isArray(data.playlists) ? data.playlists : [];
    const playHistory = Array.isArray(data.playHistory) ? data.playHistory : [];
    return {
      version: Number(data.version) || 1,
      exportedAt: String(data.exportedAt || new Date().toISOString()),
      likedTracks,
      playlists,
      playHistory,
    };
  } catch {
    return null;
  }
}
