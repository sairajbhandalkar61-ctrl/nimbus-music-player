import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlignLeft, Sparkles, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { SongArtwork } from './SongArtwork';
import { LyricLine, Track } from '../types';

interface CachedLyrics {
  synced: LyricLine[];
  plain: string | null;
  status: 'found' | 'not_found';
}

const lyricsCache = new Map<string, CachedLyrics>();

function parseLrc(lrcText: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const timeTagRegex = /\[(\d{1,3}):(\d{2})(?:\.(\d{1,3}))?\]/g;

  for (const rawLine of lrcText.split(/\r?\n/)) {
    const matches = [...rawLine.matchAll(timeTagRegex)];
    if (matches.length === 0) continue;

    const text = rawLine.replace(timeTagRegex, '').trim();
    for (const m of matches) {
      const mins = parseInt(m[1], 10);
      const secs = parseInt(m[2], 10);
      const fracStr = m[3] || '0';
      const frac = parseInt(fracStr, 10) / Math.pow(10, fracStr.length);
      const time = mins * 60 + secs + frac;
      lines.push({ time, text: text || '♪' });
    }
  }

  return lines.sort((a, b) => a.time - b.time);
}

async function fetchLyricsForTrack(track: Track): Promise<CachedLyrics> {
  if (lyricsCache.has(track.id)) {
    return lyricsCache.get(track.id)!;
  }

  const cleanTitle = track.name
    .replace(/-\s*Remastered.*|\(Remastered.*\)|\(feat\..*?\)|\[.*?\]/gi, '')
    .trim();
  const primaryArtist = track.artists.split(',')[0].trim();

  const tryParse = (payload: { syncedLyrics?: string; plainLyrics?: string } | null): CachedLyrics | null => {
    if (!payload) return null;
    if (payload.syncedLyrics) {
      const synced = parseLrc(payload.syncedLyrics);
      if (synced.length > 0) {
        return { synced, plain: payload.plainLyrics || null, status: 'found' };
      }
    }
    if (payload.plainLyrics) {
      return { synced: [], plain: payload.plainLyrics, status: 'found' };
    }
    return null;
  };

  try {
    const params = new URLSearchParams({
      track_name: cleanTitle,
      artist_name: primaryArtist,
    });
    if (track.duration_ms > 0) {
      params.set('duration', String(Math.round(track.duration_ms / 1000)));
    }

    const res = await fetch(`https://lrclib.net/api/get?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      const parsed = tryParse(data);
      if (parsed) {
        lyricsCache.set(track.id, parsed);
        return parsed;
      }
    }

    const searchParams = new URLSearchParams({
      track_name: cleanTitle,
      artist_name: primaryArtist,
    });
    const searchRes = await fetch(`https://lrclib.net/api/search?${searchParams.toString()}`);
    if (searchRes.ok) {
      const list = await searchRes.json();
      if (Array.isArray(list) && list.length > 0) {
        const best = list.find((item) => item?.syncedLyrics) || list[0];
        const parsed = tryParse(best);
        if (parsed) {
          lyricsCache.set(track.id, parsed);
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('[Lyrics] LRCLIB lookup failed:', e);
  }

  const empty: CachedLyrics = { synced: [], plain: null, status: 'not_found' };
  lyricsCache.set(track.id, empty);
  return empty;
}

export const LyricsOverlay: React.FC = () => {
  const {
    isLyricsOpen,
    setLyricsOpen,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    seek,
    togglePlay,
    next,
    prev,
  } = usePlayerStore();

  const [lyricsData, setLyricsData] = useState<CachedLyrics | null>(null);
  const [loading, setLoading] = useState(false);
  const activeLineRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isLyricsOpen || !currentTrack) return;

    const cached = lyricsCache.get(currentTrack.id);
    if (cached) {
      setLyricsData(cached);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    fetchLyricsForTrack(currentTrack).then((res) => {
      if (active) {
        setLyricsData(res);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [isLyricsOpen, currentTrack]);

  const activeIndex = useMemo(() => {
    if (!lyricsData || lyricsData.synced.length === 0) return -1;
    let idx = -1;
    for (let i = 0; i < lyricsData.synced.length; i++) {
      if (lyricsData.synced[i].time <= currentTime + 0.25) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [lyricsData, currentTime]);

  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  const formatTimestamp = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <AnimatePresence>
      {isLyricsOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex flex-col bg-[#08080a]/75 backdrop-blur-xl select-none overflow-hidden"
        >
          {/* Top Bar */}
          <div className="max-w-4xl w-full mx-auto px-4 sm:px-8 pt-5 pb-4 flex items-center justify-between gap-3 border-b border-white/10">
            <div className="flex items-center gap-3 min-w-0">
              {currentTrack && (
                <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 border border-white/15 shadow-lg">
                  <SongArtwork track={currentTrack} className="w-full h-full" showVinylEffect={false} />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-display text-base sm:text-lg font-extrabold text-white truncate">
                  {currentTrack?.name || 'Lyrics'}
                </h3>
                <p className="text-xs text-zinc-400 truncate flex items-center gap-1.5">
                  <span>{currentTrack?.artists}</span>
                  {lyricsData?.status === 'found' && (
                    <span className="text-[10px] font-mono text-[#fa405e] hidden sm:inline">
                      • {lyricsData.synced.length > 0 ? 'Tap any line to seek' : 'Plain Lyrics'}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={() => setLyricsOpen(false)}
              className="p-2 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-zinc-200 transition-colors"
              title="Close Lyrics"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Centered Glowing Lyrics Stage over Aurora Background */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-10">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              {!currentTrack ? (
                <div className="py-24 text-sm font-mono text-zinc-400">
                  Select a track to load synced lyrics.
                </div>
              ) : loading ? (
                <div className="space-y-4 py-12 max-w-md mx-auto">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-8 rounded-2xl bg-white/[0.06] animate-pulse" />
                  ))}
                </div>
              ) : !lyricsData || lyricsData.status === 'not_found' ? (
                <div className="py-24 space-y-3">
                  <AlignLeft className="w-10 h-10 text-zinc-500 mx-auto" />
                  <p className="font-display text-xl font-bold text-zinc-200">
                    Instrumental / No lyrics found
                  </p>
                  <p className="text-xs text-zinc-400">
                    LRCLIB had no lyrics match for "{currentTrack.name}".
                  </p>
                </div>
              ) : lyricsData.synced.length > 0 ? (
                lyricsData.synced.map((line, i) => {
                  const isActive = i === activeIndex;
                  const isPast = activeIndex >= 0 && i < activeIndex;
                  const canSeek = line.time <= (duration || 30);

                  return (
                    <button
                      key={`${line.time}-${i}`}
                      ref={isActive ? activeLineRef : null}
                      onClick={() => {
                        if (canSeek) seek(line.time);
                      }}
                      className={`w-full block text-center px-4 py-2 rounded-2xl transition-all duration-300 ${
                        isActive
                          ? 'font-display text-2xl sm:text-4xl font-extrabold text-white drop-shadow-[0_0_24px_rgba(250,64,94,0.8)] scale-[1.03]'
                          : isPast
                          ? 'font-display text-lg sm:text-2xl font-medium text-zinc-500 hover:text-zinc-300'
                          : 'font-display text-lg sm:text-2xl font-medium text-zinc-400 hover:text-white'
                      } ${!canSeek ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <span>{line.text}</span>
                      {isActive && (
                        <span className="ml-2 text-xs font-mono text-[#fa405e] align-middle">
                          {formatTimestamp(line.time)}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="whitespace-pre-line font-display text-lg sm:text-xl text-zinc-200 leading-relaxed py-6">
                  {lyricsData.plain}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Mini Transport Pill */}
          <div className="pb-5 pt-3 px-4 flex justify-center">
            <div className="px-5 py-2.5 rounded-full glass-panel flex items-center gap-4 shadow-2xl">
              <Sparkles className="w-3.5 h-3.5 text-[#fa405e] hidden sm:block" />
              <span className="text-[11px] font-mono text-zinc-400">
                {formatTimestamp(currentTime)} / {formatTimestamp(duration)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => void prev()}
                  className="p-1.5 text-zinc-300 hover:text-white transition-colors"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={() => void togglePlay()}
                  className="w-9 h-9 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-zinc-950" />
                  ) : (
                    <Play className="w-4 h-4 fill-zinc-950 ml-0.5" />
                  )}
                </button>
                <button
                  onClick={() => void next(false)}
                  className="p-1.5 text-zinc-300 hover:text-white transition-colors"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
