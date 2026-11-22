"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Track, Playlist } from "@/types/music";

interface LibraryContextType {
  favorites: Track[];
  playlists: Playlist[];
  toggleFavorite: (track: Track) => void;
  isFavorite: (trackId: string) => boolean;
  createPlaylist: (title: string, description?: string) => Playlist;
  deletePlaylist: (playlistId: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  getPlaylistById: (playlistId: string) => Playlist | undefined;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem("soundwave_favorites");
      if (savedFavs) {
        setFavorites(JSON.parse(savedFavs));
      }
      const savedPlaylists = localStorage.getItem("soundwave_playlists");
      if (savedPlaylists) {
        setPlaylists(JSON.parse(savedPlaylists));
      } else {
        // Initial default playlists
        const defaultPlaylists: Playlist[] = [
          {
            id: "pl-chill-vibes",
            title: "Chill & Ambient Focus",
            description: "Calm soundscapes for deep focus and study sessions.",
            tracks: [],
            createdAt: new Date().toISOString(),
          },
          {
            id: "pl-energy-boost",
            title: "Electronic Workout",
            description: "High-tempo electronic beats to power your morning.",
            tracks: [],
            createdAt: new Date().toISOString(),
          }
        ];
        setPlaylists(defaultPlaylists);
        localStorage.setItem("soundwave_playlists", JSON.stringify(defaultPlaylists));
      }
    } catch (e) {
      console.error("Error reading localStorage:", e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("soundwave_favorites", JSON.stringify(favorites));
    } catch {}
  }, [favorites, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("soundwave_playlists", JSON.stringify(playlists));
    } catch {}
  }, [playlists, isLoaded]);

  const toggleFavorite = useCallback((track: Track) => {
    setFavorites((prev) => {
      const exists = prev.some((t) => t.track_id === track.track_id);
      if (exists) {
        return prev.filter((t) => t.track_id !== track.track_id);
      } else {
        return [track, ...prev];
      }
    });
  }, []);

  const isFavorite = useCallback(
    (trackId: string) => {
      return favorites.some((t) => t.track_id === trackId);
    },
    [favorites]
  );

  const createPlaylist = useCallback((title: string, description = ""): Playlist => {
    const newPl: Playlist = {
      id: `pl-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      tracks: [],
      createdAt: new Date().toISOString(),
    };
    setPlaylists((prev) => [newPl, ...prev]);
    return newPl;
  }, []);

  const deletePlaylist = useCallback((playlistId: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
  }, []);

  const addTrackToPlaylist = useCallback((playlistId: string, track: Track) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        if (pl.tracks.some((t) => t.track_id === track.track_id)) return pl;
        return {
          ...pl,
          tracks: [...pl.tracks, track],
        };
      })
    );
  }, []);

  const removeTrackFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        return {
          ...pl,
          tracks: pl.tracks.filter((t) => t.track_id !== trackId),
        };
      })
    );
  }, []);

  const getPlaylistById = useCallback(
    (playlistId: string) => {
      return playlists.find((p) => p.id === playlistId);
    },
    [playlists]
  );

  return (
    <LibraryContext.Provider
      value={{
        favorites,
        playlists,
        toggleFavorite,
        isFavorite,
        createPlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        getPlaylistById,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error("useLibrary must be used within a LibraryProvider");
  }
  return context;
}
