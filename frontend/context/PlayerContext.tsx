"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { Track } from "@/types/music";

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: "off" | "all" | "one";
  queue: Track[];
  history: Track[];
  isExpanded: boolean;
  playbackError: string | null;
  playTrack: (track: Track, newQueue?: Track[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (seconds: number) => void;
  setVolume: (level: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  setIsExpanded: (expanded: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");
  const [queue, setQueue] = useState<Track[]>([]);
  const [history, setHistory] = useState<Track[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio instance on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const audio = new Audio();
    audio.preload = "auto";
    audio.volume = volume;
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoading(false);
    };

    const onWaiting = () => {
      setIsLoading(true);
    };

    const onPlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
      setPlaybackError(null);
    };

    const onPause = () => {
      setIsPlaying(false);
    };

    const onError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      setPlaybackError("Audio playback error. Trying alternative stream...");
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    // Load volume and shuffle state from LocalStorage
    try {
      const savedVol = localStorage.getItem("soundwave_volume");
      if (savedVol) {
        const v = parseFloat(savedVol);
        setVolumeState(v);
        audio.volume = v;
      }
      const savedQueue = localStorage.getItem("soundwave_queue");
      if (savedQueue) {
        setQueue(JSON.parse(savedQueue));
      }
    } catch {}

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
      audio.pause();
    };
  }, []);

  const playTrack = useCallback((track: Track, newQueue?: Track[]) => {
    if (!audioRef.current) return;
    setPlaybackError(null);
    setCurrentTrack(track);
    setIsLoading(true);

    if (newQueue) {
      setQueue(newQueue);
      try {
        localStorage.setItem("soundwave_queue", JSON.stringify(newQueue));
      } catch {}
    }

    // Set audio source: use track.audio_url
    audioRef.current.src = track.audio_url;
    audioRef.current.load();
    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true);
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn("Playback autoplay prevented or error:", err);
        setIsLoading(false);
        setIsPlaying(false);
      });

    // Update history
    setHistory((prev) => [track, ...prev.filter((t) => t.track_id !== track.track_id)].slice(0, 50));
    
    // Save to local storage
    try {
      const savedHist = JSON.parse(localStorage.getItem("soundwave_history") || "[]");
      const updated = [track, ...savedHist.filter((t: Track) => t.track_id !== track.track_id)].slice(0, 50);
      localStorage.setItem("soundwave_history", JSON.stringify(updated));
    } catch {}
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error("Play failed:", err));
    }
  }, [isPlaying, currentTrack]);

  const nextTrack = useCallback(() => {
    if (!queue.length) return;

    if (repeatMode === "one" && currentTrack && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      return;
    }

    let nextIndex = 0;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (currentTrack) {
      const currentIndex = queue.findIndex((t) => t.track_id === currentTrack.track_id);
      if (currentIndex !== -1 && currentIndex < queue.length - 1) {
        nextIndex = currentIndex + 1;
      } else if (repeatMode === "all") {
        nextIndex = 0;
      } else {
        setIsPlaying(false);
        return;
      }
    }

    const next = queue[nextIndex];
    if (next) {
      playTrack(next);
    }
  }, [queue, currentTrack, isShuffle, repeatMode, playTrack]);

  const prevTrack = useCallback(() => {
    if (!audioRef.current) return;
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    if (!queue.length || !currentTrack) return;
    const currentIndex = queue.findIndex((t) => t.track_id === currentTrack.track_id);
    if (currentIndex > 0) {
      playTrack(queue[currentIndex - 1]);
    } else if (queue.length > 0) {
      playTrack(queue[queue.length - 1]);
    }
  }, [queue, currentTrack, playTrack]);

  // Handle track ended
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      if (repeatMode === "one") {
        audio.currentTime = 0;
        audio.play();
      } else {
        nextTrack();
      }
    };

    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("ended", onEnded);
    };
  }, [repeatMode, nextTrack]);

  const seek = useCallback((seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  }, []);

  const setVolume = useCallback((level: number) => {
    const val = Math.max(0, Math.min(1, level));
    setVolumeState(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    setIsMuted(val === 0);
    try {
      localStorage.setItem("soundwave_volume", val.toString());
    } catch {}
  }, []);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === "off") return "all";
      if (prev === "all") return "one";
      return "off";
    });
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setQueue((prev) => {
      const next = [...prev, track];
      try {
        localStorage.setItem("soundwave_queue", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => {
      const next = prev.filter((_, i) => i !== index);
      try {
        localStorage.setItem("soundwave_queue", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    try {
      localStorage.removeItem("soundwave_queue");
    } catch {}
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isLoading,
        currentTime,
        duration,
        volume,
        isMuted,
        isShuffle,
        repeatMode,
        queue,
        history,
        isExpanded,
        playbackError,
        playTrack,
        togglePlay,
        nextTrack,
        prevTrack,
        seek,
        setVolume,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
        addToQueue,
        removeFromQueue,
        clearQueue,
        setIsExpanded,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
