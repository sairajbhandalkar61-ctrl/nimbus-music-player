import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Activity, Heart, Disc, User } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';

export const AuraModal: React.FC = () => {
  const { isAuraOpen, setAuraOpen, playHistory, likedTracks } = usePlayerStore();

  const stats = useMemo(() => {
    const tracks = playHistory.map((h) => h.track);
    const totalPlayed = tracks.length;

    if (totalPlayed === 0) {
      return {
        totalPlayed: 0,
        avgBpm: 0,
        avgEnergy: 0.5,
        avgValence: 0.5,
        avgDance: 0.5,
        avgAcoustic: 0.5,
        topArtists: [] as Array<{ name: string; count: number }>,
        persona: 'Fresh Canvas',
        description: 'Play a few songs to reveal your acoustic listening aura.',
      };
    }

    let sumBpm = 0;
    let sumEnergy = 0;
    let sumValence = 0;
    let sumDance = 0;
    let sumAcoustic = 0;
    const artistCounts = new Map<string, number>();

    for (const t of tracks) {
      sumBpm += t.tempo || 120;
      sumEnergy += t.energy ?? 0.5;
      sumValence += t.valence ?? 0.5;
      sumDance += t.danceability ?? 0.5;
      sumAcoustic += t.acousticness ?? 0.3;

      const primary = (t.artists || 'Unknown').split(',')[0].trim();
      artistCounts.set(primary, (artistCounts.get(primary) || 0) + 1);
    }

    const avgBpm = Math.round(sumBpm / totalPlayed);
    const avgEnergy = sumEnergy / totalPlayed;
    const avgValence = sumValence / totalPlayed;
    const avgDance = sumDance / totalPlayed;
    const avgAcoustic = sumAcoustic / totalPlayed;

    const topArtists = Array.from(artistCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    let persona = 'Balanced Listener';
    let description = 'You explore across genres, tempos, and emotional palettes.';

    if (avgValence >= 0.55 && avgEnergy >= 0.6) {
      persona = 'Euphoric Dynamo';
      description = 'Your aura radiates bright, uplifting grooves and high-momentum rhythms.';
    } else if (avgValence < 0.45 && avgEnergy < 0.55) {
      persona = 'Midnight Dreamer';
      description = 'You gravitate toward atmospheric, introspective, and moody soundscapes.';
    } else if (avgEnergy >= 0.65 && avgValence < 0.5) {
      persona = 'High-Voltage Pulse';
      description = 'Intense driving beats and dramatic tension define your rotation.';
    } else if (avgAcoustic >= 0.45 && avgEnergy < 0.55) {
      persona = 'Acoustic Soul';
      description = 'Warm organic textures and stripped-back melodies anchor your taste.';
    }

    return {
      totalPlayed,
      avgBpm,
      avgEnergy,
      avgValence,
      avgDance,
      avgAcoustic,
      topArtists,
      persona,
      description,
    };
  }, [playHistory]);

  const bars = [
    { label: 'Energy', value: stats.avgEnergy, color: 'from-[#fa405e] to-amber-500' },
    { label: 'Valence (Mood)', value: stats.avgValence, color: 'from-amber-400 to-[#b86be8]' },
    { label: 'Danceability', value: stats.avgDance, color: 'from-[#b86be8] to-[#06b6d4]' },
    { label: 'Acousticness', value: stats.avgAcoustic, color: 'from-emerald-400 to-cyan-500' },
  ];

  return (
    <AnimatePresence>
      {isAuraOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none"
          onClick={() => setAuraOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg glass-panel rounded-3xl border border-white/10 shadow-2xl p-5 sm:p-6 bg-[#0f0f15] max-h-[85vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#fa405e] via-[#b86be8] to-[#06b6d4] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-display font-extrabold text-white tracking-wide">
                    Your Listening Aura
                  </h3>
                  <p className="text-[11px] font-mono text-zinc-400">
                    Computed locally from your play history
                  </p>
                </div>
              </div>

              <button
                onClick={() => setAuraOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Persona Card */}
            <div className="my-4 p-4 rounded-2xl bg-gradient-to-tr from-[#fa405e]/20 via-[#b86be8]/15 to-[#06b6d4]/15 border border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#fa405e] font-bold">
                Acoustic Persona
              </span>
              <h4 className="font-display text-2xl font-extrabold text-white mt-0.5">
                {stats.persona}
              </h4>
              <p className="text-xs text-zinc-300 mt-1">{stats.description}</p>
            </div>

            {/* Summary KPI Row */}
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                <Disc className="w-4 h-4 text-[#fa405e] mx-auto mb-1" />
                <div className="text-lg font-display font-extrabold text-white">
                  {stats.totalPlayed}
                </div>
                <div className="text-[10px] font-mono text-zinc-400 uppercase">Plays</div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                <Activity className="w-4 h-4 text-[#06b6d4] mx-auto mb-1" />
                <div className="text-lg font-display font-extrabold text-white">
                  {stats.avgBpm || '—'}
                </div>
                <div className="text-[10px] font-mono text-zinc-400 uppercase">Avg BPM</div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                <Heart className="w-4 h-4 text-[#b86be8] mx-auto mb-1" />
                <div className="text-lg font-display font-extrabold text-white">
                  {likedTracks.length}
                </div>
                <div className="text-[10px] font-mono text-zinc-400 uppercase">Liked</div>
              </div>
            </div>

            {/* Energy / Valence / Acoustic Bars */}
            <div className="space-y-3 mb-5">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                Mood & Acoustic Profile
              </div>
              {bars.map((bar) => {
                const pct = Math.round(bar.value * 100);
                return (
                  <div key={bar.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-300 font-medium">{bar.label}</span>
                      <span className="font-mono text-zinc-400">{pct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${bar.color} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Top Artists */}
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                Top Artists
              </div>
              {stats.topArtists.length === 0 ? (
                <p className="text-xs text-zinc-500 font-mono py-2">No artist plays recorded yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {stats.topArtists.map((artist, idx) => (
                    <div
                      key={artist.name}
                      className="px-3 py-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono text-zinc-500 w-4">{idx + 1}</span>
                        <User className="w-3.5 h-3.5 text-[#fa405e] flex-shrink-0" />
                        <span className="text-white font-medium truncate">{artist.name}</span>
                      </div>
                      <span className="font-mono text-[11px] text-zinc-400 flex-shrink-0">
                        {artist.count} {artist.count === 1 ? 'play' : 'plays'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
