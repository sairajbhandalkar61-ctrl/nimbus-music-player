export type MoodBucket = 'euphoric' | 'chill' | 'melancholic' | 'intense' | 'local' | 'all';
export type GenreBucket = 'all' | 'pop' | 'rock' | 'hip-hop' | 'electronic' | 'acoustic' | 'jazz' | 'classical' | 'indie' | 'local';

export interface FeatureDeltas {
  energy: number;
  valence: number;
  danceability: number;
  tempo: number;
}

export interface Track {
  id: string;
  name: string;
  artists: string;
  year: number;
  popularity: number;
  duration_ms: number;
  valence: number;
  energy: number;
  danceability: number;
  loudness?: number;
  speechiness?: number;
  acousticness?: number;
  instrumentalness?: number;
  liveness?: number;
  tempo: number;
  key: number;
  mode: number;
  mood: string;
  genre?: string;
  decade: number;
  similarity?: number;
  feature_deltas?: FeatureDeltas;
  match_reason?: string;
  artworkUrl?: string | null;
  previewUrl?: string | null;
  trackViewUrl?: string | null;
  isLocal?: boolean;
  localUrl?: string;
}

export type ViewMode = 'stage' | 'mixer' | 'library' | 'gallery';
export type RightDrawerTab = 'match' | 'queue' | 'both';
export type FontWeightMode = 'regular' | 'bold';
export type RepeatMode = 'off' | 'all' | 'one';
export type SleepTimerMode = 'off' | '15m' | '30m' | '45m' | '60m' | 'end_of_track';
export type CrossfadeDuration = 0 | 2 | 4 | 6;
export type EqPresetId = 'flat' | 'bass_boost' | 'vocal' | 'lofi' | 'electronic' | 'late_night' | 'custom';

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: number;
}

export interface PlayHistoryItem {
  track: Track;
  playedAt: number;
}

export interface LyricLine {
  time: number;
  text: string;
}

export interface MixParams {
  valence: number;
  energy: number;
  danceability: number;
  acousticness: number;
  tempo: number;
  limit?: number;
}

export interface AudioFrequencyData {
  bass: number;
  mid: number;
  treble: number;
  overall: number;
  rawFrequencies: Uint8Array;
}
