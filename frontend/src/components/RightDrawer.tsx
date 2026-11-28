import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  ListMusic,
  ListPlus,
  Radio,
  Trash2,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Play,
  Shuffle,
  Repeat,
  Repeat1,
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { SongArtwork } from './SongArtwork';

export const RightDrawer: React.FC = () => {
  const {
    isRightDrawerOpen,
    rightDrawerTab,
    setRightDrawer,
    setRightDrawerTab,
    currentTrack,
    recommendations,
    isLoadingRecs,
    queue,
    shuffle,
    repeatMode,
    autoPlayRadio,
    toggleShuffle,
    cycleRepeatMode,
    toggleAutoPlayRadio,
    setTrack,
    addToQueue,
    removeFromQueue,
    moveQueueItem,
    clearQueue,
  } = usePlayerStore();

  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const showMatch = rightDrawerTab === 'match' || rightDrawerTab === 'both';
  const showQueue = rightDrawerTab === 'queue' || rightDrawerTab === 'both';

  return (
    <AnimatePresence>
      {isRightDrawerOpen && (
        <>
          {/* Click-outside backdrop on small/medium viewports; non-blocking on xl stage so disc stays interactive */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRightDrawer(false)}
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm xl:hidden"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed top-16 sm:top-20 right-0 sm:right-4 bottom-24 sm:bottom-28 z-40 w-full sm:w-[410px] xl:w-[430px] sm:rounded-3xl glass-dark border border-white/10 p-4 sm:p-5 flex flex-col shadow-2xl select-none overflow-hidden"
          >
            {/* Top Switcher Bar */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
              <div className="flex items-center gap-1 p-1 rounded-full bg-white/[0.06] border border-white/10">
                <button
                  onClick={() => setRightDrawerTab('both')}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-mono transition-all ${
                    rightDrawerTab === 'both'
                      ? 'bg-white text-zinc-950 font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Split
                </button>
                <button
                  onClick={() => setRightDrawerTab('match')}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-mono transition-all flex items-center gap-1 ${
                    rightDrawerTab === 'match'
                      ? 'bg-gradient-to-r from-[#fa405e] to-[#8b5cf6] text-white font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  AI Match
                </button>
                <button
                  onClick={() => setRightDrawerTab('queue')}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-mono transition-all flex items-center gap-1 ${
                    rightDrawerTab === 'queue'
                      ? 'bg-gradient-to-r from-[#fa405e] to-[#8b5cf6] text-white font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <ListMusic className="w-3 h-3" />
                  Up Next ({queue.length})
                </button>
              </div>

              <button
                onClick={() => setRightDrawer(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Close Drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Stacked / Tabbed Content */}
            <div className="flex-1 overflow-y-auto pt-3 space-y-5 pr-1">
              {/* SECTION 1: AI MATCH */}
              {showMatch && (
                <section className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#fa405e]" />
                      <h3 className="text-[11px] font-mono font-bold tracking-widest uppercase text-zinc-200">
                        AI Match
                      </h3>
                    </div>
                    {currentTrack && (
                      <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[200px]">
                        Seed: {currentTrack.name}
                      </span>
                    )}
                  </div>

                  {isLoadingRecs ? (
                    <div className="space-y-2 py-2">
                      {[1, 2, 3].map((n) => (
                        <div key={n} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
                      ))}
                    </div>
                  ) : recommendations.length === 0 ? (
                    <div className="py-6 text-center rounded-2xl bg-white/[0.03] border border-white/5 text-xs text-zinc-500 font-mono">
                      Select any catalog song to see KNN acoustic matches.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recommendations.map((rec, i) => {
                        const similarityPct =
                          rec.similarity !== undefined ? Math.round(rec.similarity * 100) : 94;
                        const deltas = rec.feature_deltas;
                        const featureBars = [
                          {
                            label: 'Energy',
                            pct: Math.round(
                              Math.max(0.15, deltas ? 1 - Math.abs(deltas.energy) : rec.energy) * 100
                            ),
                          },
                          {
                            label: 'Valence',
                            pct: Math.round(
                              Math.max(0.15, deltas ? 1 - Math.abs(deltas.valence) : rec.valence) * 100
                            ),
                          },
                          {
                            label: 'Tempo',
                            pct: Math.round(
                              Math.max(
                                0.15,
                                deltas ? 1 - Math.min(1, Math.abs(deltas.tempo) / 60) : 0.85
                              ) * 100
                            ),
                          },
                        ];

                        return (
                          <div
                            key={rec.id}
                            onClick={() => void setTrack(rec, true, true)}
                            className="group p-2.5 rounded-2xl song-card cursor-pointer flex flex-col gap-2"
                          >
                            <div className="flex items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <span className="text-[11px] font-mono text-zinc-500 w-3 text-center">
                                  {i + 1}
                                </span>
                                <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                                  <SongArtwork
                                    track={rec}
                                    className="w-full h-full"
                                    showVinylEffect={false}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-semibold text-white truncate group-hover:text-[#fa405e] transition-colors">
                                    {rec.name}
                                  </h4>
                                  <p className="text-[11px] text-zinc-400 truncate">
                                    {rec.artists} • {Math.round(rec.tempo)} BPM
                                  </p>
                                </div>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToQueue(rec);
                                }}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                                title="Add to Up Next"
                              >
                                <ListPlus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Headline + Gradient Feature-Comparison Bars */}
                            <div className="pt-1.5 border-t border-white/5 space-y-1.5">
                              <div className="flex items-center justify-between text-[10px] font-mono">
                                <span className="text-[#fa405e] font-bold">
                                  {similarityPct}% match
                                  {rec.match_reason ? ` • ${rec.match_reason}` : ''}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                {featureBars.map((fb) => (
                                  <div key={fb.label} className="space-y-0.5">
                                    <div className="flex justify-between text-[9px] font-mono text-zinc-400">
                                      <span>{fb.label}</span>
                                      <span>{fb.pct}%</span>
                                    </div>
                                    <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                                      <div
                                        className="h-full rounded-full bg-gradient-to-r from-[#fa405e] to-[#8b5cf6]"
                                        style={{ width: `${fb.pct}%` }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}

              {/* SECTION 2: UP NEXT QUEUE */}
              {showQueue && (
                <section className="space-y-2.5 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <ListMusic className="w-3.5 h-3.5 text-[#8b5cf6]" />
                      <h3 className="text-[11px] font-mono font-bold tracking-widest uppercase text-zinc-200">
                        Up Next ({queue.length})
                      </h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={toggleShuffle}
                        className={`p-1.5 rounded-lg border text-[10px] transition-colors ${
                          shuffle
                            ? 'bg-[#fa405e]/20 border-[#fa405e]/40 text-[#fa405e]'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                        title="Shuffle"
                      >
                        <Shuffle className="w-3 h-3" />
                      </button>

                      <button
                        onClick={cycleRepeatMode}
                        className={`p-1.5 rounded-lg border text-[10px] transition-colors ${
                          repeatMode !== 'off'
                            ? 'bg-[#8b5cf6]/25 border-[#8b5cf6]/40 text-[#c4b5fd]'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                        title={`Repeat: ${repeatMode}`}
                      >
                        {repeatMode === 'one' ? (
                          <Repeat1 className="w-3 h-3" />
                        ) : (
                          <Repeat className="w-3 h-3" />
                        )}
                      </button>

                      <button
                        onClick={toggleAutoPlayRadio}
                        className={`px-2 py-1 rounded-lg border text-[10px] font-mono flex items-center gap-1 transition-colors ${
                          autoPlayRadio
                            ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                        title="Auto-Play KNN Radio when queue finishes"
                      >
                        <Radio className="w-3 h-3" />
                        <span>Radio</span>
                      </button>

                      {queue.length > 0 && (
                        <button
                          onClick={clearQueue}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                          title="Clear Queue"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {queue.length === 0 ? (
                    <div className="py-5 px-3 text-center rounded-2xl bg-white/[0.03] border border-white/5">
                      <p className="text-xs text-zinc-400">Queue is empty</p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        {autoPlayRadio
                          ? 'Auto-Play Radio will seamlessly queue KNN recommendations next.'
                          : 'Add songs using + from AI Match, Vibe Mixer, or Library.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {queue.map((track, idx) => (
                        <div
                          key={`${track.id}-${idx}`}
                          draggable
                          onDragStart={() => setDragIdx(idx)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (dragIdx !== null && dragIdx !== idx) {
                              moveQueueItem(dragIdx, idx);
                            }
                            setDragIdx(null);
                          }}
                          onClick={() => {
                            removeFromQueue(idx);
                            void setTrack(track, true, true);
                          }}
                          className={`group p-2 rounded-xl song-card flex items-center justify-between gap-2 cursor-pointer ${
                            dragIdx === idx ? 'opacity-50 border-[#fa405e]' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <GripVertical className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0 hidden sm:block cursor-grab" />
                            <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 relative">
                              <SongArtwork
                                track={track}
                                className="w-full h-full"
                                showVinylEffect={false}
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play className="w-3 h-3 fill-white text-white ml-0.5" />
                              </div>
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-xs font-semibold text-white truncate">
                                {track.name}
                              </h5>
                              <p className="text-[10px] text-zinc-400 truncate">{track.artists}</p>
                            </div>
                          </div>

                          <div
                            className="flex items-center gap-0.5 flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => moveQueueItem(idx, idx - 1)}
                              disabled={idx === 0}
                              className="p-1 rounded text-zinc-500 hover:text-white disabled:opacity-25"
                              title="Move up"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => moveQueueItem(idx, idx + 1)}
                              disabled={idx === queue.length - 1}
                              className="p-1 rounded text-zinc-500 hover:text-white disabled:opacity-25"
                              title="Move down"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => removeFromQueue(idx)}
                              className="p-1 rounded text-zinc-500 hover:text-red-400"
                              title="Remove"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
