"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Music2, Play, Sliders, Check, RefreshCw, Wand2, Disc3 } from "lucide-react";
import { getPlaylistRecommendations, getGenres, getMoods, getInstruments } from "@/lib/api";
import { RecommendationItem, TagItem } from "@/types/music";
import { usePlayer } from "@/context/PlayerContext";
import { TrackRow } from "@/components/TrackRow";
import { cn } from "@/lib/utils";

const CURATED_MOODS = [
  "happy",
  "relaxing",
  "energetic",
  "emotional",
  "melodic",
  "dark",
  "epic",
  "dream",
  "love",
  "inspiring",
  "sad",
  "meditative",
  "uplifting"
];

const CURATED_GENRES = [
  "electronic",
  "rock",
  "pop",
  "soundtrack",
  "ambient",
  "classical",
  "easylistening",
  "chillout",
  "hiphop",
  "indie",
  "folk",
  "metal"
];

const CURATED_INSTRUMENTS = [
  "piano",
  "synthesizer",
  "drums",
  "bass",
  "guitar",
  "electricguitar",
  "violin",
  "acousticguitar",
  "voice"
];

export default function DiscoverPage() {
  const { playTrack } = usePlayer();
  const [selectedMoods, setSelectedMoods] = useState<string[]>(["relaxing"]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(["electronic"]);
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleMood = (mood: string) => {
    setSelectedMoods((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood].slice(-3)
    );
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre].slice(-3)
    );
  };

  const toggleInstrument = (inst: string) => {
    setSelectedInstruments((prev) =>
      prev.includes(inst) ? prev.filter((i) => i !== inst) : [...prev, inst].slice(-2)
    );
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await getPlaylistRecommendations({
        genres: selectedGenres,
        moods: selectedMoods,
        limit: 20,
      });
      setRecommendations(res.recommendations);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Generate on initial mount
  useEffect(() => {
    handleGenerate();
  }, []);

  const handlePlayAll = () => {
    if (recommendations.length > 0) {
      const tracks = recommendations.map((r) => r.track);
      playTrack(tracks[0], tracks);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 select-none">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#FA405E]" />
          <span className="text-xs uppercase font-mono tracking-widest text-[#FA405E] font-bold">
            Intelligent Recommendation Engine
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight font-heading mt-1">
          AI Music Discovery Studio
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Select target emotional moods, genre taxonomies, and acoustic instruments to synthesize personalized recommendations.
        </p>
      </div>

      {/* Control Studio Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#17171C]/90 backdrop-blur-xl border border-white/10 space-y-6 shadow-2xl">
        {/* Mood Selector */}
        <div>
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2.5">
            1. Desired Mood & Atmosphere (Pick up to 3)
          </label>
          <div className="flex flex-wrap gap-2">
            {CURATED_MOODS.map((m) => {
              const active = selectedMoods.includes(m);
              return (
                <button
                  key={m}
                  onClick={() => toggleMood(m)}
                  className={cn(
                    "px-4 py-2 rounded-2xl text-xs font-semibold capitalize transition-all border",
                    active
                      ? "bg-gradient-to-r from-[#FA405E] to-[#B86BE8] text-white border-transparent shadow-md shadow-[#FA405E]/20 scale-105"
                      : "bg-white/5 text-zinc-400 hover:text-white border-white/5 hover:border-white/20"
                  )}
                >
                  {active && <Check className="w-3.5 h-3.5 inline mr-1" />}
                  #{m}
                </button>
              );
            })}
          </div>
        </div>

        {/* Genre Selector */}
        <div>
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2.5">
            2. Genre Taxonomies (Pick up to 3)
          </label>
          <div className="flex flex-wrap gap-2">
            {CURATED_GENRES.map((g) => {
              const active = selectedGenres.includes(g);
              return (
                <button
                  key={g}
                  onClick={() => toggleGenre(g)}
                  className={cn(
                    "px-4 py-2 rounded-2xl text-xs font-semibold capitalize transition-all border",
                    active
                      ? "bg-[#FA405E] text-white border-transparent shadow-md shadow-[#FA405E]/25 scale-105"
                      : "bg-white/5 text-zinc-400 hover:text-white border-white/5 hover:border-white/20"
                  )}
                >
                  {active && <Check className="w-3.5 h-3.5 inline mr-1" />}
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        {/* Instrument Selector */}
        <div>
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2.5">
            3. Acoustic Instrumentation (Optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {CURATED_INSTRUMENTS.map((inst) => {
              const active = selectedInstruments.includes(inst);
              return (
                <button
                  key={inst}
                  onClick={() => toggleInstrument(inst)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-medium capitalize transition-all border",
                    active
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                      : "bg-white/5 text-zinc-400 hover:text-white border-white/5"
                  )}
                >
                  {inst}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5">
          <span className="text-xs text-zinc-500 font-mono">
            Algorithm: TF-IDF Tag Embedding & Cosine Nearest Neighbors
          </span>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-[#FA405E] via-[#E02E4C] to-[#B86BE8] text-white font-bold text-sm shadow-xl shadow-[#FA405E]/30 hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            <span>Synthesize AI Recommendations</span>
          </button>
        </div>
      </div>

      {/* Generated Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music2 className="w-5 h-5 text-[#FA405E]" />
            <h3 className="text-xl font-bold text-white font-heading">
              Curated Matches ({recommendations.length})
            </h3>
          </div>

          {recommendations.length > 0 && (
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Play AI Mix</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-20 text-center text-zinc-500">
            <div className="w-8 h-8 rounded-full border-2 border-[#FA405E] border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-sm">Calculating nearest vector spaces...</p>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 bg-[#17171C]/50 rounded-3xl border border-white/5 p-8">
            <Disc3 className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-base font-bold text-white">No exact combination found.</p>
            <p className="text-xs text-zinc-400 mt-1">Try selecting different genres or moods above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendations.map((item, idx) => (
              <div
                key={item.track.track_id}
                className="p-3.5 rounded-2xl bg-[#17171C]/80 border border-white/5 hover:border-white/15 transition-all flex flex-col justify-between"
              >
                <TrackRow
                  track={item.track}
                  index={idx}
                  playlistContext={recommendations.map((r) => r.track)}
                />
                {/* Explainability badge */}
                <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] px-2">
                  <span className="text-[#B86BE8] font-medium flex items-center gap-1 truncate">
                    <Sparkles className="w-3 h-3 shrink-0" />
                    {item.explanation}
                  </span>
                  <span className="text-zinc-500 font-mono shrink-0 ml-2">
                    {Math.round(item.similarity_score * 100)}% match
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
