"use client";

import React, { useEffect, useState } from "react";
import { BarChart3, PieChart, Activity, Music2, Sparkles, Disc3, Layers } from "lucide-react";
import { getAnalytics } from "@/lib/api";
import { TagItem } from "@/types/music";
import { useLibrary } from "@/context/LibraryContext";
import { usePlayer } from "@/context/PlayerContext";

export default function AnalyticsPage() {
  const [data, setData] = useState<{
    top_genres: TagItem[];
    top_moods: TagItem[];
    top_instruments: TagItem[];
    duration_distribution: { range: string; count: number }[];
    total_tracks: number;
    unique_artists: number;
    unique_albums: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const { favorites, playlists } = useLibrary();
  const { history } = usePlayer();

  useEffect(() => {
    getAnalytics()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Analytics fetch error:", err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="py-32 text-center text-zinc-500">
        <div className="w-8 h-8 rounded-full border-2 border-[#FA405E] border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-sm">Crunching MTG-Jamendo and Spotify analytics...</p>
      </div>
    );
  }

  const maxGenreCount = Math.max(...data.top_genres.map((g) => g.count), 1);
  const maxMoodCount = Math.max(...data.top_moods.map((m) => m.count), 1);
  const maxDurationCount = Math.max(...data.duration_distribution.map((d) => d.count), 1);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 select-none">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#FA405E]" />
          <span className="text-xs uppercase font-mono tracking-widest text-[#FA405E] font-bold">
            Data Science & Metrics
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight font-heading mt-1">
          Music Intelligence Analytics
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Live statistics computed from 56,637 MTG-Jamendo tracks, 170k Spotify audio features, and your personal playback vault.
        </p>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-5 rounded-3xl bg-[#17171C]/90 border border-white/10 space-y-1">
          <span className="text-xs text-zinc-500 font-mono">Dataset Tracks</span>
          <p className="text-2xl font-black text-white font-heading">{data.total_tracks.toLocaleString()}</p>
        </div>

        <div className="p-5 rounded-3xl bg-[#17171C]/90 border border-white/10 space-y-1">
          <span className="text-xs text-zinc-500 font-mono">Artists</span>
          <p className="text-2xl font-black text-white font-heading">{data.unique_artists.toLocaleString()}</p>
        </div>

        <div className="p-5 rounded-3xl bg-[#17171C]/90 border border-white/10 space-y-1">
          <span className="text-xs text-zinc-500 font-mono">Albums</span>
          <p className="text-2xl font-black text-white font-heading">{data.unique_albums.toLocaleString()}</p>
        </div>

        <div className="p-5 rounded-3xl bg-[#17171C]/90 border border-white/10 space-y-1">
          <span className="text-xs text-zinc-500 font-mono">My Favorites</span>
          <p className="text-2xl font-black text-[#FA405E] font-heading">{favorites.length}</p>
        </div>

        <div className="p-5 rounded-3xl bg-[#17171C]/90 border border-white/10 space-y-1">
          <span className="text-xs text-zinc-500 font-mono">Playlists</span>
          <p className="text-2xl font-black text-[#B86BE8] font-heading">{playlists.length}</p>
        </div>

        <div className="p-5 rounded-3xl bg-[#17171C]/90 border border-white/10 space-y-1">
          <span className="text-xs text-zinc-500 font-mono">Played Songs</span>
          <p className="text-2xl font-black text-emerald-400 font-heading">{history.length}</p>
        </div>
      </div>

      {/* Visual Charts: 2 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Genre Distribution Bar Chart */}
        <div className="p-6 md:p-8 rounded-3xl bg-[#17171C]/80 border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
              <Activity className="w-4 h-4 text-[#FA405E]" />
              Top Genre Frequencies
            </h3>
            <span className="text-xs text-zinc-500 font-mono">MTG-Jamendo</span>
          </div>

          <div className="space-y-3">
            {data.top_genres.map((g) => {
              const pct = Math.round((g.count / maxGenreCount) * 100);
              return (
                <div key={g.name} className="space-y-1 text-xs">
                  <div className="flex justify-between text-zinc-300">
                    <span className="capitalize font-semibold">{g.display_name}</span>
                    <span className="font-mono text-zinc-400">{g.count.toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FA405E] to-[#B86BE8] rounded-full transition-all duration-1000"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mood Distribution Bar Chart */}
        <div className="p-6 md:p-8 rounded-3xl bg-[#17171C]/80 border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
              <Sparkles className="w-4 h-4 text-[#B86BE8]" />
              Emotional Mood Signatures
            </h3>
            <span className="text-xs text-zinc-500 font-mono">TF-IDF Vector Space</span>
          </div>

          <div className="space-y-3">
            {data.top_moods.map((m) => {
              const pct = Math.round((m.count / maxMoodCount) * 100);
              return (
                <div key={m.name} className="space-y-1 text-xs">
                  <div className="flex justify-between text-zinc-300">
                    <span className="capitalize font-semibold">#{m.display_name}</span>
                    <span className="font-mono text-zinc-400">{m.count.toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#B86BE8] to-cyan-400 rounded-full transition-all duration-1000"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Duration Breakdown & Instrumentation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Track Duration Breakdown */}
        <div className="p-6 md:p-8 rounded-3xl bg-[#17171C]/80 border border-white/10 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
            <PieChart className="w-4 h-4 text-emerald-400" />
            Track Duration Distribution
          </h3>

          <div className="space-y-3">
            {data.duration_distribution.map((d) => {
              const pct = Math.round((d.count / maxDurationCount) * 100);
              return (
                <div key={d.range} className="space-y-1 text-xs">
                  <div className="flex justify-between text-zinc-300">
                    <span className="font-semibold">{d.range}</span>
                    <span className="font-mono text-zinc-400">{d.count.toLocaleString()} tracks</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Instruments Breakdown */}
        <div className="p-6 md:p-8 rounded-3xl bg-[#17171C]/80 border border-white/10 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
            <Music2 className="w-4 h-4 text-cyan-400" />
            Top Instrumentation
          </h3>

          <div className="flex flex-wrap gap-2.5">
            {data.top_instruments.map((i) => (
              <div
                key={i.name}
                className="px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-xs">
                  {i.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-white capitalize">{i.display_name}</p>
                  <p className="text-[10px] text-zinc-500 font-mono">{i.count} tracks</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
