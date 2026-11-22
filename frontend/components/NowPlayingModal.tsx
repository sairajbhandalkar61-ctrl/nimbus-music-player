"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
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
  Heart,
  Disc3,
  Sparkles,
  Share2,
  ListMusic,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";
import { useLibrary } from "@/context/LibraryContext";
import { formatTime, getArtworkGradient, cn } from "@/lib/utils";
import { getTrackRecommendations } from "@/lib/api";
import { RecommendationItem } from "@/types/music";

export function NowPlayingModal() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    isExpanded,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    setIsExpanded,
    playTrack,
    addToQueue,
  } = usePlayer();

  const { isFavorite, toggleFavorite } = useLibrary();
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  // Keyboard shortcut: Escape closes modal, Space toggles play
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isExpanded) return;
      if (e.key === "Escape") {
        setIsExpanded(false);
      } else if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded, setIsExpanded, togglePlay]);

  // Fetch AI recommendations when track changes
  useEffect(() => {
    if (!currentTrack || !isExpanded) return;
    let active = true;
    setLoadingRecs(true);
    getTrackRecommendations(currentTrack.track_id, 6)
      .then((res) => {
        if (active) {
          setRecommendations(res.recommendations);
          setLoadingRecs(false);
        }
      })
      .catch((err) => {
        if (active) setLoadingRecs(false);
      });
    return () => {
      active = false;
    };
  }, [currentTrack?.track_id, isExpanded]);

  if (!isExpanded || !currentTrack) return null;

  const favorited = isFavorite(currentTrack.track_id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-[#101014]/95 backdrop-blur-3xl overflow-y-auto flex flex-col p-6 md:p-12 animate-in fade-in duration-300">
      {/* Dynamic Ambient Background Glow */}
      <div
        className="fixed inset-0 pointer-events-none opacity-25 blur-[120px] -z-10"
        style={{
          background: `radial-gradient(circle at 50% 30%, #FA405E 0%, #B86BE8 50%, transparent 80%)`,
        }}
      />

      {/* Top Bar: Close & Mode */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between pb-8">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-mono tracking-widest text-[#FA405E] font-bold px-2.5 py-1 rounded-full bg-[#FA405E]/10 border border-[#FA405E]/20">
            Now Playing Experience
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
          title="Close (Esc)"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content Layout */}
      <div className="w-full max-w-6xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left: Large Artwork */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="relative w-72 h-72 sm:w-88 sm:h-88 md:w-96 md:h-96 rounded-3xl overflow-hidden shadow-2xl border border-white/15 bg-zinc-900 group">
            {currentTrack.cover_url ? (
              <img
                src={currentTrack.cover_url}
                alt={currentTrack.title}
                className={cn(
                  "w-full h-full object-cover transition-transform duration-700",
                  isPlaying ? "scale-100" : "scale-95 opacity-90"
                )}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: getArtworkGradient(currentTrack.title) }}
              >
                <Disc3 className={cn("w-28 h-28 text-white/80", isPlaying && "animate-spin-slow")} />
              </div>
            )}
            {/* Visualizer pill on bottom of artwork */}
            {isPlaying && (
              <div className="absolute bottom-4 left-4 right-4 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center gap-1.5 px-4">
                <span className="w-1 bg-[#FA405E] rounded-full animate-pulse h-4" />
                <span className="w-1 bg-[#B86BE8] rounded-full animate-pulse h-6 delay-75" />
                <span className="w-1 bg-[#FA405E] rounded-full animate-pulse h-3 delay-150" />
                <span className="w-1 bg-[#B86BE8] rounded-full animate-pulse h-5 delay-100" />
                <span className="w-1 bg-white rounded-full animate-pulse h-4 delay-200" />
                <span className="text-[11px] font-mono font-medium text-white ml-2">Lossless Audio</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Metadata, Controls, & AI Recommendations */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-8">
          {/* Track Info */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight font-heading">
                  {currentTrack.title}
                </h1>
                <Link
                  href={`/artist/${encodeURIComponent(currentTrack.artist)}`}
                  onClick={() => setIsExpanded(false)}
                  className="text-lg sm:text-xl text-[#A1A1AA] hover:text-white font-medium transition-colors mt-1 inline-block"
                >
                  {currentTrack.artist}
                </Link>
                {currentTrack.album && (
                  <p className="text-sm text-zinc-500 mt-0.5">
                    Album:{" "}
                    <Link
                      href={`/album/${encodeURIComponent(currentTrack.album)}`}
                      onClick={() => setIsExpanded(false)}
                      className="hover:underline hover:text-zinc-300"
                    >
                      {currentTrack.album}
                    </Link>
                  </p>
                )}
              </div>
              <button
                onClick={() => toggleFavorite(currentTrack)}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                title={favorited ? "Remove from Favorites" : "Add to Favorites"}
              >
                <Heart
                  className={cn(
                    "w-6 h-6 transition-transform active:scale-125",
                    favorited ? "fill-[#FA405E] text-[#FA405E]" : "text-white"
                  )}
                />
              </button>
            </div>

            {/* Tags / Genres / Moods Pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {currentTrack.genres?.map((g) => (
                <span
                  key={g}
                  className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-zinc-300 border border-white/10 capitalize font-medium"
                >
                  {g}
                </span>
              ))}
              {currentTrack.moods?.map((m) => (
                <span
                  key={m}
                  className="text-xs px-2.5 py-1 rounded-full bg-[#B86BE8]/10 text-[#B86BE8] border border-[#B86BE8]/20 capitalize font-medium"
                >
                  #{m}
                </span>
              ))}
              {currentTrack.instruments?.slice(0, 2).map((inst) => (
                <span
                  key={inst}
                  className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 capitalize font-medium"
                >
                  {inst}
                </span>
              ))}
            </div>
          </div>

          {/* Progress Scrubber */}
          <div className="space-y-2">
            <div className="relative flex items-center group">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="w-full z-10 h-2 bg-white/10 rounded-full"
              />
              <div
                className="absolute left-0 top-[2px] h-2 bg-gradient-to-r from-[#FA405E] to-[#B86BE8] rounded-full pointer-events-none"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-mono text-zinc-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={toggleShuffle}
              className={cn(
                "p-3 rounded-2xl transition-colors",
                isShuffle ? "text-[#FA405E] bg-[#FA405E]/10" : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
              title="Shuffle"
            >
              <Shuffle className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-6">
              <button
                onClick={prevTrack}
                className="p-3 text-zinc-300 hover:text-white transition-colors active:scale-95"
                title="Previous"
              >
                <SkipBack className="w-8 h-8 fill-current" />
              </button>

              <button
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-[#FA405E] hover:bg-[#E02E4C] text-white flex items-center justify-center transition-all shadow-xl shadow-[#FA405E]/40 active:scale-95"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-8 h-8 fill-white" /> : <Play className="w-8 h-8 fill-white ml-1" />}
              </button>

              <button
                onClick={nextTrack}
                className="p-3 text-zinc-300 hover:text-white transition-colors active:scale-95"
                title="Next"
              >
                <SkipForward className="w-8 h-8 fill-current" />
              </button>
            </div>

            <button
              onClick={toggleRepeat}
              className={cn(
                "p-3 rounded-2xl transition-colors",
                repeatMode !== "off" ? "text-[#FA405E] bg-[#FA405E]/10" : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === "one" ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
            </button>
          </div>

          {/* Volume Slider */}
          <div className="flex items-center gap-3 pt-2 w-full max-w-sm mx-auto">
            <button onClick={toggleMute} className="text-zinc-400 hover:text-white transition-colors">
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* License & Attribution Note */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">{currentTrack.attribution}</span>
            </div>
            {currentTrack.source_url && (
              <a
                href={currentTrack.source_url}
                target="_blank"
                rel="noreferrer"
                className="text-zinc-400 hover:text-white flex items-center gap-1 shrink-0 ml-2 underline"
              >
                Jamendo <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: AI Recommendations for this Track */}
      {recommendations.length > 0 && (
        <div className="w-full max-w-6xl mx-auto mt-12 pt-8 border-t border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FA405E]" />
              <h3 className="text-lg font-bold text-white">Recommended Based on this Track</h3>
            </div>
            <span className="text-xs text-zinc-500 font-mono">KNN Tag & Audio Timbre Matching</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {recommendations.map((rec) => (
              <div
                key={rec.track.track_id}
                className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition-all flex items-center justify-between group"
              >
                <div
                  onClick={() => playTrack(rec.track)}
                  className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                >
                  <div className="w-11 h-11 rounded-xl overflow-hidden bg-zinc-800 shrink-0 border border-white/10">
                    {rec.track.cover_url ? (
                      <img src={rec.track.cover_url} alt={rec.track.title} className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-xs"
                        style={{ background: getArtworkGradient(rec.track.title) }}
                      >
                        🎵
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-[#FA405E] transition-colors">
                      {rec.track.title}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">{rec.track.artist}</p>
                    <span className="text-[10px] text-zinc-500 truncate block">{rec.explanation}</span>
                  </div>
                </div>

                <button
                  onClick={() => addToQueue(rec.track)}
                  className="p-2 text-zinc-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                  title="Add to queue"
                >
                  <ListMusic className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
