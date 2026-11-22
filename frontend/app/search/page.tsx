"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Sparkles, Disc3, Music2, Layers } from "lucide-react";
import { searchTracks, searchSpotifySongs, getSpotifyRecommendations } from "@/lib/api";
import { Track, SpotifyTrack, SpotifyRecommendation } from "@/types/music";
import { TrackRow } from "@/components/TrackRow";
import { cn } from "@/lib/utils";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQ);
  const [activeTab, setActiveTab] = useState<"stream" | "spotify">("stream");
  
  // MTG-Jamendo results
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);

  // Spotify results
  const [spotifySongs, setSpotifySongs] = useState<SpotifyTrack[]>([]);
  const [spotifyRecs, setSpotifyRecs] = useState<SpotifyRecommendation[]>([]);
  const [selectedSpotifySong, setSelectedSpotifySong] = useState<string | null>(null);
  const [loadingSpotify, setLoadingSpotify] = useState(false);

  // Search when query changes (debounced)
  useEffect(() => {
    if (!query.trim()) {
      setTracks([]);
      setSpotifySongs([]);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      searchTracks(query, 30)
        .then((res) => {
          setTracks(res.tracks);
          setLoading(false);
        })
        .catch(() => setLoading(false));

      setLoadingSpotify(true);
      searchSpotifySongs(query, 20)
        .then((res) => {
          setSpotifySongs(res.songs);
          setLoadingSpotify(false);
        })
        .catch(() => setLoadingSpotify(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSpotifyRecommend = async (songName: string) => {
    setSelectedSpotifySong(songName);
    setLoadingSpotify(true);
    try {
      const res = await getSpotifyRecommendations(songName, 6);
      setSpotifyRecs(res.recommendations);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSpotify(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 select-none">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-[#FA405E]" />
          <span className="text-xs uppercase font-mono tracking-widest text-[#FA405E] font-bold">
            Search Catalogue
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight font-heading mt-1">
          Search
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Find any song, artist, album, genre, or query across 170,000+ Spotify audio features.
        </p>
      </div>

      {/* Large Search Bar */}
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-500" />
        <input
          type="text"
          autoFocus
          placeholder="What do you want to play or analyze?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-[#17171C] border border-white/10 rounded-3xl pl-16 pr-6 py-4 text-lg md:text-xl text-white placeholder-zinc-500 outline-none focus:border-[#FA405E] transition-colors shadow-2xl"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white px-2 py-1 rounded-full bg-white/10"
          >
            Clear
          </button>
        )}
      </div>

      {/* Dataset Tabs */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab("stream")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all",
            activeTab === "stream"
              ? "bg-[#FA405E] text-white shadow-lg shadow-[#FA405E]/20"
              : "bg-white/5 text-zinc-400 hover:text-white"
          )}
        >
          <Music2 className="w-4 h-4" />
          <span>Streamable MTG-Jamendo ({tracks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("spotify")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all",
            activeTab === "spotify"
              ? "bg-[#1DB954] text-white shadow-lg shadow-[#1DB954]/20"
              : "bg-white/5 text-zinc-400 hover:text-white"
          )}
        >
          <Layers className="w-4 h-4" />
          <span>Spotify ML Dataset ({spotifySongs.length})</span>
        </button>
      </div>

      {/* Tab 1: Playable MTG-Jamendo Results */}
      {activeTab === "stream" && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center text-zinc-500">
              <div className="w-8 h-8 rounded-full border-2 border-[#FA405E] border-t-transparent animate-spin mx-auto mb-3" />
              <p className="text-sm">Searching 56,000+ tracks...</p>
            </div>
          ) : tracks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {tracks.map((t, idx) => (
                <TrackRow key={t.track_id} track={t} index={idx} playlistContext={tracks} />
              ))}
            </div>
          ) : query ? (
            <div className="py-16 text-center text-zinc-500 bg-[#17171C]/40 rounded-3xl border border-white/5 p-8">
              <Disc3 className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-base font-semibold text-white">No tracks found for &quot;{query}&quot;</p>
              <p className="text-xs text-zinc-400 mt-1">Check for spelling or try switching to the Spotify ML Dataset tab.</p>
            </div>
          ) : (
            <div className="py-20 text-center text-zinc-500">
              <Search className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm font-medium">Type a song, artist, album or genre above to start searching.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Spotify Audio Features ML Model Results */}
      {activeTab === "spotify" && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-[#1DB954]" />
              <p className="text-xs text-zinc-300">
                Connected to original Spotify dataset (170,653 songs) with KNN Cosine Similarity & StandardScaler.
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-500">9 Audio Features</span>
          </div>

          {/* Spotify Search List */}
          {spotifySongs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {spotifySongs.map((s, idx) => (
                <div
                  key={`${s.name}-${idx}`}
                  className="p-4 rounded-2xl bg-[#17171C]/80 border border-white/10 hover:border-[#1DB954]/40 transition-all flex flex-col justify-between group"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-[#1DB954] transition-colors truncate">
                        {s.name}
                      </h4>
                      <p className="text-xs text-zinc-400 truncate">{s.artist} {s.year ? `(${s.year})` : ""}</p>
                    </div>

                    <button
                      onClick={() => handleSpotifyRecommend(s.name)}
                      className="px-3 py-1.5 rounded-xl bg-[#1DB954]/10 hover:bg-[#1DB954] text-[#1DB954] hover:text-white border border-[#1DB954]/20 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>KNN Similar</span>
                    </button>
                  </div>

                  {/* Audio Features Matrix Badges */}
                  <div className="grid grid-cols-4 gap-1.5 text-[10px] font-mono">
                    <div className="p-1 rounded bg-white/5 text-center">
                      <span className="text-zinc-500 block">Dance</span>
                      <span className="text-white font-semibold">{Math.round((s.danceability || 0) * 100)}%</span>
                    </div>
                    <div className="p-1 rounded bg-white/5 text-center">
                      <span className="text-zinc-500 block">Energy</span>
                      <span className="text-white font-semibold">{Math.round((s.energy || 0) * 100)}%</span>
                    </div>
                    <div className="p-1 rounded bg-white/5 text-center">
                      <span className="text-zinc-500 block">Valence</span>
                      <span className="text-white font-semibold">{Math.round((s.valence || 0) * 100)}%</span>
                    </div>
                    <div className="p-1 rounded bg-white/5 text-center">
                      <span className="text-zinc-500 block">BPM</span>
                      <span className="text-white font-semibold">{Math.round(s.tempo || 0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : query ? (
            <div className="py-16 text-center text-zinc-500">
              <p className="text-sm">No Spotify songs match &quot;{query}&quot;</p>
            </div>
          ) : (
            <div className="py-20 text-center text-zinc-500">
              <Search className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm font-medium">Type a song title to query Spotify features.</p>
            </div>
          )}

          {/* Spotify Recommendations Box */}
          {selectedSpotifySong && (
            <div className="p-6 rounded-3xl bg-[#17171C] border border-[#1DB954]/30 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#1DB954]" />
                    KNN Recommendations for: &quot;{selectedSpotifySong}&quot;
                  </h3>
                  <p className="text-xs text-zinc-400">Calculated via Cosine Distance on normalized audio feature space.</p>
                </div>
              </div>

              {loadingSpotify ? (
                <div className="py-8 text-center text-zinc-400 text-xs">Computing nearest neighbors...</div>
              ) : spotifyRecs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {spotifyRecs.map((rec, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/5 space-y-2">
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-mono text-[#1DB954] font-bold">#{idx + 1}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1DB954]/10 text-[#1DB954] font-mono">
                          {Math.round(rec.similarity * 100)}% match
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white truncate">{rec.song}</p>
                      <p className="text-xs text-zinc-400 truncate">{rec.artist}</p>
                      <div className="flex justify-between text-[10px] text-zinc-500 font-mono pt-1 border-t border-white/5">
                        <span>Energy: {Math.round((rec.energy || 0) * 100)}%</span>
                        <span>Valence: {Math.round((rec.valence || 0) * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="py-32 text-center text-zinc-500">
          <div className="w-8 h-8 rounded-full border-2 border-[#FA405E] border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading search...</p>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
