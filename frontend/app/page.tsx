"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Play,
  Sparkles,
  TrendingUp,
  Disc3,
  Heart,
  Compass,
  Radio,
  Flame,
  ArrowRight,
} from "lucide-react";
import { getFeaturedDashboard, getGenres, getMoods } from "@/lib/api";
import { Track, TagItem } from "@/types/music";
import { AlbumCard } from "@/components/AlbumCard";
import { TrackRow } from "@/components/TrackRow";
import { usePlayer } from "@/context/PlayerContext";
import { getArtworkGradient } from "@/lib/utils";

export default function HomePage() {
  const { playTrack } = usePlayer();
  const [featured, setFeatured] = useState<Track[]>([]);
  const [trending, setTrending] = useState<Track[]>([]);
  const [madeForYou, setMadeForYou] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [genres, setGenres] = useState<TagItem[]>([]);
  const [moods, setMoods] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([getFeaturedDashboard(), getGenres(), getMoods()])
      .then(([dash, gList, mList]) => {
        if (!active) return;
        setFeatured(dash.featured || []);
        setTrending(dash.trending || []);
        setMadeForYou(dash.made_for_you || []);
        setAlbums(dash.popular_albums || []);
        setGenres(gList.slice(0, 8));
        setMoods(mList.slice(0, 8));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load dashboard:", err);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const activeHero = featured[activeBannerIdx] || featured[0];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-12">
      {/* Personalized Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#FA405E] font-bold font-mono">
            Listen Now
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight font-heading mt-1">
            Good Evening
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Explore curated royalty-free tracks powered by MTG-Jamendo and AI recommendation algorithms.
          </p>
        </div>

        <Link
          href="/discover"
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all w-fit"
        >
          <Sparkles className="w-4 h-4 text-[#FA405E]" />
          <span>Personalize with AI Studio</span>
        </Link>
      </div>

      {/* Hero Featured Banner (Apple Music Style) */}
      {activeHero && (
        <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-r from-zinc-900 to-[#1A1A22] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 group">
          {/* Subtle Ambient Background */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none blur-3xl -z-0"
            style={{
              background: getArtworkGradient(activeHero.title),
            }}
          />

          <div className="relative z-10 flex-1 space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-mono text-white">
              <Flame className="w-3.5 h-3.5 text-[#FA405E]" />
              <span>Featured Spotlight</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-extrabold text-white font-heading tracking-tight leading-tight">
              {activeHero.title}
            </h2>

            <p className="text-base md:text-lg text-zinc-300 font-medium">
              By{" "}
              <Link
                href={`/artist/${encodeURIComponent(activeHero.artist)}`}
                className="text-white hover:text-[#FA405E] underline decoration-white/20 transition-colors"
              >
                {activeHero.artist}
              </Link>
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {activeHero.genres?.slice(0, 3).map((g) => (
                <span
                  key={g}
                  className="text-xs px-3 py-1 rounded-full bg-white/10 text-zinc-200 capitalize font-medium backdrop-blur-sm"
                >
                  {g}
                </span>
              ))}
              {activeHero.moods?.slice(0, 2).map((m) => (
                <span
                  key={m}
                  className="text-xs px-3 py-1 rounded-full bg-[#B86BE8]/20 text-[#B86BE8] capitalize font-medium"
                >
                  #{m}
                </span>
              ))}
            </div>

            <div className="pt-4 flex items-center gap-4">
              <button
                onClick={() => playTrack(activeHero, featured)}
                className="px-6 py-3.5 rounded-full bg-[#FA405E] hover:bg-[#E02E4C] text-white font-bold text-sm flex items-center gap-2.5 shadow-xl shadow-[#FA405E]/30 transition-all hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 fill-white ml-0.5" />
                <span>Play Spotlight</span>
              </button>

              <Link
                href={`/album/${encodeURIComponent(activeHero.album)}`}
                className="px-5 py-3.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold text-sm transition-all"
              >
                View Album
              </Link>
            </div>
          </div>

          {/* Hero Artwork Box */}
          <div className="relative z-10 w-60 h-60 md:w-80 md:h-80 rounded-2xl overflow-hidden shadow-2xl border border-white/15 shrink-0 bg-zinc-800">
            {activeHero.cover_url ? (
              <img
                src={activeHero.cover_url}
                alt={activeHero.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: getArtworkGradient(activeHero.title) }}
              >
                <Disc3 className="w-20 h-20 text-white/80" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mood Quick Picks */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#FA405E]" />
            <h3 className="text-xl font-bold text-white font-heading">Mood Stations</h3>
          </div>
          <Link
            href="/browse?tab=moods"
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-medium transition-colors"
          >
            See All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {moods.map((m) => (
            <Link
              key={m.name}
              href={`/browse?mood=${encodeURIComponent(m.name)}`}
              className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition-all text-center group hover:-translate-y-1 hover:border-[#FA405E]/30"
            >
              <div
                className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-tr ${m.color || "from-[#FA405E] to-[#B86BE8]"} flex items-center justify-center mb-2 shadow-md`}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs font-semibold text-white capitalize truncate">{m.display_name}</p>
              <span className="text-[10px] text-zinc-500 font-mono">{m.count} tracks</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Tracks */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#FA405E]" />
            <h3 className="text-xl font-bold text-white font-heading">Trending on SoundWave</h3>
          </div>
          <Link
            href="/browse"
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-medium transition-colors"
          >
            Browse All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {trending.slice(0, 8).map((track, idx) => (
            <TrackRow
              key={track.track_id}
              track={track}
              index={idx}
              playlistContext={trending}
            />
          ))}
        </div>
      </section>

      {/* Popular Albums Grid */}
      {albums.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Disc3 className="w-5 h-5 text-[#B86BE8]" />
              <h3 className="text-xl font-bold text-white font-heading">Popular Albums</h3>
            </div>
            <Link
              href="/browse"
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-medium transition-colors"
            >
              Explore Discography <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {albums.map((alb) => (
              <AlbumCard
                key={alb.title}
                title={alb.title}
                artist={alb.artist}
                coverUrl={alb.cover_url}
                totalTracks={alb.total_tracks}
                tracks={alb.tracks}
              />
            ))}
          </div>
        </section>
      )}

      {/* Top Genres Shelf */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#FA405E]" />
            <h3 className="text-xl font-bold text-white font-heading">Explore by Genre</h3>
          </div>
          <Link
            href="/browse"
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-medium transition-colors"
          >
            All 95 Genres <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {genres.map((g) => (
            <Link
              key={g.name}
              href={`/browse?genre=${encodeURIComponent(g.name)}`}
              className="relative h-28 rounded-2xl overflow-hidden p-5 flex flex-col justify-between shadow-lg group hover:scale-[1.02] transition-transform select-none"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-tr ${g.color || "from-blue-600 to-indigo-900"} opacity-90 transition-opacity group-hover:opacity-100`}
              />
              <span className="relative z-10 text-lg font-bold text-white font-heading tracking-tight capitalize">
                {g.display_name}
              </span>
              <span className="relative z-10 text-xs font-mono text-white/80">
                {g.count.toLocaleString()} tracks
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Made For You Section */}
      <section className="space-y-4 pb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#B86BE8]" />
            <h3 className="text-xl font-bold text-white font-heading">Made For You</h3>
          </div>
          <Link
            href="/discover"
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-medium transition-colors"
          >
            Custom Mix Studio <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {madeForYou.slice(0, 8).map((track, idx) => (
            <TrackRow
              key={track.track_id}
              track={track}
              index={idx}
              playlistContext={madeForYou}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
