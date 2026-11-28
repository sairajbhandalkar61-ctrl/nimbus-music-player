import { create } from 'zustand';
import {
  CrossfadeDuration,
  EqPresetId,
  FontWeightMode,
  PlayHistoryItem,
  Playlist,
  RepeatMode,
  RightDrawerTab,
  SleepTimerMode,
  Track,
  ViewMode,
} from '../types';
import { audioEngine } from '../audio/audioEngine';
import { synthEngine } from '../audio/synthEngine';
import { API_BASE_URL } from '../lib/config';
import {
  buildLibraryExportJson,
  loadCrossfade,
  loadEqSettings,
  loadLikedTracks,
  loadLocalAudioUrl,
  loadLocalTracks,
  loadPlayHistory,
  loadPlaylists,
  parseLibraryImportJson,
  parseLocalAudioFile,
  saveCrossfade,
  saveEqSettings,
  saveLikedTracks,
  saveLocalAudioBlob,
  saveLocalTracks,
  savePlayHistory,
  savePlaylists,
} from '../utils/libraryStorage';

export const EQ_PRESETS: Record<Exclude<EqPresetId, 'custom'>, { label: string; bands: number[] }> = {
  flat: { label: 'Flat', bands: [0, 0, 0, 0, 0] },
  bass_boost: { label: 'Bass Boost', bands: [6, 4, 0, -1, 1] },
  vocal: { label: 'Vocal', bands: [-3, -1, 4, 5, 2] },
  lofi: { label: 'Lo-Fi', bands: [3, 2, -2, -5, -7] },
  electronic: { label: 'Electronic', bands: [5, 2, -2, 3, 5] },
  late_night: { label: 'Late Night', bands: [2, 1, 0, -2, -4] },
};

const initialEq = loadEqSettings();
audioEngine.setEqBands(initialEq.bands);

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

  // Playback Modes & Timer
  shuffle: boolean;
  repeatMode: RepeatMode;
  autoPlayRadio: boolean;
  sleepTimerMode: SleepTimerMode;
  sleepTimerEndsAt: number | null;
  crossfadeSeconds: CrossfadeDuration;

  // EQ
  eqPreset: EqPresetId;
  eqBands: number[];

  // Local Library & History
  likedTracks: Track[];
  playlists: Playlist[];
  playHistory: PlayHistoryItem[];
  localTracks: Track[];

  // Panels & Drawers
  isSearchOpen: boolean;
  isAboutOpen: boolean;
  isRightDrawerOpen: boolean;
  rightDrawerTab: RightDrawerTab;
  isRecommendationOpen: boolean;
  isQueueOpen: boolean;
  isLibraryOpen: boolean;
  isEqOpen: boolean;
  isLyricsOpen: boolean;
  isMixerOpen: boolean;
  isAuraOpen: boolean;

  recommendations: Track[];
  isLoadingRecs: boolean;

  // Core Audio Actions
  unlockAudio: () => Promise<boolean>;
  setTrack: (track: Track, autoPlay?: boolean, forceRestart?: boolean) => Promise<void>;
  togglePlay: () => Promise<void>;
  play: (forceRestart?: boolean) => Promise<void>;
  pause: () => void;
  next: (isAutoEnded?: boolean) => Promise<void>;
  prev: () => Promise<void>;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  syncCurrentTime: (time: number, dur: number) => void;
  syncMediaSession: () => void;

  // Queue & Modes
  addToQueue: (track: Track) => void;
  playNextInQueue: (track: Track) => void;
  addMultipleToQueue: (tracks: Track[]) => void;
  removeFromQueue: (index: number) => void;
  moveQueueItem: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  toggleAutoPlayRadio: () => void;
  setSleepTimer: (mode: SleepTimerMode) => void;

  // EQ & Crossfade
  setEqPreset: (preset: EqPresetId) => void;
  setEqBand: (index: number, gainDb: number) => void;
  setCrossfade: (seconds: CrossfadeDuration) => void;

  // Library & Local Files
  toggleLike: (track?: Track | null) => void;
  createPlaylist: (name: string, initialTrack?: Track) => void;
  renamePlaylist: (id: string, name: string) => void;
  deletePlaylist: (id: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  importLocalFiles: (files: FileList | File[]) => Promise<Track[]>;
  exportLibrary: () => string;
  importLibrary: (rawJson: string) => boolean;

  // UI & Recommendations
  toggleFontWeight: () => void;
  setActiveView: (view: ViewMode) => void;
  setSearchOpen: (open: boolean) => void;
  setAboutOpen: (open: boolean) => void;
  setRecommendationOpen: (open: boolean) => void;
  setQueueOpen: (open: boolean) => void;
  setRightDrawer: (open: boolean, tab?: RightDrawerTab) => void;
  setRightDrawerTab: (tab: RightDrawerTab) => void;
  setLibraryOpen: (open: boolean) => void;
  setEqOpen: (open: boolean) => void;
  setLyricsOpen: (open: boolean) => void;
  setMixerOpen: (open: boolean) => void;
  setAuraOpen: (open: boolean) => void;
  fetchRecommendations: (trackId: string, k?: number) => Promise<void>;
}

const closeDrawers = {
  isRightDrawerOpen: false,
  isRecommendationOpen: false,
  isQueueOpen: false,
  isLibraryOpen: false,
  isLyricsOpen: false,
  isMixerOpen: false,
};

const closeModals = {
  isSearchOpen: false,
  isAboutOpen: false,
  isEqOpen: false,
  isAuraOpen: false,
};

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentTrack: null,
  queue: [],
  history: [],
  isPlaying: false,
  currentTime: 0,
  duration: 30,
  volume: 0.85,
  isMuted: false,
  isUnlocked: false,
  isSynthesizing: false,
  activeView: 'stage',
  fontWeight: 'regular',

  shuffle: false,
  repeatMode: 'off',
  autoPlayRadio: true,
  sleepTimerMode: 'off',
  sleepTimerEndsAt: null,
  crossfadeSeconds: loadCrossfade(),

  eqPreset: initialEq.preset,
  eqBands: initialEq.bands,

  likedTracks: loadLikedTracks(),
  playlists: loadPlaylists(),
  playHistory: loadPlayHistory(),
  localTracks: loadLocalTracks(),

  isSearchOpen: false,
  isAboutOpen: false,
  isRightDrawerOpen: false,
  rightDrawerTab: 'both',
  isRecommendationOpen: false,
  isQueueOpen: false,
  isLibraryOpen: false,
  isEqOpen: false,
  isLyricsOpen: false,
  isMixerOpen: false,
  isAuraOpen: false,

  recommendations: [],
  isLoadingRecs: false,

  unlockAudio: async () => {
    const success = await audioEngine.unlock();
    if (success) {
      audioEngine.setEqBands(get().eqBands);
      audioEngine.setVolume(get().isMuted ? 0 : get().volume);
      set({ isUnlocked: true });
    }
    return success;
  },

  syncMediaSession: () => {
    const { currentTrack, isPlaying } = get();
    if (!currentTrack) return;
    audioEngine.updateMediaSession(currentTrack, isPlaying, {
      onNext: () => { void get().next(false); },
      onPrev: () => { void get().prev(); },
      onPlay: () => { void get().play(); },
      onPause: () => { get().pause(); },
      onSeek: (time) => { get().seek(time); },
    });
  },

  setTrack: async (track: Track, autoPlay: boolean = true, forceRestart: boolean = false) => {
    const { currentTrack, history, playHistory } = get();
    if (currentTrack && currentTrack.id !== track.id) {
      set({ history: [currentTrack, ...history.slice(0, 30)] });
    }

    let resolvedTrack = { ...track };
    if (resolvedTrack.isLocal && !resolvedTrack.localUrl) {
      const restoredUrl = await loadLocalAudioUrl(resolvedTrack.id);
      if (restoredUrl) {
        resolvedTrack.localUrl = restoredUrl;
      }
    }

    // Record in persistent listening log when actually played or switched deliberately
    if (autoPlay) {
      const updatedLog = [{ track: resolvedTrack, playedAt: Date.now() }, ...playHistory].slice(0, 200);
      savePlayHistory(updatedLog);
      set({ playHistory: updatedLog });
    }

    set({ currentTrack: resolvedTrack, currentTime: 0, isPlaying: false });

    // Fetch iTunes artwork and preview if not a local file and preview missing
    if (!resolvedTrack.isLocal && (!resolvedTrack.artworkUrl || resolvedTrack.previewUrl === undefined)) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/preview/${resolvedTrack.id}`);
        if (res.ok) {
          const previewData = await res.json();
          resolvedTrack = {
            ...resolvedTrack,
            artworkUrl: previewData.artworkUrl || resolvedTrack.artworkUrl,
            previewUrl: previewData.previewUrl,
            trackViewUrl: previewData.trackViewUrl,
          };
          // Only update if user hasn't already switched tracks
          if (get().currentTrack?.id === resolvedTrack.id) {
            set({ currentTrack: resolvedTrack });
          }
        }
      } catch (e) {
        console.warn('Error fetching preview for track:', e);
      }
    }

    if (!resolvedTrack.isLocal) {
      void get().fetchRecommendations(resolvedTrack.id, 8);
    }

    get().syncMediaSession();

    if (autoPlay) {
      await get().play(forceRestart);
    }
  },

  play: async (forceRestart: boolean = false) => {
    const { currentTrack, isUnlocked, unlockAudio, crossfadeSeconds } = get();
    if (!currentTrack) return;

    if (!isUnlocked) {
      await unlockAudio();
    }

    if (currentTrack.isLocal) {
      const url = currentTrack.localUrl || (await loadLocalAudioUrl(currentTrack.id));
      if (url) {
        if (!currentTrack.localUrl) {
          set({ currentTrack: { ...currentTrack, localUrl: url } });
        }
        synthEngine.stop();
        set({ isSynthesizing: false });
        await audioEngine.playUrl(url, crossfadeSeconds, forceRestart);
        set({ isPlaying: true });
        get().syncMediaSession();
        return;
      }
    }

    if (currentTrack.previewUrl) {
      synthEngine.stop();
      set({ isSynthesizing: false });
      const streamProxyUrl = `${API_BASE_URL}/api/stream?url=${encodeURIComponent(currentTrack.previewUrl)}`;
      await audioEngine.playUrl(streamProxyUrl, crossfadeSeconds, forceRestart);
      set({ isPlaying: true });
    } else {
      audioEngine.pause();
      synthEngine.start(currentTrack);
      set({ isPlaying: true, isSynthesizing: true, duration: 30 });
    }

    get().syncMediaSession();
  },

  pause: () => {
    const { isSynthesizing } = get();
    if (isSynthesizing) {
      synthEngine.stop();
    } else {
      audioEngine.pause();
    }
    set({ isPlaying: false });
    get().syncMediaSession();
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

  next: async (isAutoEnded: boolean = false) => {
    const {
      queue,
      recommendations,
      currentTrack,
      shuffle,
      repeatMode,
      autoPlayRadio,
      setTrack,
      play,
      seek,
      pause,
    } = get();

    // Sleep timer set to "End of track" stops cleanly instead of advancing
    if (isAutoEnded && get().sleepTimerMode === 'end_of_track') {
      pause();
      audioEngine.resetSleepFade();
      set({ sleepTimerMode: 'off', sleepTimerEndsAt: null });
      return;
    }

    if (isAutoEnded && repeatMode === 'one' && currentTrack) {
      seek(0);
      await play(true);
      return;
    }

    if (queue.length > 0) {
      const idx = shuffle ? Math.floor(Math.random() * queue.length) : 0;
      const nextTrack = queue[idx];
      const nextQueue = queue.filter((_, i) => i !== idx);
      if (repeatMode === 'all' && currentTrack) {
        nextQueue.push(currentTrack);
      }
      set({ queue: nextQueue });
      await setTrack(nextTrack, true, true);
      return;
    }

    if (autoPlayRadio) {
      let recs = recommendations;
      if (recs.length === 0 && currentTrack && !currentTrack.isLocal) {
        await get().fetchRecommendations(currentTrack.id, 8);
        recs = get().recommendations;
      }

      if (recs.length > 0) {
        const idx = shuffle ? Math.floor(Math.random() * recs.length) : 0;
        const nextRec = recs[idx];
        set({ recommendations: recs.filter((_, i) => i !== idx) });
        await setTrack(nextRec, true, true);
        return;
      }
    }

    if (repeatMode === 'all' && currentTrack) {
      seek(0);
      await play(true);
      return;
    }

    pause();
  },

  prev: async () => {
    const { history, currentTime, setTrack, seek } = get();
    if (currentTime > 3) {
      seek(0);
      return;
    }
    if (history.length > 0) {
      const [prevTrack, ...rest] = history;
      set({ history: rest });
      await setTrack(prevTrack, true, true);
    } else {
      seek(0);
    }
  },

  seek: (seconds: number) => {
    const { isSynthesizing, duration } = get();
    const clamped = Math.max(0, Math.min(seconds, duration || 30));
    if (!isSynthesizing) {
      audioEngine.seek(clamped);
    }
    set({ currentTime: clamped });
    audioEngine.updateMediaSessionPosition(clamped, duration);
  },

  setVolume: (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    audioEngine.setVolume(clamped);
    set({ volume: clamped, isMuted: clamped === 0 });
  },

  toggleMute: () => {
    const { isMuted, volume } = get();
    if (isMuted) {
      const restored = volume || 0.85;
      audioEngine.setVolume(restored);
      set({ isMuted: false, volume: restored });
    } else {
      audioEngine.setVolume(0);
      set({ isMuted: true });
    }
  },

  syncCurrentTime: (time: number, dur: number) => {
    const safeDur = dur && !isNaN(dur) && isFinite(dur) && dur > 0 ? dur : 30;
    set({ currentTime: time, duration: safeDur });
    audioEngine.updateMediaSessionPosition(time, safeDur);
  },

  // Queue & Playback Modes
  addToQueue: (track: Track) => {
    set((state) => ({ queue: [...state.queue, track] }));
  },

  playNextInQueue: (track: Track) => {
    set((state) => ({ queue: [track, ...state.queue] }));
  },

  addMultipleToQueue: (tracks: Track[]) => {
    set((state) => ({ queue: [...state.queue, ...tracks] }));
  },

  removeFromQueue: (index: number) => {
    set((state) => ({ queue: state.queue.filter((_, i) => i !== index) }));
  },

  moveQueueItem: (fromIndex: number, toIndex: number) => {
    set((state) => {
      if (toIndex < 0 || toIndex >= state.queue.length || fromIndex === toIndex) return state;
      const updated = [...state.queue];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return { queue: updated };
    });
  },

  clearQueue: () => set({ queue: [] }),

  toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),

  cycleRepeatMode: () => {
    set((state) => {
      const order: RepeatMode[] = ['off', 'all', 'one'];
      const nextIdx = (order.indexOf(state.repeatMode) + 1) % order.length;
      return { repeatMode: order[nextIdx] };
    });
  },

  toggleAutoPlayRadio: () => set((state) => ({ autoPlayRadio: !state.autoPlayRadio })),

  setSleepTimer: (mode: SleepTimerMode) => {
    audioEngine.resetSleepFade();
    const minuteMap: Record<string, number> = {
      '15m': 15,
      '30m': 30,
      '45m': 45,
      '60m': 60,
    };
    const mins = minuteMap[mode];
    set({
      sleepTimerMode: mode,
      sleepTimerEndsAt: mins ? Date.now() + mins * 60 * 1000 : null,
    });
  },

  // EQ & Crossfade
  setEqPreset: (preset: EqPresetId) => {
    if (preset === 'custom') {
      set({ eqPreset: 'custom' });
      saveEqSettings({ preset: 'custom', bands: get().eqBands });
      return;
    }
    const bands = [...EQ_PRESETS[preset].bands];
    audioEngine.setEqBands(bands);
    saveEqSettings({ preset, bands });
    set({ eqPreset: preset, eqBands: bands });
  },

  setEqBand: (index: number, gainDb: number) => {
    const clamped = Math.max(-12, Math.min(12, gainDb));
    const bands = [...get().eqBands];
    bands[index] = clamped;
    audioEngine.setEqBands(bands);
    saveEqSettings({ preset: 'custom', bands });
    set({ eqPreset: 'custom', eqBands: bands });
  },

  setCrossfade: (seconds: CrossfadeDuration) => {
    saveCrossfade(seconds);
    set({ crossfadeSeconds: seconds });
  },

  // Library & Local Files
  toggleLike: (trackArg?: Track | null) => {
    const target = trackArg ?? get().currentTrack;
    if (!target) return;
    const { likedTracks } = get();
    const exists = likedTracks.some((t) => t.id === target.id);
    const updated = exists
      ? likedTracks.filter((t) => t.id !== target.id)
      : [target, ...likedTracks];
    saveLikedTracks(updated);
    set({ likedTracks: updated });
  },

  createPlaylist: (name: string, initialTrack?: Track) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newPlaylist: Playlist = {
      id: `pl-${Date.now().toString(36)}`,
      name: trimmed,
      tracks: initialTrack ? [initialTrack] : [],
      createdAt: Date.now(),
    };
    const updated = [newPlaylist, ...get().playlists];
    savePlaylists(updated);
    set({ playlists: updated });
  },

  renamePlaylist: (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const updated = get().playlists.map((p) => (p.id === id ? { ...p, name: trimmed } : p));
    savePlaylists(updated);
    set({ playlists: updated });
  },

  deletePlaylist: (id: string) => {
    const updated = get().playlists.filter((p) => p.id !== id);
    savePlaylists(updated);
    set({ playlists: updated });
  },

  addTrackToPlaylist: (playlistId: string, track: Track) => {
    const updated = get().playlists.map((p) => {
      if (p.id !== playlistId) return p;
      if (p.tracks.some((t) => t.id === track.id)) return p;
      return { ...p, tracks: [...p.tracks, track] };
    });
    savePlaylists(updated);
    set({ playlists: updated });
  },

  removeTrackFromPlaylist: (playlistId: string, trackId: string) => {
    const updated = get().playlists.map((p) =>
      p.id === playlistId ? { ...p, tracks: p.tracks.filter((t) => t.id !== trackId) } : p
    );
    savePlaylists(updated);
    set({ playlists: updated });
  },

  importLocalFiles: async (files: FileList | File[]) => {
    const accepted = Array.from(files).filter((f) =>
      /\.(mp3|wav|flac|m4a|ogg|aac)$/i.test(f.name) || f.type.startsWith('audio/')
    );
    const parsedTracks: Track[] = [];
    for (const file of accepted) {
      const track = parseLocalAudioFile(file);
      await saveLocalAudioBlob(track.id, file);
      parsedTracks.push(track);
    }
    if (parsedTracks.length > 0) {
      set((state) => {
        const existingIds = new Set(state.localTracks.map((t) => t.id));
        const uniqueNew = parsedTracks.filter((t) => !existingIds.has(t.id));
        const combined = [...uniqueNew, ...state.localTracks];
        saveLocalTracks(combined);
        return { localTracks: combined };
      });
    }
    return parsedTracks;
  },

  exportLibrary: () => {
    const { likedTracks, playlists, playHistory } = get();
    return buildLibraryExportJson(likedTracks, playlists, playHistory);
  },

  importLibrary: (rawJson: string) => {
    const parsed = parseLibraryImportJson(rawJson);
    if (!parsed) return false;
    saveLikedTracks(parsed.likedTracks);
    savePlaylists(parsed.playlists);
    savePlayHistory(parsed.playHistory);
    set({
      likedTracks: parsed.likedTracks,
      playlists: parsed.playlists,
      playHistory: parsed.playHistory,
    });
    return true;
  },

  // UI & Recommendations
  toggleFontWeight: () => {
    set((state) => ({
      fontWeight: state.fontWeight === 'regular' ? 'bold' : 'regular',
    }));
  },

  setActiveView: (view: ViewMode) => set({ activeView: view }),

  setSearchOpen: (open: boolean) => set({ ...closeModals, isSearchOpen: open }),
  setAboutOpen: (open: boolean) => set({ ...closeModals, isAboutOpen: open }),
  setEqOpen: (open: boolean) => set({ ...closeModals, isEqOpen: open }),
  setAuraOpen: (open: boolean) => set({ ...closeModals, isAuraOpen: open }),

  setRightDrawer: (open: boolean, tab?: RightDrawerTab) =>
    set((state) => ({
      ...closeDrawers,
      isRightDrawerOpen: open,
      rightDrawerTab: tab ?? state.rightDrawerTab,
      isRecommendationOpen: open && (tab ?? state.rightDrawerTab) !== 'queue',
      isQueueOpen: open && (tab ?? state.rightDrawerTab) !== 'match',
    })),
  setRightDrawerTab: (tab: RightDrawerTab) =>
    set({
      rightDrawerTab: tab,
      isRecommendationOpen: tab !== 'queue',
      isQueueOpen: tab !== 'match',
    }),
  setRecommendationOpen: (open: boolean) =>
    set({
      ...closeDrawers,
      isRightDrawerOpen: open,
      rightDrawerTab: open ? 'match' : get().rightDrawerTab,
      isRecommendationOpen: open,
    }),
  setQueueOpen: (open: boolean) =>
    set({
      ...closeDrawers,
      isRightDrawerOpen: open,
      rightDrawerTab: open ? 'queue' : get().rightDrawerTab,
      isQueueOpen: open,
    }),
  setLibraryOpen: (open: boolean) => set({ ...closeDrawers, isLibraryOpen: open, activeView: open ? 'library' : get().activeView }),
  setLyricsOpen: (open: boolean) => set({ ...closeDrawers, isLyricsOpen: open }),
  setMixerOpen: (open: boolean) => set({ ...closeDrawers, isMixerOpen: open, activeView: open ? 'mixer' : get().activeView }),

  fetchRecommendations: async (trackId: string, k: number = 8) => {
    if (trackId.startsWith('local-')) return;
    set({ isLoadingRecs: true });
    try {
      const res = await fetch(`${API_BASE_URL}/api/recommend/${trackId}?k=${k}`);
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
}));
