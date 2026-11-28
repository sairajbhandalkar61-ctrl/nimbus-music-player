import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '../store/usePlayerStore';
import { Activity, Sparkles, Disc, Heart, AlignLeft } from 'lucide-react';

export const KineticTitle: React.FC = () => {
  const {
    currentTrack,
    likedTracks,
    toggleLike,
    setLyricsOpen,
    isLyricsOpen,
    setRightDrawer,
    isRightDrawerOpen,
    rightDrawerTab,
  } = usePlayerStore();

  if (!currentTrack) {
    return (
      <div className="text-center py-4">
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-zinc-400">
          Select a track to begin
        </h2>
        <p className="text-zinc-500 text-xs sm:text-sm mt-1">
          Press / to search 157k tracks or drop local audio files
        </p>
      </div>
    );
  }

  const titleChars = Array.from(currentTrack.name);
  const pitchClasses = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  const keyName = pitchClasses[(currentTrack.key || 0) % 12] || 'C';
  const modeName = currentTrack.mode === 1 ? 'Maj' : 'Min';
  const isLiked = likedTracks.some((t) => t.id === currentTrack.id);
  const isAiMatchActive = isRightDrawerOpen && rightDrawerTab !== 'queue';

  return (
    <div className="text-center max-w-2xl mx-auto px-4 my-1 sm:my-2 select-none">
      {/* Animated Letter-by-Letter Song Title */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTrack.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="flex flex-wrap justify-center items-center gap-x-[1px] mb-1.5"
        >
          {titleChars.map((char, index) => (
            <motion.span
              key={`${currentTrack.id}-${index}`}
              initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{
                duration: 0.4,
                delay: Math.min(index * 0.012, 0.35),
                ease: [0.22, 1, 0.36, 1],
              }}
              className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white inline-block"
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Artist Name • BPM Metadata */}
      <motion.p
        key={`artist-${currentTrack.id}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="text-zinc-300 text-xs sm:text-sm font-medium mb-3 line-clamp-1"
      >
        {currentTrack.artists} <span className="text-zinc-500 mx-1">•</span>{' '}
        <span className="font-mono text-zinc-400">{Math.round(currentTrack.tempo)} BPM</span>
      </motion.p>

      {/* Subtle Feature Pills */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3.5 text-[11px] font-mono text-zinc-400">
        <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10 capitalize">
          {currentTrack.mood}
        </span>
        <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10 flex items-center gap-1">
          <Disc className="w-3 h-3 text-[#8b5cf6]" />
          {keyName} {modeName}
        </span>
        <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10 flex items-center gap-1">
          <Activity className="w-3 h-3 text-[#fa405e]" />
          {Math.round(currentTrack.energy * 100)}% energy
        </span>
      </div>

      {/* Quick-Action Pill Row: ♥ Like | Lyrics | ✨ AI Match */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => toggleLike()}
          className={`px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all border ${
            isLiked
              ? 'bg-[#fa405e]/20 border-[#fa405e]/50 text-[#fa405e] shadow-lg shadow-[#fa405e]/15'
              : 'glass-pill text-zinc-200 hover:text-white'
          }`}
          title="Like Track (L)"
        >
          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-[#fa405e]' : ''}`} />
          <span>{isLiked ? 'Liked' : 'Like'}</span>
        </button>

        <button
          onClick={() => setLyricsOpen(!isLyricsOpen)}
          className={`px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all border ${
            isLyricsOpen
              ? 'bg-white text-zinc-950 border-white font-semibold'
              : 'glass-pill text-zinc-200 hover:text-white'
          }`}
          title="Glowing Synced Lyrics"
        >
          <AlignLeft className="w-3.5 h-3.5" />
          <span>Lyrics</span>
        </button>

        <button
          onClick={() => setRightDrawer(!isAiMatchActive, 'match')}
          className={`px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all border ${
            isAiMatchActive
              ? 'bg-gradient-to-r from-[#fa405e] to-[#8b5cf6] border-transparent text-white font-semibold shadow-lg shadow-[#fa405e]/25'
              : 'glass-pill text-zinc-200 hover:text-white'
          }`}
          title="Open AI Match & Queue"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#fa405e] fill-current" style={isAiMatchActive ? { color: '#fff' } : undefined} />
          <span>AI Match</span>
        </button>
      </div>
    </div>
  );
};
