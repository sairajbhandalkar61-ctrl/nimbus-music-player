export type MoodBucket = 'euphoric' | 'chill' | 'melancholic' | 'intense' | 'all';
export type GenreBucket = 'all' | 'pop' | 'rock' | 'hip-hop' | 'electronic' | 'acoustic' | 'jazz' | 'classical' | 'indie';

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
  artworkUrl?: string | null;
  previewUrl?: string | null;
  trackViewUrl?: string | null;
}

export type ViewMode = 'main' | 'gallery';
export type FontWeightMode = 'regular' | 'bold';

export interface AudioFrequencyData {
  bass: number;
  mid: number;
  treble: number;
  overall: number;
  rawFrequencies: Uint8Array;
}
