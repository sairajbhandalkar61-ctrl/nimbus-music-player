import React, { useState, useEffect, useRef, memo } from 'react';
import { Disc, Music } from 'lucide-react';
import { Track } from '../types';
import { API_BASE_URL } from '../lib/config';

// Global in-memory artwork cache across component mounts
export const globalArtworkCache = new Map<string, string>();

// Batch artwork resolver to fetch multiple song covers in a single debounced HTTP request
class ArtworkBatchResolver {
  private pending = new Set<string>();
  private timer: NodeJS.Timeout | null = null;
  private subscribers = new Map<string, Array<(url: string) => void>>();

  request(trackId: string, callback: (url: string) => void) {
    if (globalArtworkCache.has(trackId)) {
      callback(globalArtworkCache.get(trackId)!);
      return;
    }
    if (!this.subscribers.has(trackId)) {
      this.subscribers.set(trackId, []);
    }
    this.subscribers.get(trackId)!.push(callback);
    this.pending.add(trackId);

    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), 60);
    }
  }

  private async flush() {
    this.timer = null;
    const ids = Array.from(this.pending).slice(0, 36);
    for (const id of ids) {
      this.pending.delete(id);
    }
    if (ids.length === 0) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/artworks?ids=${ids.join(',')}`);
      if (res.ok) {
        const data = await res.json();
        const map = data.artworks || {};
        for (const [id, url] of Object.entries(map)) {
          if (url && typeof url === 'string') {
            globalArtworkCache.set(id, url);
            const subs = this.subscribers.get(id);
            if (subs) {
              subs.forEach((fn) => fn(url));
              this.subscribers.delete(id);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Batch artwork resolution error:', e);
    }

    // Process remaining if any
    if (this.pending.size > 0 && !this.timer) {
      this.timer = setTimeout(() => this.flush(), 100);
    }
  }
}

export const artworkResolver = new ArtworkBatchResolver();

// Vibrant color palette maps for procedural covers
const PALETTES = [
  'from-pink-600 via-purple-600 to-indigo-800',
  'from-red-600 via-rose-600 to-amber-700',
  'from-cyan-500 via-blue-600 to-violet-800',
  'from-emerald-500 via-teal-600 to-cyan-800',
  'from-amber-500 via-orange-600 to-rose-700',
  'from-fuchsia-600 via-pink-600 to-rose-700',
  'from-blue-600 via-indigo-700 to-purple-900',
  'from-violet-600 via-purple-700 to-pink-800',
];

function getTrackPalette(id: string, name: string): string {
  let hash = 0;
  const str = id + name;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

interface SongArtworkProps {
  track: Track;
  className?: string;
  imgClassName?: string;
  showVinylEffect?: boolean;
}

export const SongArtwork: React.FC<SongArtworkProps> = memo(({
  track,
  className = 'w-full h-full',
  imgClassName = 'w-full h-full object-cover',
  showVinylEffect = true,
}) => {
  const [artworkUrl, setArtworkUrl] = useState<string | null>(() => {
    return track.artworkUrl || globalArtworkCache.get(track.id) || null;
  });
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (track.artworkUrl) {
      setArtworkUrl(track.artworkUrl);
      globalArtworkCache.set(track.id, track.artworkUrl);
      return;
    }

    const cached = globalArtworkCache.get(track.id);
    if (cached) {
      setArtworkUrl(cached);
      return;
    }

    artworkResolver.request(track.id, (url) => {
      if (mountedRef.current) {
        setArtworkUrl(url);
      }
    });

    return () => {
      mountedRef.current = false;
    };
  }, [track.id, track.artworkUrl]);

  const palette = getTrackPalette(track.id, track.name);
  const firstLetter = (track.name || 'S').trim().charAt(0).toUpperCase();

  return (
    <div className={`relative overflow-hidden flex items-center justify-center bg-zinc-900 select-none ${className}`}>
      {/* 1. Real Album Artwork Image if available and not failed */}
      {artworkUrl && !failed && (
        <img
          src={artworkUrl}
          alt={track.name}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`${imgClassName} transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* 2. Procedural Album Cover Placeholder (visible while image is loading or as fallback) */}
      {(!artworkUrl || !loaded || failed) && (
        <div
          className={`absolute inset-0 bg-gradient-to-tr ${palette} flex flex-col items-center justify-center overflow-hidden p-2 transition-opacity duration-300 ${
            loaded && !failed ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {showVinylEffect && (
            <>
              {/* Outer Vinyl Groove Rings */}
              <div className="absolute inset-2 rounded-full border border-white/20 pointer-events-none" />
              <div className="absolute inset-5 rounded-full border border-white/15 pointer-events-none" />
              {/* Center vinyl spindle label */}
              <div className="w-10 h-10 rounded-full bg-black/50 border border-white/30 flex items-center justify-center shadow-inner">
                <span className="font-display font-black text-white text-xs drop-shadow">
                  {firstLetter}
                </span>
              </div>
            </>
          )}

          {!showVinylEffect && (
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
              <span className="font-display font-black text-white text-xs">
                {firstLetter}
              </span>
            </div>
          )}

          <span className="absolute bottom-2 text-[9px] font-mono tracking-widest text-white/80 uppercase font-semibold drop-shadow">
            {track.genre || 'TRACK'}
          </span>
        </div>
      )}
    </div>
  );
});
