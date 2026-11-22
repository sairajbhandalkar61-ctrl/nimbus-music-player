import { Track, RecommendationItem, TagItem, SpotifyRecommendation, SpotifyTrack } from "@/types/music";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`API error (${res.status}): ${err}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`Fetch failed for ${url}:`, error);
    throw error;
  }
}

export async function getHealth() {
  return fetchJson<{
    status: string;
    version: string;
    total_tracks: number;
    total_genres: number;
    total_moods: number;
    total_instruments: number;
    spotify_tracks: number;
    knn_trained: boolean;
  }>("/health");
}

export async function getFeaturedDashboard() {
  return fetchJson<{
    featured: Track[];
    trending: Track[];
    made_for_you: Track[];
    popular_albums: any[];
  }>("/dashboard/featured");
}

export async function getTracks(params: {
  page?: number;
  limit?: number;
  genre?: string;
  mood?: string;
  instrument?: string;
  artist?: string;
  album?: string;
  sort_by?: string;
}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page.toString());
  if (params.limit) query.set("limit", params.limit.toString());
  if (params.genre) query.set("genre", params.genre);
  if (params.mood) query.set("mood", params.mood);
  if (params.instrument) query.set("instrument", params.instrument);
  if (params.artist) query.set("artist", params.artist);
  if (params.album) query.set("album", params.album);
  if (params.sort_by) query.set("sort_by", params.sort_by);

  return fetchJson<{
    total: number;
    page: number;
    limit: number;
    tracks: Track[];
  }>(`/tracks?${query.toString()}`);
}

export async function getTrackById(trackId: string): Promise<Track> {
  return fetchJson<Track>(`/tracks/${encodeURIComponent(trackId)}`);
}

export async function searchTracks(q: string, limit = 20) {
  return fetchJson<{
    total: number;
    page: number;
    limit: number;
    tracks: Track[];
  }>(`/search?q=${encodeURIComponent(q)}&limit=${limit}`);
}

export async function getGenres(): Promise<TagItem[]> {
  return fetchJson<TagItem[]>("/genres");
}

export async function getMoods(): Promise<TagItem[]> {
  return fetchJson<TagItem[]>("/moods");
}

export async function getInstruments(): Promise<TagItem[]> {
  return fetchJson<TagItem[]>("/instruments");
}

export async function getTrackRecommendations(trackId: string, limit = 10) {
  return fetchJson<{
    seed_track_id: string;
    category: string;
    value: string;
    total: number;
    recommendations: RecommendationItem[];
  }>(`/recommendations/${encodeURIComponent(trackId)}?limit=${limit}`);
}

export async function getMoodRecommendations(mood: string, limit = 15) {
  return fetchJson<{
    seed_track_id?: string;
    category: string;
    value: string;
    total: number;
    recommendations: RecommendationItem[];
  }>(`/recommendations/mood/${encodeURIComponent(mood)}?limit=${limit}`);
}

export async function getGenreRecommendations(genre: string, limit = 15) {
  return fetchJson<{
    seed_track_id?: string;
    category: string;
    value: string;
    total: number;
    recommendations: RecommendationItem[];
  }>(`/recommendations/genre/${encodeURIComponent(genre)}?limit=${limit}`);
}

export async function getInstrumentRecommendations(instrument: string, limit = 15) {
  return fetchJson<{
    seed_track_id?: string;
    category: string;
    value: string;
    total: number;
    recommendations: RecommendationItem[];
  }>(`/recommendations/instrument/${encodeURIComponent(instrument)}?limit=${limit}`);
}

export async function getPlaylistRecommendations(options: {
  seeds?: string[];
  genres?: string[];
  moods?: string[];
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (options.seeds?.length) query.set("seeds", options.seeds.join(","));
  if (options.genres?.length) query.set("genres", options.genres.join(","));
  if (options.moods?.length) query.set("moods", options.moods.join(","));
  if (options.limit) query.set("limit", options.limit.toString());

  return fetchJson<{
    total: number;
    recommendations: RecommendationItem[];
  }>(`/playlist/recommendations?${query.toString()}`);
}

export async function getArtist(name: string) {
  return fetchJson<{
    name: string;
    artist_id: string;
    total_tracks: number;
    albums: string[];
    cover_url: string;
    tracks: Track[];
  }>(`/artist/${encodeURIComponent(name)}`);
}

export async function getAlbum(name: string) {
  return fetchJson<{
    title: string;
    artist: string;
    album_id: string;
    artist_id: string;
    release_date: string;
    cover_url: string;
    total_tracks: number;
    total_duration: number;
    tracks: Track[];
  }>(`/album/${encodeURIComponent(name)}`);
}

export async function searchSpotifySongs(q: string, limit = 20) {
  return fetchJson<{
    total: number;
    songs: SpotifyTrack[];
  }>(`/spotify/search?q=${encodeURIComponent(q)}&limit=${limit}`);
}

export async function getSpotifyRecommendations(songName: string, topN = 5) {
  return fetchJson<{
    seed_song: string;
    artist?: string;
    recommendations: SpotifyRecommendation[];
  }>(`/spotify/recommendations/${encodeURIComponent(songName)}?top_n=${topN}`);
}

export async function getAnalytics() {
  return fetchJson<{
    top_genres: TagItem[];
    top_moods: TagItem[];
    top_instruments: TagItem[];
    duration_distribution: { range: string; count: number }[];
    total_tracks: number;
    unique_artists: number;
    unique_albums: number;
  }>("/analytics");
}
