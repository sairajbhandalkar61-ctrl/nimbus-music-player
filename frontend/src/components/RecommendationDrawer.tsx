import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Play, Plus, Activity, Flame, Disc } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { SongArtwork } from './SongArtwork';

export const RecommendationDrawer: React.FC = () => {
  const {
    isRecommendationOpen,
    setRecommendationOpen,
    recommendations,
    currentTrack,
    setTrack,
    isLoadingRecs,
  } = usePlayerStore();

  return (
    <AnimatePresence>
      {isRecommendationOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRecommendationOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[440px] glass-panel border-l border-white/10 p-6 flex flex-col shadow-2xl bg-[#0d0d12]/90 select-none overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#fa405e] to-[#b86be8] flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-wide">
                    Similar Tracks (Cosine KNN)
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    Based on 9 acoustic features
                  </p>
                </div>
              </div>

              <button
                onClick={() => setRecommendationOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Seed Track Reference */}
            {currentTrack && (
              <div className="my-4 p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                  <SongArtwork track={currentTrack} className="w-full h-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-mono text-[#fa405e] font-semibold tracking-wider">
                    Seed Track
                  </span>
                  <h4 className="text-xs font-semibold text-white truncate">
                    {currentTrack.name}
                  </h4>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {currentTrack.artists}
                  </p>
                </div>
              </div>
            )}

            {/* Recommendations List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1">
              {isLoadingRecs ? (
                <div className="py-12 text-center text-zinc-500 font-mono text-xs flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-[#fa405e] border-t-transparent rounded-full animate-spin" />
                  <span>Computing nearest neighbors in 9D space...</span>
                </div>
              ) : recommendations.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 font-mono text-xs">
                  No recommendations generated yet.
                </div>
              ) : (
                recommendations.map((rec, i) => {
                  const similarityPct = rec.similarity !== undefined
                    ? Math.round(rec.similarity * 100)
                    : 95;

                  return (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setTrack(rec, true)}
                      className="group p-3 rounded-xl song-card hover:bg-white/10 cursor-pointer border border-white/5 hover:border-white/20 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono text-zinc-500 w-4 text-center">
                          {i + 1}
                        </span>

                        <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800">
                          <SongArtwork track={rec} className="w-full h-full" showVinylEffect={false} />
                        </div>

                        <div className="min-w-0">
                          <h5 className="text-xs font-semibold text-white truncate group-hover:text-[#fa405e] transition-colors">
                            {rec.name}
                          </h5>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {rec.artists}
                          </p>

                          <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-zinc-500">
                            <span>{rec.decade}s</span>
                            <span>•</span>
                            <span>{Math.round(rec.tempo)} BPM</span>
                            <span>•</span>
                            <span className="capitalize">{rec.mood}</span>
                          </div>
                        </div>
                      </div>

                      {/* Similarity Metric Pill */}
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className="px-2 py-0.5 rounded-full bg-[#fa405e]/20 text-[#fa405e] font-mono text-[10px] font-bold">
                          {similarityPct}% Match
                        </span>
                        <div className="w-12 h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#fa405e] to-[#b86be8] rounded-full"
                            style={{ width: `${similarityPct}%` }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-white/10 text-center">
              <p className="text-[10px] font-mono text-zinc-500">
                Exact Cosine metric on StandardScaler transformed features
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
