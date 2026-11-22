"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Compass, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Music2 } from "lucide-react";
import { getTracks, getGenres, getMoods, getInstruments } from "@/lib/api";
import { Track, TagItem } from "@/types/music";
import { TrackRow } from "@/components/TrackRow";

function BrowseContent() {
  const searchParams = useSearchParams();
  const initialGenre = searchParams.get("genre") || "";
  const initialMood = searchParams.get("mood") || "";

  const [tracks, setTracks] = useState<Track[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(24);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [selectedMood, setSelectedMood] = useState(initialMood);
  const [selectedInstrument, setSelectedInstrument] = useState("");
  const [sortBy, setSortBy] = useState<"title" | "artist" | "duration" | "release_date">("title");
  
  const [genres, setGenres] = useState<TagItem[]>([]);
  const [moods, setMoods] = useState<TagItem[]>([]);
  const [instruments, setInstruments] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load tags list
  useEffect(() => {
    Promise.all([getGenres(), getMoods(), getInstruments()]).then(([g, m, i]) => {
      setGenres(g);
      setMoods(m);
      setInstruments(i);
    });
  }, []);

  // Sync url params if navigated directly
  useEffect(() => {
    if (initialGenre) setSelectedGenre(initialGenre);
    if (initialMood) setSelectedMood(initialMood);
  }, [initialGenre, initialMood]);

  // Load tracks when filters change
  useEffect(() => {
    setLoading(true);
    getTracks({
      page,
      limit,
      genre: selectedGenre || undefined,
      mood: selectedMood || undefined,
      instrument: selectedInstrument || undefined,
      sort_by: sortBy,
    })
      .then((res) => {
        setTracks(res.tracks);
        setTotal(res.total);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Browse tracks error:", err);
        setLoading(false);
      });
  }, [page, limit, selectedGenre, selectedMood, selectedInstrument, sortBy]);

  const totalPages = Math.ceil(total / limit) || 1;

  const handleResetFilters = () => {
    setSelectedGenre("");
    setSelectedMood("");
    setSelectedInstrument("");
    setPage(1);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 select-none">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-[#FA405E]" />
          <span className="text-xs uppercase font-mono tracking-widest text-[#FA405E] font-bold">
            Catalogue Discovery
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight font-heading mt-1">
          Browse Music
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Explore across 95 genres, 59 moods, and 41 instruments from the MTG-Jamendo dataset.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-3xl bg-[#17171C]/80 backdrop-blur-xl border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Genre select */}
          <div className="flex items-center gap-1.5 bg-[#101014] px-3 py-2 rounded-2xl border border-white/10 text-xs">
            <span className="text-zinc-500 font-medium">Genre:</span>
            <select
              value={selectedGenre}
              onChange={(e) => {
                setSelectedGenre(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-white outline-none cursor-pointer capitalize font-semibold"
            >
              <option value="" className="bg-[#17171C]">All Genres</option>
              {genres.map((g) => (
                <option key={g.name} value={g.name} className="bg-[#17171C]">
                  {g.display_name} ({g.count})
                </option>
              ))}
            </select>
          </div>

          {/* Mood select */}
          <div className="flex items-center gap-1.5 bg-[#101014] px-3 py-2 rounded-2xl border border-white/10 text-xs">
            <span className="text-zinc-500 font-medium">Mood:</span>
            <select
              value={selectedMood}
              onChange={(e) => {
                setSelectedMood(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-white outline-none cursor-pointer capitalize font-semibold"
            >
              <option value="" className="bg-[#17171C]">All Moods</option>
              {moods.map((m) => (
                <option key={m.name} value={m.name} className="bg-[#17171C]">
                  {m.display_name} ({m.count})
                </option>
              ))}
            </select>
          </div>

          {/* Instrument select */}
          <div className="flex items-center gap-1.5 bg-[#101014] px-3 py-2 rounded-2xl border border-white/10 text-xs">
            <span className="text-zinc-500 font-medium">Instrument:</span>
            <select
              value={selectedInstrument}
              onChange={(e) => {
                setSelectedInstrument(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-white outline-none cursor-pointer capitalize font-semibold"
            >
              <option value="" className="bg-[#17171C]">All Instruments</option>
              {instruments.map((i) => (
                <option key={i.name} value={i.name} className="bg-[#17171C]">
                  {i.display_name} ({i.count})
                </option>
              ))}
            </select>
          </div>

          {(selectedGenre || selectedMood || selectedInstrument) && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-[#FA405E] hover:underline px-2 py-1 font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Sort select & Total count */}
        <div className="flex items-center gap-4 text-xs">
          <span className="text-zinc-400 font-mono">
            {total.toLocaleString()} tracks found
          </span>

          <div className="flex items-center gap-1.5 bg-[#101014] px-3 py-2 rounded-2xl border border-white/10">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-white outline-none cursor-pointer font-semibold"
            >
              <option value="title" className="bg-[#17171C]">Title (A-Z)</option>
              <option value="artist" className="bg-[#17171C]">Artist (A-Z)</option>
              <option value="duration" className="bg-[#17171C]">Duration (Longest)</option>
              <option value="release_date" className="bg-[#17171C]">Latest Release</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tracks Grid / List */}
      <div className="space-y-1">
        {loading ? (
          <div className="py-20 text-center text-zinc-500">
            <div className="w-8 h-8 rounded-full border-2 border-[#FA405E] border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading tracks from dataset...</p>
          </div>
        ) : tracks.length === 0 ? (
          <div className="py-20 text-center text-zinc-500 bg-[#17171C]/40 rounded-3xl border border-white/5 p-8">
            <Music2 className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-base font-semibold text-white">No tracks match your filter criteria.</p>
            <p className="text-xs text-zinc-400 mt-1">Try resetting the genre or mood selection.</p>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 rounded-xl bg-[#FA405E] text-white text-xs font-bold"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {tracks.map((t, idx) => (
              <TrackRow
                key={t.track_id}
                track={t}
                index={(page - 1) * limit + idx}
                playlistContext={tracks}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-white/5">
          <span className="text-xs text-zinc-400 font-mono">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="py-32 text-center text-zinc-500">
          <div className="w-8 h-8 rounded-full border-2 border-[#FA405E] border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading browse experience...</p>
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}
