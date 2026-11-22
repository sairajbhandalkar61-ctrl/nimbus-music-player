"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Library,
  Heart,
  ListMusic,
  History,
  Play,
  Plus,
  Music2,
  Trash2,
} from "lucide-react";
import { useLibrary } from "@/context/LibraryContext";
import { usePlayer } from "@/context/PlayerContext";
import { TrackRow } from "@/components/TrackRow";
import { cn } from "@/lib/utils";

function LibraryContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "favorites";
  const [activeTab, setActiveTab] = useState<"favorites" | "playlists" | "history">(
    (initialTab as any) || "favorites"
  );

  const { favorites, playlists, deletePlaylist } = useLibrary();
  const { history, playTrack } = usePlayer();

  const handlePlayAllFavorites = () => {
    if (favorites.length > 0) {
      playTrack(favorites[0], favorites);
    }
  };

  const handlePlayAllHistory = () => {
    if (history.length > 0) {
      playTrack(history[0], history);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Library className="w-5 h-5 text-[#FA405E]" />
            <span className="text-xs uppercase font-mono tracking-widest text-[#FA405E] font-bold">
              Personal Vault
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight font-heading mt-1">
            My Library
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage your favorite tracks, custom playlists, and recent listening sessions.
          </p>
        </div>

        {activeTab === "favorites" && favorites.length > 0 && (
          <button
            onClick={handlePlayAllFavorites}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#FA405E] hover:bg-[#E02E4C] text-white font-bold text-sm shadow-xl shadow-[#FA405E]/30 transition-all hover:scale-105"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Play Favorites ({favorites.length})</span>
          </button>
        )}

        {activeTab === "history" && history.length > 0 && (
          <button
            onClick={handlePlayAllHistory}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold text-sm transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Replay History ({history.length})</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab("favorites")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all",
            activeTab === "favorites"
              ? "bg-[#FA405E] text-white shadow-lg shadow-[#FA405E]/20"
              : "bg-white/5 text-zinc-400 hover:text-white"
          )}
        >
          <Heart className="w-4 h-4" />
          <span>Favorites ({favorites.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("playlists")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all",
            activeTab === "playlists"
              ? "bg-[#B86BE8] text-white shadow-lg shadow-[#B86BE8]/20"
              : "bg-white/5 text-zinc-400 hover:text-white"
          )}
        >
          <ListMusic className="w-4 h-4" />
          <span>Playlists ({playlists.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all",
            activeTab === "history"
              ? "bg-zinc-800 text-white"
              : "bg-white/5 text-zinc-400 hover:text-white"
          )}
        >
          <History className="w-4 h-4" />
          <span>Recently Played ({history.length})</span>
        </button>
      </div>

      {/* Content for Favorites */}
      {activeTab === "favorites" && (
        <div className="space-y-4">
          {favorites.length === 0 ? (
            <div className="py-20 text-center bg-[#17171C]/50 rounded-3xl border border-white/5 p-8">
              <Heart className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-lg font-bold text-white">No favorite tracks yet</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                Click the heart icon on any track in Listen Now, Browse, or Search to save it here.
              </p>
              <Link
                href="/"
                className="mt-6 inline-block px-5 py-2.5 rounded-full bg-[#FA405E] text-white text-xs font-bold"
              >
                Discover Music
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {favorites.map((track, idx) => (
                <TrackRow
                  key={track.track_id}
                  track={track}
                  index={idx}
                  playlistContext={favorites}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content for Playlists */}
      {activeTab === "playlists" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                className="group relative p-5 rounded-3xl bg-[#17171C]/80 border border-white/10 hover:border-[#FA405E]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FA405E] to-[#B86BE8] flex items-center justify-center mb-4 shadow-lg shadow-[#FA405E]/20">
                    <Music2 className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-heading truncate">{pl.title}</h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                    {pl.description || "Personalized track curation."}
                  </p>
                </div>

                <div className="pt-6 flex items-center justify-between border-t border-white/5 mt-4">
                  <span className="text-xs text-zinc-500 font-mono">
                    {pl.tracks.length} {pl.tracks.length === 1 ? "track" : "tracks"}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => deletePlaylist(pl.id)}
                      className="p-2 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-colors"
                      title="Delete Playlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <Link
                      href={`/playlist/${pl.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content for History */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="py-20 text-center bg-[#17171C]/50 rounded-3xl border border-white/5 p-8">
              <History className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-lg font-bold text-white">No listening history</p>
              <p className="text-xs text-zinc-400 mt-1">Songs you play will automatically appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {history.map((track, idx) => (
                <TrackRow
                  key={`${track.track_id}-${idx}`}
                  track={track}
                  index={idx}
                  playlistContext={history}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="py-32 text-center text-zinc-500">
          <div className="w-8 h-8 rounded-full border-2 border-[#FA405E] border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading your music library...</p>
        </div>
      }
    >
      <LibraryContent />
    </Suspense>
  );
}
