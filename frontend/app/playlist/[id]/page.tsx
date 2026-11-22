"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Play, Music2, Trash2, ArrowLeft, Clock } from "lucide-react";
import { useLibrary } from "@/context/LibraryContext";
import { usePlayer } from "@/context/PlayerContext";
import { TrackRow } from "@/components/TrackRow";
import { formatTime } from "@/lib/utils";

export default function PlaylistDetailPage() {
  const params = useParams();
  const playlistId = typeof params.id === "string" ? params.id : "";
  const router = useRouter();

  const { getPlaylistById, deletePlaylist, removeTrackFromPlaylist } = useLibrary();
  const { playTrack } = usePlayer();

  const playlist = getPlaylistById(playlistId);

  if (!playlist) {
    return (
      <div className="p-10 max-w-4xl mx-auto text-center space-y-4">
        <Music2 className="w-16 h-16 text-zinc-600 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Playlist Not Found</h2>
        <p className="text-sm text-zinc-400">This playlist does not exist or was removed.</p>
        <Link href="/library" className="inline-block px-5 py-2.5 rounded-full bg-[#FA405E] text-white text-xs font-bold">
          Back to Library
        </Link>
      </div>
    );
  }

  const totalDuration = playlist.tracks.reduce((acc, t) => acc + (t.duration || 0), 0);

  const handlePlayPlaylist = () => {
    if (playlist.tracks.length > 0) {
      playTrack(playlist.tracks[0], playlist.tracks);
    }
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${playlist.title}"?`)) {
      deletePlaylist(playlist.id);
      router.push("/library?tab=playlists");
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 select-none">
      <Link href="/library?tab=playlists" className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Playlists</span>
      </Link>

      {/* Playlist Hero Header */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-8 bg-gradient-to-b from-white/[0.05] to-transparent p-6 md:p-8 rounded-3xl border border-white/5">
        <div className="w-48 h-48 md:w-56 md:h-56 rounded-2xl bg-gradient-to-tr from-[#FA405E] to-[#B86BE8] flex items-center justify-center shadow-2xl shrink-0">
          <Music2 className="w-24 h-24 text-white" />
        </div>

        <div className="space-y-4 text-center md:text-left flex-1 min-w-0">
          <span className="text-xs uppercase tracking-widest text-[#FA405E] font-bold font-mono">
            User Playlist
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white font-heading tracking-tight">
            {playlist.title}
          </h1>

          <p className="text-sm text-zinc-300">
            {playlist.description || "Custom curated playlist collection."}
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-mono text-zinc-400">
            <span>{playlist.tracks.length} tracks</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {formatTime(totalDuration)}
            </span>
          </div>

          <div className="pt-2 flex items-center justify-center md:justify-start gap-3">
            {playlist.tracks.length > 0 && (
              <button
                onClick={handlePlayPlaylist}
                className="px-8 py-3.5 rounded-full bg-[#FA405E] hover:bg-[#E02E4C] text-white font-bold text-sm flex items-center gap-2.5 shadow-xl shadow-[#FA405E]/30 transition-all hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 fill-white ml-0.5" />
                <span>Play Playlist</span>
              </button>
            )}

            <button
              onClick={handleDelete}
              className="p-3 rounded-full bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-white/10 transition-colors"
              title="Delete Playlist"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tracklist */}
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-white mb-3">Songs</h3>
        {playlist.tracks.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 bg-[#17171C]/50 rounded-3xl border border-white/5 p-8">
            <p className="text-base font-semibold text-white">This playlist is empty</p>
            <p className="text-xs text-zinc-400 mt-1">Browse tracks and add them using the &quot;+&quot; button.</p>
            <Link href="/browse" className="mt-4 inline-block px-4 py-2 rounded-xl bg-[#FA405E] text-white text-xs font-bold">
              Find Tracks
            </Link>
          </div>
        ) : (
          playlist.tracks.map((track, idx) => (
            <div key={track.track_id} className="flex items-center justify-between group">
              <div className="flex-1 min-w-0">
                <TrackRow
                  track={track}
                  index={idx}
                  playlistContext={playlist.tracks}
                />
              </div>
              <button
                onClick={() => removeTrackFromPlaylist(playlist.id, track.track_id)}
                className="p-2 text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                title="Remove from playlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
