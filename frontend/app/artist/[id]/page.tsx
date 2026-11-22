"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Play, User, Disc3, ArrowLeft } from "lucide-react";
import { getArtist } from "@/lib/api";
import { Track } from "@/types/music";
import { TrackRow } from "@/components/TrackRow";
import { usePlayer } from "@/context/PlayerContext";
import { getArtworkGradient } from "@/lib/utils";

export default function ArtistDetailPage() {
  const params = useParams();
  const artistName = typeof params.id === "string" ? decodeURIComponent(params.id) : "";
  const { playTrack } = usePlayer();

  const [artist, setArtist] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!artistName) return;
    setLoading(true);
    getArtist(artistName)
      .then((data) => {
        setArtist(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Artist error:", err);
        setLoading(false);
      });
  }, [artistName]);

  if (loading) {
    return (
      <div className="py-32 text-center text-zinc-500">
        <div className="w-8 h-8 rounded-full border-2 border-[#FA405E] border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-sm">Loading artist discography...</p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="p-10 max-w-4xl mx-auto text-center space-y-4">
        <User className="w-16 h-16 text-zinc-600 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Artist Not Found</h2>
        <p className="text-sm text-zinc-400">Could not find artist &quot;{artistName}&quot;</p>
        <Link href="/browse" className="inline-block px-5 py-2.5 rounded-full bg-[#FA405E] text-white text-xs font-bold">
          Back to Browse
        </Link>
      </div>
    );
  }

  const handlePlayArtist = () => {
    if (artist.tracks && artist.tracks.length > 0) {
      playTrack(artist.tracks[0], artist.tracks);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 select-none">
      <Link href="/browse" className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to browse</span>
      </Link>

      {/* Artist Hero Header */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-8 bg-gradient-to-b from-white/[0.05] to-transparent p-6 md:p-8 rounded-3xl border border-white/5">
        <div className="w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden shadow-2xl bg-zinc-800 border-2 border-white/10 shrink-0">
          {artist.cover_url ? (
            <img src={artist.cover_url} alt={artist.name} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: getArtworkGradient(artist.name) }}
            >
              <User className="w-20 h-20 text-white/80" />
            </div>
          )}
        </div>

        <div className="space-y-4 text-center md:text-left flex-1 min-w-0">
          <span className="text-xs uppercase tracking-widest text-[#B86BE8] font-bold font-mono">
            Artist
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white font-heading tracking-tight">
            {artist.name}
          </h1>

          <p className="text-sm text-zinc-400 font-mono">
            {artist.total_tracks} tracks in MTG-Jamendo catalog • {artist.albums?.length || 1} albums
          </p>

          <div className="pt-2">
            <button
              onClick={handlePlayArtist}
              className="px-8 py-3.5 rounded-full bg-[#FA405E] hover:bg-[#E02E4C] text-white font-bold text-sm flex items-center gap-2.5 shadow-xl shadow-[#FA405E]/30 transition-all hover:scale-105 active:scale-95 mx-auto md:mx-0"
            >
              <Play className="w-4 h-4 fill-white ml-0.5" />
              <span>Play Discography</span>
            </button>
          </div>
        </div>
      </div>

      {/* Popular Songs */}
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-white mb-3">Popular Songs</h3>
        {artist.tracks?.slice(0, 15).map((track: Track, idx: number) => (
          <TrackRow
            key={track.track_id}
            track={track}
            index={idx}
            playlistContext={artist.tracks}
          />
        ))}
      </div>
    </div>
  );
}
