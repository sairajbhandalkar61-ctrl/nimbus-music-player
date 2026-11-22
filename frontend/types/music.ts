export interface Track {
  track_id: string;
  title: string;
  artist: string;
  album: string;
  artist_id?: string;
  album_id?: string;
  duration: number;
  release_date?: string;
  genres: string[];
  moods: string[];
  instruments: string[];
  audio_url: string;
  cover_url: string;
  license: string;
  license_url: string;
  attribution: string;
  source_url: string;
  is_playable?: boolean;
}

export interface RecommendationItem {
  track: Track;
  similarity_score: number;
  explanation: string;
  shared_genres: string[];
  shared_moods: string[];
  shared_instruments: string[];
}

export interface TagItem {
  name: string;
  count: number;
  display_name: string;
  color?: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  cover_url?: string;
  tracks: Track[];
  createdAt: string;
}

export interface SpotifyTrack {
  name: string;
  artist: string;
  year?: number;
  danceability?: number;
  energy?: number;
  valence?: number;
  tempo?: number;
}

export interface SpotifyRecommendation {
  song: string;
  artist: string;
  similarity: number;
  danceability?: number;
  energy?: number;
  valence?: number;
  tempo?: number;
}
