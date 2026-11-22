"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  Volume1,
  VolumeX,
  Maximize2,
  Heart,
  ListMusic,
  Disc3,
  Loader2,
  Sparkles,
} from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";
import { useLibrary } from "@/context/LibraryContext";
import { formatTime, getArtworkGradient, cn } from "@/lib/utils";

export function Player() {
  const {
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
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    setIsExpanded,
    removeFromQueue,
    clearQueue,
    playTrack,
  } = usePlayer();

  const { isFavorite, toggleFavorite } = useLibrary();
  const [showQueue, setShowQueue] = useState(false);

  if (!currentTrack) {
    return null;
  }

  const favorited = isFavorite(currentTrack.track_id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Persistent Bottom Bar */}
      <footer className="fixed bottom-0 left-0 right-0 h-24 bg-[#17171C]/95 backdrop-blur-2xl border-t border-white/10 z-50 px-4 md:px-8 flex items-center justify-between select-none shadow-2xl">
        {/* Left: Track Info & Artwork */}
        <div className="flex items-center gap-3.5 w-1/4 min-w-[200px] max-w-[320px]">
          <div
            onClick={() => setIsExpanded(true)}
            className="relative w-14 h-14 rounded-xl overflow-hidden cursor-pointer group shrink-0 shadow-md border border-white/10 bg-zinc-800"
          >
            {currentTrack.cover_url ? (
              <img
                src={currentTrack.cover_url}
                alt={currentTrack.title}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: getArtworkGradient(currentTrack.title) }}
              >
                <Disc3 className="w-6 h-6 text-white/80" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Maximize2 className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                onClick={() => setIsExpanded(true)}
                className="text-sm font-semibold text-white truncate cursor-pointer hover:underline hover:text-[#FA405E] transition-colors"
                title={currentTrack.title}
              >
                {currentTrack.title}
              </span>
              {currentTrack.license && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-white/10 text-zinc-400 font-mono uppercase tracking-wider shrink-0" title={currentTrack.license}>
                  CC
                </span>
              )}
            </div>
            <Link
              href={`/artist/${encodeURIComponent(currentTrack.artist)}`}
              className="text-xs text-zinc-400 truncate hover:text-white transition-colors"
            >
              {currentTrack.artist}
            </Link>
          </div>

          <button
            onClick={() => toggleFavorite(currentTrack)}
            className="p-1.5 text-zinc-400 hover:text-white transition-colors shrink-0 ml-1"
            title={favorited ? "Remove from Favorites" : "Add to Favorites"}
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-transform active:scale-125",
                favorited ? "fill-[#FA405E] text-[#FA405E]" : "hover:text-white"
              )}
            />
          </button>
        </div>

        {/* Center: Controls & Scrubber */}
        <div className="flex flex-col items-center gap-1.5 w-2/4 max-w-xl px-2">
          {/* Action buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleShuffle}
              className={cn(
                "p-1.5 rounded-lg transition-colors relative",
                isShuffle ? "text-[#FA405E]" : "text-zinc-400 hover:text-white"
              )}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
              {isShuffle && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FA405E]" />}
            </button>

            <button
              onClick={prevTrack}
              className="p-1.5 text-zinc-400 hover:text-white transition-colors active:scale-95"
              title="Previous"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={togglePlay}
              disabled={isLoading}
              className="w-10 h-10 rounded-full bg-[#FA405E] hover:bg-[#E02E4C] text-white flex items-center justify-center transition-all shadow-lg shadow-[#FA405E]/30 active:scale-95 disabled:opacity-75"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-white" />
              ) : (
                <Play className="w-5 h-5 fill-white ml-0.5" />
              )}
            </button>

            <button
              onClick={nextTrack}
              className="p-1.5 text-zinc-400 hover:text-white transition-colors active:scale-95"
              title="Next"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={toggleRepeat}
              className={cn(
                "p-1.5 rounded-lg transition-colors relative",
                repeatMode !== "off" ? "text-[#FA405E]" : "text-zinc-400 hover:text-white"
              )}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === "one" ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
              {repeatMode !== "off" && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FA405E]" />}
            </button>
          </div>

          {/* Progress Scrubber */}
          <div className="w-full flex items-center gap-2.5 text-[11px] text-zinc-400 font-mono">
            <span className="w-9 text-right">{formatTime(currentTime)}</span>
            <div className="relative flex-1 flex items-center group">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="w-full z-10"
              />
              <div
                className="absolute left-0 top-[6px] h-1 bg-[#FA405E] rounded-full pointer-events-none group-hover:bg-[#FF5A78] transition-colors"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="w-9 text-left">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Volume & Expand & Queue */}
        <div className="flex items-center justify-end gap-3 w-1/4 min-w-[200px]">
          {/* Queue Button */}
          <button
            onClick={() => setShowQueue(!showQueue)}
            className={cn(
              "p-2 rounded-xl transition-colors relative",
              showQueue ? "bg-white/10 text-[#FA405E]" : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
            title="Up Next Queue"
          >
            <ListMusic className="w-5 h-5" />
            {queue.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FA405E] text-white text-[10px] font-bold flex items-center justify-center font-mono">
                {queue.length > 9 ? "9+" : queue.length}
              </span>
            )}
          </button>

          {/* Volume Control */}
          <div className="hidden sm:flex items-center gap-2 group">
            <button
              onClick={toggleMute}
              className="text-zinc-400 hover:text-white transition-colors"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-zinc-500" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20"
            />
          </div>

          {/* Fullscreen Expand */}
          <button
            onClick={() => setIsExpanded(true)}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            title="Full Screen Now Playing"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </footer>

      {/* Slide-over Queue Sheet */}
      {showQueue && (
        <div className="fixed bottom-24 right-4 w-80 max-h-[480px] bg-[#1E1E26]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListMusic className="w-4 h-4 text-[#FA405E]" />
              <h4 className="text-sm font-bold text-white">Up Next</h4>
              <span className="text-xs text-zinc-500 font-mono">({queue.length})</span>
            </div>
            {queue.length > 0 && (
              <button
                onClick={clearQueue}
                className="text-xs text-zinc-400 hover:text-[#FA405E] transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {queue.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs">
                No songs in queue. Click any song to play or add to queue.
              </div>
            ) : (
              queue.map((t, idx) => (
                <div
                  key={`${t.track_id}-${idx}`}
                  className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 group transition-colors"
                >
                  <span className="text-xs text-zinc-500 w-4 text-center font-mono">{idx + 1}</span>
                  <div
                    onClick={() => playTrack(t)}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <p className="text-xs font-semibold text-white truncate group-hover:text-[#FA405E] transition-colors">
                      {t.title}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">{t.artist}</p>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">{formatTime(t.duration)}</span>
                  <button
                    onClick={() => removeFromQueue(idx)}
                    className="text-zinc-600 hover:text-rose-400 text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove from queue"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
