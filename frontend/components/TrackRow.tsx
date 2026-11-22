"use client";

import React from "react";
import Link from "next/link";
import { Play, Pause, Heart, Plus, Disc3 } from "lucide-react";
import { Track } from "@/types/music";
import { usePlayer } from "@/context/PlayerContext";
import { useLibrary } from "@/context/LibraryContext";
import { formatTime, getArtworkGradient, cn } from "@/lib/utils";

interface TrackRowProps {
  track: Track;
  index: number;
  playlistContext?: Track[];
  onAddToPlaylist?: (track: Track) => void;
  showAlbum?: boolean;
}

export function TrackRow({
  track,
  index,
  playlistContext,
  onAddToPlaylist,
  showAlbum = true,
}: TrackRowProps) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const { isFavorite, toggleFavorite } = useLibrary();

  const isCurrent = currentTrack?.track_id === track.track_id;
  const favorited = isFavorite(track.track_id);

  const handleClickPlay = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, playlistContext);
    }
  };

  return (
    <div
      className={cn(
        "group flex items-center justify-between p-2.5 px-3 rounded-xl transition-all select-none hover:bg-white/[0.06]",
        isCurrent ? "bg-white/[0.08] text-white" : "text-zinc-400"
      )}
    >
      {/* Left: Index / Play & Artwork & Title */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Track Number / Play toggle */}
        <div className="w-6 flex items-center justify-center shrink-0">
          {isCurrent && isPlaying ? (
            <div className="flex items-end gap-[2px] h-3.5 group-hover:hidden">
              <span className="w-1 bg-[#FA405E] rounded-full animate-pulse h-full" />
              <span className="w-1 bg-[#FA405E] rounded-full animate-pulse h-2/3 delay-75" />
              <span className="w-1 bg-[#FA405E] rounded-full animate-pulse h-4/5 delay-150" />
            </div>
          ) : (
            <span
              className={cn(
                "text-xs font-mono font-medium group-hover:hidden",
                isCurrent ? "text-[#FA405E]" : "text-zinc-500"
              )}
            >
              {index + 1}
            </span>
          )}

          <button
            onClick={handleClickPlay}
            className="hidden group-hover:flex items-center justify-center text-white hover:text-[#FA405E] transition-colors"
            title={isCurrent && isPlaying ? "Pause" : "Play"}
          >
            {isCurrent && isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Thumbnail */}
        <div
          onClick={handleClickPlay}
          className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 shrink-0 border border-white/5 cursor-pointer relative"
        >
          {track.cover_url ? (
            <img
              src={track.cover_url}
              alt={track.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: getArtworkGradient(track.title) }}
            >
              <Disc3 className="w-4 h-4 text-white/70" />
            </div>
          )}
        </div>

        {/* Title & Artist */}
        <div className="flex flex-col min-w-0 flex-1">
          <span
            onClick={handleClickPlay}
            className={cn(
              "text-sm font-semibold truncate cursor-pointer transition-colors",
              isCurrent ? "text-[#FA405E]" : "text-white group-hover:text-white"
            )}
            title={track.title}
          >
            {track.title}
          </span>
          <Link
            href={`/artist/${encodeURIComponent(track.artist)}`}
            className="text-xs text-zinc-400 truncate hover:text-white transition-colors"
          >
            {track.artist}
          </Link>
        </div>
      </div>

      {/* Middle: Album Name (Optional on narrow screens) */}
      {showAlbum && track.album && (
        <div className="hidden md:block w-1/3 min-w-0 px-4">
          <Link
            href={`/album/${encodeURIComponent(track.album)}`}
            className="text-xs text-zinc-400 hover:text-white truncate block transition-colors"
            title={track.album}
          >
            {track.album}
          </Link>
        </div>
      )}

      {/* Right: Actions & Duration */}
      <div className="flex items-center gap-3 shrink-0 ml-3">
        {onAddToPlaylist && (
          <button
            onClick={() => onAddToPlaylist(track)}
            className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Add to Playlist"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => toggleFavorite(track)}
          className="p-1.5 text-zinc-500 hover:text-white transition-colors"
          title={favorited ? "Remove from Favorites" : "Favorite"}
        >
          <Heart
            className={cn(
              "w-4 h-4 transition-transform active:scale-125",
              favorited ? "fill-[#FA405E] text-[#FA405E]" : "hover:text-white"
            )}
          />
        </button>

        <span className="text-xs text-zinc-500 font-mono w-10 text-right">
          {formatTime(track.duration)}
        </span>
      </div>
    </div>
  );
}
