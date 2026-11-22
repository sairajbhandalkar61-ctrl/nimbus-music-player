"use client";

import React from "react";
import Link from "next/link";
import { Play, Disc3 } from "lucide-react";
import { getArtworkGradient, cn } from "@/lib/utils";
import { Track } from "@/types/music";
import { usePlayer } from "@/context/PlayerContext";

interface AlbumCardProps {
  title: string;
  artist: string;
  coverUrl?: string;
  totalTracks?: number;
  tracks?: Track[];
  className?: string;
}

export function AlbumCard({
  title,
  artist,
  coverUrl,
  totalTracks,
  tracks,
  className,
}: AlbumCardProps) {
  const { playTrack } = usePlayer();

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (tracks && tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col p-3 rounded-2xl glass-card transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-white/20 select-none",
        className
      )}
    >
      <Link href={`/album/${encodeURIComponent(title)}`} className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-zinc-900 border border-white/5">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: getArtworkGradient(title) }}
          >
            <Disc3 className="w-12 h-12 text-white/70" />
          </div>
        )}

        {/* Hover Floating Play Button */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-all flex items-end justify-end p-3">
          <button
            onClick={handlePlay}
            className="w-12 h-12 rounded-full bg-[#FA405E] hover:bg-[#E02E4C] text-white flex items-center justify-center shadow-xl shadow-[#FA405E]/40 transition-transform transform translate-y-2 group-hover:translate-y-0 hover:scale-105 active:scale-95"
            title="Play Album"
          >
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </button>
        </div>
      </Link>

      <div className="flex flex-col min-w-0">
        <Link
          href={`/album/${encodeURIComponent(title)}`}
          className="text-sm font-bold text-white truncate hover:text-[#FA405E] transition-colors"
          title={title}
        >
          {title}
        </Link>
        <Link
          href={`/artist/${encodeURIComponent(artist)}`}
          className="text-xs text-zinc-400 truncate hover:text-white transition-colors mt-0.5"
          title={artist}
        >
          {artist}
        </Link>
        {totalTracks !== undefined && (
          <span className="text-[11px] text-zinc-500 font-mono mt-1">
            {totalTracks} {totalTracks === 1 ? "track" : "tracks"}
          </span>
        )}
      </div>
    </div>
  );
}
