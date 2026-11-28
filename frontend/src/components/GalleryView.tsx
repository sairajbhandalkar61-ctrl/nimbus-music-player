import React, { useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Sparkles, Flame, Disc, Radio, ExternalLink, Heart, ListPlus, ArrowLeft } from 'lucide-react';
import { Track } from '../types';
import { usePlayerStore } from '../store/usePlayerStore';
import { SongArtwork } from './SongArtwork';
import { API_BASE_URL } from '../lib/config';

const GENRES = [
  { id: 'all', label: 'All Genres', icon: '🌐' },
  { id: 'pop', label: 'Pop', icon: '🎤' },
  { id: 'rock', label: 'Rock', icon: '🎸' },
  { id: 'hip-hop', label: 'Hip-Hop', icon: '🎧' },
  { id: 'electronic', label: 'Electronic', icon: '⚡' },
  { id: 'acoustic', label: 'Acoustic', icon: '🎻' },
  { id: 'jazz', label: 'Jazz', icon: '🎷' },
  { id: 'classical', label: 'Classical', icon: '🎹' },
  { id: 'indie', label: 'Indie', icon: '🌟' },
];

const MOODS = [
  { id: 'all', label: 'All Moods', icon: '✨' },
  { id: 'euphoric', label: 'Euphoric', icon: '⚡' },
  { id: 'chill', label: 'Chill', icon: '🌊' },
  { id: 'melancholic', label: 'Melancholic', icon: '🌧️' },
  { id: 'intense', label: 'Intense', icon: '🔥' },
];

const DECADES = [
  { id: 0, label: 'All Eras' },
  { id: 1960, label: '60s' },
  { id: 1970, label: '70s' },
  { id: 1980, label: '80s' },
  { id: 1990, label: '90s' },
  { id: 2000, label: '00s' },
  { id: 2010, label: '10s' },
  { id: 2020, label: '20s' },
];

// Persistent client-side memory cache for instantaneous 0ms filtering
const memoryCache = new Map<string, Track[]>();

// Genre gradient palettes for instant procedural vinyl art
const GENRE_GRADIENTS: Record<string, string> = {
  pop: 'from-pink-500 via-rose-500 to-purple-600',
  rock: 'from-red-600 via-orange-600 to-amber-700',
  'hip-hop': 'from-amber-500 via-yellow-600 to-zinc-800',
  electronic: 'from-cyan-400 via-blue-600 to-indigo-700',
  acoustic: 'from-emerald-500 via-teal-600 to-stone-800',
  jazz: 'from-amber-600 via-amber-800 to-stone-900',
  classical: 'from-blue-600 via-indigo-800 to-slate-900',
  indie: 'from-purple-500 via-fuchsia-600 to-pink-700',
};

interface GalleryViewProps {
  onBackToLibrary?: () => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({ onBackToLibrary }) => {
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [selectedDecade, setSelectedDecade] = useState<number>(0);
  const [tracks, setTracks] = useState<Track[]>(() => memoryCache.get('all_all_0') || []);
  const [isLoading, setIsLoading] = useState<boolean>(!memoryCache.has('all_all_0'));

  const {
    currentTrack,
    setTrack,
    isPlaying,
    setRecommendationOpen,
    fetchRecommendations,
    likedTracks,
    toggleLike,
    addToQueue,
  } = usePlayerStore();

  const likedIds = useMemo(() => new Set(likedTracks.map((t) => t.id)), [likedTracks]);

  const cacheKey = `${selectedGenre}_${selectedMood}_${selectedDecade}`;

  useEffect(() => {
    // Instant cache hit: render immediately in 0ms!
    if (memoryCache.has(cacheKey)) {
      setTracks(memoryCache.get(cacheKey)!);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const genreParam = selectedGenre === 'all' ? '' : `&genre=${selectedGenre}`;
    const moodParam = selectedMood === 'all' ? '' : `&mood=${selectedMood}`;
    const decadeParam = selectedDecade === 0 ? '' : `&decade=${selectedDecade}`;
    const url = `${API_BASE_URL}/api/gallery?limit=60${genreParam}${moodParam}${decadeParam}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        const fetchedTracks = data.tracks || [];
        memoryCache.set(cacheKey, fetchedTracks);
        setTracks(fetchedTracks);
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn('Gallery fetch error:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedGenre, selectedMood, selectedDecade, cacheKey]);

  const spotlightTrack = tracks.length > 0 ? tracks[0] : null;

  return (
    <div className="w-full h-screen overflow-y-auto pt-24 pb-36 px-4 sm:px-8 select-none overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header & Overview */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {onBackToLibrary && (
                <button
                  onClick={onBackToLibrary}
                  className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Personal Library</span>
                </button>
              )}
              <span className="px-2.5 py-0.5 rounded-full bg-[#fa405e]/20 text-[#fa405e] font-mono text-[11px] font-bold tracking-wider uppercase">
                157,685 Library Tracks
              </span>
              <span className="text-zinc-500 text-xs font-mono">• Instant 0ms Filter</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Music Discovery Gallery
            </h2>
            <p className="text-zinc-400 text-sm mt-1 max-w-xl">
              Instant exploration across 8 major genres, 4 mood quadrants, and 7 decades of recorded music.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <Radio className="w-3.5 h-3.5 text-[#06b6d4] animate-pulse" />
            <span>Showing {tracks.length} Top Ranked Tracks</span>
          </div>
        </div>

        {/* Hero Spotlight Banner */}
        {spotlightTrack && (
          <div
            onClick={() => setTrack(spotlightTrack, true)}
            className="group relative rounded-3xl overflow-hidden glass-panel border border-white/15 p-6 sm:p-8 cursor-pointer hover:border-[#fa405e]/50 transition-all duration-300 shadow-2xl bg-gradient-to-r from-white/[0.07] via-white/[0.03] to-transparent"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-5 sm:gap-6 min-w-0">
                {/* Large Disc / Cover */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 bg-zinc-900 border border-white/20">
                  <SongArtwork track={spotlightTrack} className="w-full h-full" />
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-2xl">
                      <Play className="w-5 h-5 fill-zinc-950 ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-400" />
                      Trending #1 Spotlight
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400 capitalize">
                      {spotlightTrack.genre} • {spotlightTrack.decade}s
                    </span>
                  </div>

                  <h3 className="font-display text-xl sm:text-2xl font-extrabold text-white truncate group-hover:text-[#fa405e] transition-colors">
                    {spotlightTrack.name}
                  </h3>
                  <p className="text-zinc-300 text-sm font-medium truncate mt-0.5">
                    {spotlightTrack.artists}
                  </p>

                  <div className="flex items-center gap-3 mt-3 text-xs font-mono text-zinc-400">
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
                      {Math.round(spotlightTrack.tempo)} BPM
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 capitalize">
                      {spotlightTrack.mood}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[#fa405e]">
                      {spotlightTrack.popularity}% Popularity
                    </span>
                  </div>
                </div>
              </div>

              {/* Big Action Button */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTrack(spotlightTrack, true);
                  }}
                  className="px-6 py-3 rounded-full bg-white text-zinc-950 font-semibold text-xs tracking-wider uppercase flex items-center gap-2 shadow-xl hover:scale-105 transition-transform"
                >
                  <Play className="w-4 h-4 fill-zinc-950" />
                  <span>Play Spotlight</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Controls Row */}
        <div className="space-y-4">
          {/* 1. Genre Pills */}
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2 font-semibold">
              Browse By Genre
            </div>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => {
                const isSelected = selectedGenre === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGenre(g.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-150 flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#fa405e] to-[#b86be8] text-white shadow-lg shadow-[#fa405e]/25 font-bold scale-105'
                        : 'glass-pill text-zinc-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{g.icon}</span>
                    <span>{g.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Mood & Decade Selectors */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center pt-2">
            {/* Mood selector */}
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => {
                const isSelected = selectedMood === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMood(m.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-white text-zinc-950 font-bold shadow'
                        : 'glass-pill text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="mr-1">{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Decade selector */}
            <div className="flex flex-wrap gap-1.5">
              {DECADES.map((d) => {
                const isSelected = selectedDecade === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDecade(d.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-mono transition-all ${
                      isSelected
                        ? 'bg-zinc-100 text-zinc-950 font-bold'
                        : 'glass-pill text-zinc-400 hover:text-white'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tracks Grid */}
        {isLoading && tracks.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-pulse">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-white/5 border border-white/5" />
            ))}
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-24 text-zinc-500 font-mono text-sm glass-panel rounded-3xl p-8 border border-white/5">
            No tracks found matching this exact combination. Try switching to "All Genres" or "All Moods".
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tracks.map((track) => {
              const isCurrent = currentTrack?.id === track.id;

              return (
                <div
                  key={track.id}
                  onClick={() => setTrack(track, true)}
                  style={{ contain: 'paint', willChange: 'transform' }}
                  className={`group relative rounded-2xl p-3 song-card cursor-pointer border transition-all duration-200 flex flex-col justify-between ${
                    isCurrent
                      ? 'border-[#fa405e] !bg-[#1c1c2a] shadow-lg shadow-[#fa405e]/20 ring-1 ring-[#fa405e]/50'
                      : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <div>
                    {/* Album Art Cover / Unique Song Logo */}
                    <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5 shadow-md flex items-center justify-center bg-zinc-900">
                      <SongArtwork track={track} className="w-full h-full group-hover:scale-105 transition-transform duration-300" />

                      {/* Play hover overlay */}
                      <div
                        className={`absolute inset-0 bg-black/45 backdrop-blur-[1px] flex items-center justify-center transition-opacity duration-200 ${
                          isCurrent && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <div className="w-11 h-11 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform">
                          <Play className="w-4 h-4 fill-zinc-950 ml-0.5" />
                        </div>
                      </div>

                      {/* Genre & Mood badges */}
                      <span className="absolute top-2 left-2 text-[9px] px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white font-mono uppercase font-semibold tracking-wider">
                        {track.genre}
                      </span>
                    </div>

                    {/* Track Title */}
                    <h4 className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-[#fa405e] transition-colors leading-tight">
                      {track.name}
                    </h4>
                    {/* Artist */}
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                      {track.artists}
                    </p>
                  </div>

                  {/* Card Footer: Decade + Popularity + Quick Similar Button */}
                  <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                    <span>{track.decade}s</span>

                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center gap-0.5 text-zinc-400">
                        <Flame className="w-2.5 h-2.5 text-[#fa405e]" />
                        {track.popularity}%
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(track);
                        }}
                        className={`p-1 rounded-md hover:bg-white/10 transition-colors ${
                          likedIds.has(track.id) ? 'text-[#fa405e]' : 'text-zinc-500 hover:text-white'
                        }`}
                        title="Like Song"
                      >
                        <Heart className={`w-3 h-3 ${likedIds.has(track.id) ? 'fill-[#fa405e]' : ''}`} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToQueue(track);
                        }}
                        className="p-1 rounded-md hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
                        title="Add to Queue"
                      >
                        <ListPlus className="w-3 h-3" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTrack(track, false);
                          fetchRecommendations(track.id, 8);
                          setRecommendationOpen(true);
                        }}
                        className="p-1 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                        title="Find Similar Songs (KNN)"
                      >
                        <Sparkles className="w-3 h-3 text-[#fa405e]" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
