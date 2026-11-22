import { create } from 'zustand';
import { Track, ViewMode, FontWeightMode } from '../types';
import { audioEngine } from '../audio/audioEngine';
import { synthEngine } from '../audio/synthEngine';

interface PlayerStore {
  currentTrack: Track | null;
  queue: Track[];
  history: Track[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isUnlocked: boolean;
  isSynthesizing: boolean;
  activeView: ViewMode;
  fontWeight: FontWeightMode;
  isSearchOpen: boolean;
  isAboutOpen: boolean;
  isRecommendationOpen: boolean;
  recommendations: Track[];
  isLoadingRecs: boolean;

  unlockAudio: () => Promise<boolean>;
  setTrack: (track: Track, autoPlay?: boolean) => Promise<void>;
  togglePlay: () => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleFontWeight: () => void;
  setActiveView: (view: ViewMode) => void;
  setSearchOpen: (open: boolean) => void;
  setAboutOpen: (open: boolean) => void;
  setRecommendationOpen: (open: boolean) => void;
  fetchRecommendations: (trackId: string, k?: number) => Promise<void>;
  syncCurrentTime: (time: number, dur: number) => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentTrack: null,
  queue: [],
  history: [],
  isPlaying: false,
  currentTime: 0,
  duration: 30, // 30s preview default
  volume: 0.85,
  isMuted: false,
  isUnlocked: false,
  isSynthesizing: false,
  activeView: 'main',
  fontWeight: 'regular',
  isSearchOpen: false,
  isAboutOpen: false,
  isRecommendationOpen: false,
  recommendations: [],
  isLoadingRecs: false,

  unlockAudio: async () => {
    const success = await audioEngine.unlock();
    if (success) {
      set({ isUnlocked: true });
    }
    return success;
  },

  setTrack: async (track: Track, autoPlay: boolean = true) => {
    const { currentTrack, history } = get();
    if (currentTrack && currentTrack.id !== track.id) {
      set({ history: [currentTrack, ...history.slice(0, 20)] });
    }

    set({ currentTrack: track, currentTime: 0, isPlaying: false });

    // Fetch iTunes artwork and preview if not already present
    let enrichedTrack = { ...track };
    if (!track.artworkUrl || track.previewUrl === undefined) {
      try {
        const res = await fetch(`/api/preview/${track.id}`);
        if (res.ok) {
          const previewData = await res.json();
          enrichedTrack = {
            ...enrichedTrack,
            artworkUrl: previewData.artworkUrl || enrichedTrack.artworkUrl,
            previewUrl: previewData.previewUrl,
            trackViewUrl: previewData.trackViewUrl,
          };
          set({ currentTrack: enrichedTrack });
        }
      } catch (e) {
        console.warn('Error fetching preview for track:', e);
      }
    }

    // Automatically fetch recommendations for the new track
    get().fetchRecommendations(track.id, 8);

    if (autoPlay) {
      await get().play();
    }
  },

  play: async () => {
    const { currentTrack, isUnlocked, unlockAudio } = get();
    if (!currentTrack) return;

    if (!isUnlocked) {
      await unlockAudio();
    }

    audioEngine.updateMediaSession(
      currentTrack,
      () => get().next(),
      () => get().prev(),
      () => get().play(),
      () => get().pause()
    );

    if (currentTrack.previewUrl) {
      synthEngine.stop();
      set({ isSynthesizing: false });
      const streamProxyUrl = `/api/stream?url=${encodeURIComponent(currentTrack.previewUrl)}`;
      await audioEngine.playUrl(streamProxyUrl);
      set({ isPlaying: true });
    } else {
      // Fallback generative synth
      audioEngine.pause();
      synthEngine.start(currentTrack);
      set({ isPlaying: true, isSynthesizing: true, duration: 30 });
    }
  },

  pause: () => {
    const { isSynthesizing } = get();
    if (isSynthesizing) {
      synthEngine.stop();
    } else {
      audioEngine.pause();
    }
    set({ isPlaying: false });
  },

  togglePlay: async () => {
    const { isPlaying, currentTrack, play, pause } = get();
    if (!currentTrack) return;
    if (isPlaying) {
      pause();
    } else {
      await play();
    }
  },

  next: async () => {
    const { queue, recommendations, setTrack } = get();
    if (queue.length > 0) {
      const [nextTrack, ...rest] = queue;
      set({ queue: rest });
      await setTrack(nextTrack, true);
    } else if (recommendations.length > 0) {
      // Pick top recommendation
      const [nextRec, ...rest] = recommendations;
      set({ recommendations: rest });
      await setTrack(nextRec, true);
    }
  },

  prev: async () => {
    const { history, setTrack } = get();
    if (history.length > 0) {
      const [prevTrack, ...rest] = history;
      set({ history: rest });
      await setTrack(prevTrack, true);
    } else {
      get().seek(0);
    }
  },

  seek: (seconds: number) => {
    const { isSynthesizing } = get();
    if (!isSynthesizing) {
      audioEngine.seek(seconds);
    }
    set({ currentTime: seconds });
  },

  setVolume: (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    audioEngine.setVolume(clamped);
    set({ volume: clamped, isMuted: clamped === 0 });
  },

  toggleMute: () => {
    const { isMuted, volume } = get();
    if (isMuted) {
      audioEngine.setVolume(volume || 0.85);
      set({ isMuted: false });
    } else {
      audioEngine.setVolume(0);
      set({ isMuted: true });
    }
  },

  toggleFontWeight: () => {
    set((state) => ({
      fontWeight: state.fontWeight === 'regular' ? 'bold' : 'regular',
    }));
  },

  setActiveView: (view: ViewMode) => {
    set({ activeView: view });
  },

  setSearchOpen: (open: boolean) => set({ isSearchOpen: open }),
  setAboutOpen: (open: boolean) => set({ isAboutOpen: open }),
  setRecommendationOpen: (open: boolean) => set({ isRecommendationOpen: open }),

  fetchRecommendations: async (trackId: string, k: int = 8) => {
    set({ isLoadingRecs: true });
    try {
      const res = await fetch(`/api/recommend/${trackId}?k=${k}`);
      if (res.ok) {
        const data = await res.json();
        set({ recommendations: data.recommendations || [] });
      }
    } catch (e) {
      console.warn('Failed to load recommendations:', e);
    } finally {
      set({ isLoadingRecs: false });
    }
  },

  syncCurrentTime: (time: number, dur: number) => {
    set({
      currentTime: time,
      duration: dur && !isNaN(dur) && dur > 0 ? dur : 30,
    });
  },
}));
