"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Play, Disc3, Clock, Calendar, ArrowLeft } from "lucide-react";
import { getAlbum } from "@/lib/api";
import { Track } from "@/types/music";
import { TrackRow } from "@/components/TrackRow";
import { usePlayer } from "@/context/PlayerContext";
import { formatTime, getArtworkGradient } from "@/lib/utils";

export default function AlbumDetailPage() {
  const params = useParams();
  const albumName = typeof params.id === "string" ? decodeURIComponent(params.id) : "";
  const { playTrack } = usePlayer();

  const [album, setAlbum] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!albumName) return;
    setLoading(true);
    getAlbum(albumName)
      .then((data) => {
        setAlbum(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Album error:", err);
        setLoading(false);
      });
  }, [albumName]);

  if (loading) {
    return (
      <div className="py-32 text-center text-zinc-500">
        <div className="w-8 h-8 rounded-full border-2 border-[#FA405E] border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-sm">Loading album details...</p>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="p-10 max-w-4xl mx-auto text-center space-y-4">
        <Disc3 className="w-16 h-16 text-zinc-600 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Album Not Found</h2>
        <p className="text-sm text-zinc-400">Could not find album &quot;{albumName}&quot;</p>
        <Link href="/browse" className="inline-block px-5 py-2.5 rounded-full bg-[#FA405E] text-white text-xs font-bold">
          Back to Browse
        </Link>
      </div>
    );
  }

  const handlePlayAlbum = () => {
    if (album.tracks && album.tracks.length > 0) {
      playTrack(album.tracks[0], album.tracks);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 select-none">
      <Link href="/browse" className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to browse</span>
      </Link>

      {/* Album Hero Header */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-8 bg-gradient-to-b from-white/[0.05] to-transparent p-6 md:p-8 rounded-3xl border border-white/5">
        <div className="w-56 h-56 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-2xl bg-zinc-800 border border-white/10 shrink-0">
          {album.cover_url ? (
            <img src={album.cover_url} alt={album.title} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: getArtworkGradient(album.title) }}
            >
              <Disc3 className="w-20 h-20 text-white/80" />
            </div>
          )}
        </div>

        <div className="space-y-4 text-center md:text-left flex-1 min-w-0">
          <span className="text-xs uppercase tracking-widest text-[#FA405E] font-bold font-mono">
            Album
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white font-heading tracking-tight">
            {album.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-zinc-400">
            <Link
              href={`/artist/${encodeURIComponent(album.artist)}`}
              className="text-white hover:underline font-semibold"
            >
              {album.artist}
            </Link>
            {album.release_date && (
              <span className="flex items-center gap-1 font-mono text-xs">
                <Calendar className="w-3.5 h-3.5" /> {album.release_date}
              </span>
            )}
            <span className="font-mono text-xs">{album.total_tracks} tracks</span>
            <span className="flex items-center gap-1 font-mono text-xs">
              <Clock className="w-3.5 h-3.5" /> {formatTime(album.total_duration)}
            </span>
          </div>

          <div className="pt-2">
            <button
              onClick={handlePlayAlbum}
              className="px-8 py-3.5 rounded-full bg-[#FA405E] hover:bg-[#E02E4C] text-white font-bold text-sm flex items-center gap-2.5 shadow-xl shadow-[#FA405E]/30 transition-all hover:scale-105 active:scale-95 mx-auto md:mx-0"
            >
              <Play className="w-4 h-4 fill-white ml-0.5" />
              <span>Play Album</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tracklist */}
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-white mb-3">Tracklist</h3>
        {album.tracks?.map((track: Track, idx: number) => (
          <TrackRow
            key={track.track_id}
            track={track}
            index={idx}
            playlistContext={album.tracks}
            showAlbum={false}
          />
        ))}
      </div>
    </div>
  );
}
