import React, { useMemo, useState } from 'react';
import { Wand2, Sparkles, Play, ListPlus, Heart } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { SongArtwork } from './SongArtwork';
import { MixParams, Track } from '../types';
import { API_BASE_URL } from '../lib/config';

const VIBE_PRESETS: Array<{ label: string; emoji: string; params: MixParams }> = [
  {
    label: 'Late Night Focus',
    emoji: '🌙',
    params: { valence: 0.32, energy: 0.34, danceability: 0.50, acousticness: 0.68, tempo: 92 },
  },
  {
    label: 'High-Energy Workout',
    emoji: '⚡',
    params: { valence: 0.72, energy: 0.90, danceability: 0.80, acousticness: 0.08, tempo: 132 },
  },
  {
    label: 'Chill Acoustic',
    emoji: '🌿',
    params: { valence: 0.55, energy: 0.28, danceability: 0.48, acousticness: 0.85, tempo: 95 },
  },
  {
    label: 'Euphoric',
    emoji: '✨',
    params: { valence: 0.90, energy: 0.82, danceability: 0.78, acousticness: 0.15, tempo: 122 },
  },
];

export const VibeMixerView: React.FC = () => {
  const { setTrack, addToQueue, addMultipleToQueue, toggleLike, likedTracks } = usePlayerStore();

  const [params, setParams] = useState<MixParams>({
    valence: 0.65,
    energy: 0.68,
    danceability: 0.7,
    acousticness: 0.2,
    tempo: 120,
    limit: 24,
  });
  const [results, setResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const likedIds = useMemo(() => new Set(likedTracks.map((t) => t.id)), [likedTracks]);

  const generateMix = async (target: MixParams = params) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/mix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...target, limit: 24 }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.tracks || []);
      }
    } catch (e) {
      console.warn('[VibeMixer] Error calling /api/mix:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="w-full h-screen overflow-y-auto pt-20 pb-36 px-3 sm:px-8 select-none overscroll-contain"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header & Preset Pills */}
        <div className="glass-panel rounded-3xl p-4 sm:p-6 space-y-4 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#fa405e] to-[#8b5cf6] flex items-center justify-center shadow-lg shadow-[#fa405e]/25">
                <Wand2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Vibe Mixer
                </h2>
                <p className="text-xs text-zinc-400">
                  Sculpt target acoustic coordinates across 157,685 Spotify tracks
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => void generateMix()}
                disabled={isLoading}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-[#fa405e] to-[#8b5cf6] text-white text-xs font-bold tracking-wide shadow-lg shadow-[#fa405e]/25 hover:opacity-95 transition-opacity flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Mixing...' : 'Generate Custom Mix'}</span>
              </button>

              {results.length > 0 && (
                <button
                  onClick={() => {
                    void setTrack(results[0], true, true);
                    if (results.length > 1) addMultipleToQueue(results.slice(1));
                  }}
                  className="px-4 py-2 rounded-full bg-white text-zinc-950 font-bold text-xs flex items-center gap-1.5 hover:scale-105 transition-transform"
                >
                  <Play className="w-3.5 h-3.5 fill-zinc-950" />
                  Play All ({results.length})
                </button>
              )}
            </div>
          </div>

          {/* One-Click Mood Presets */}
          <div className="flex flex-wrap gap-2">
            {VIBE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  const next = { ...preset.params, limit: 24 };
                  setParams(next);
                  void generateMix(next);
                }}
                className="px-3.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 text-xs font-medium text-zinc-100 flex items-center gap-1.5 transition-all"
              >
                <span>{preset.emoji}</span>
                <span>{preset.label}</span>
              </button>
            ))}
          </div>

          {/* Interactive Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              {
                key: 'valence' as const,
                label: 'Valence',
                min: 0,
                max: 1,
                step: 0.01,
                fmt: (v: number) => `${Math.round(v * 100)}%`,
              },
              {
                key: 'energy' as const,
                label: 'Energy',
                min: 0,
                max: 1,
                step: 0.01,
                fmt: (v: number) => `${Math.round(v * 100)}%`,
              },
              {
                key: 'danceability' as const,
                label: 'Danceability',
                min: 0,
                max: 1,
                step: 0.01,
                fmt: (v: number) => `${Math.round(v * 100)}%`,
              },
              {
                key: 'acousticness' as const,
                label: 'Acoustic',
                min: 0,
                max: 1,
                step: 0.01,
                fmt: (v: number) => `${Math.round(v * 100)}%`,
              },
              {
                key: 'tempo' as const,
                label: 'Tempo',
                min: 60,
                max: 200,
                step: 1,
                fmt: (v: number) => `${Math.round(v)} BPM`,
              },
            ].map((s) => (
              <div key={s.key} className="p-2.5 rounded-2xl bg-black/30 border border-white/10 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-300 font-medium">{s.label}</span>
                  <span className="font-mono text-[#fa405e] font-semibold">
                    {s.fmt(params[s.key])}
                  </span>
                </div>
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={params[s.key]}
                  onChange={(e) =>
                    setParams((prev) => ({
                      ...prev,
                      [s.key]: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full h-1.5 accent-[#fa405e]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Results Grid */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {results.map((track) => {
              const isLiked = likedIds.has(track.id);
              return (
                <div
                  key={track.id}
                  onClick={() => void setTrack(track, true, true)}
                  className="group p-3 rounded-2xl song-card flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 relative">
                      <SongArtwork track={track} className="w-full h-full" showVinylEffect={false} />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-[#fa405e] transition-colors">
                        {track.name}
                      </h4>
                      <p className="text-[11px] text-zinc-400 truncate">{track.artists}</p>
                      <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                        {Math.round(track.tempo)} BPM •{' '}
                        {track.similarity !== undefined ? `${Math.round(track.similarity * 100)}% fit` : track.mood}
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-1 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => toggleLike(track)}
                      className={`p-1.5 rounded-lg hover:bg-white/10 ${
                        isLiked ? 'text-[#fa405e]' : 'text-zinc-400 hover:text-white'
                      }`}
                      title="Like"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-[#fa405e]' : ''}`} />
                    </button>
                    <button
                      onClick={() => addToQueue(track)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
                      title="Add to Queue"
                    >
                      <ListPlus className="w-3.5 h-3.5" />
                    </button>
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
