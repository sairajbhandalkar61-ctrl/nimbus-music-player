import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '../store/usePlayerStore';
import { Activity, Flame, Sparkles, Disc } from 'lucide-react';

export const KineticTitle: React.FC = () => {
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  if (!currentTrack) {
    return (
      <div className="text-center py-6">
        <h2 className="font-display text-3xl font-extrabold text-zinc-500">
          Select a track to begin
        </h2>
        <p className="text-zinc-600 text-sm mt-1">
          Explore the gallery or search the 157k library
        </p>
      </div>
    );
  }

  const titleChars = Array.from(currentTrack.name);

  // Pitch notation for keys (0 = C, 1 = C#, 2 = D, etc.)
  const pitchClasses = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  const keyName = pitchClasses[currentTrack.key % 12] || 'C';
  const modeName = currentTrack.mode === 1 ? 'Maj' : 'Min';

  return (
    <div className="text-center max-w-2xl mx-auto px-4 my-2 select-none">
      {/* Animated Letter-by-Letter Song Title */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTrack.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="flex flex-wrap justify-center items-center gap-x-[1px] mb-2"
        >
          {titleChars.map((char, index) => (
            <motion.span
              key={`${currentTrack.id}-${index}`}
              initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{
                duration: 0.45,
                delay: Math.min(index * 0.015, 0.4),
                ease: [0.22, 1, 0.36, 1],
              }}
              className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white inline-block"
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Artist Name */}
      <motion.p
        key={`artist-${currentTrack.id}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="text-zinc-400 text-sm sm:text-base font-medium mb-4 line-clamp-1"
      >
        {currentTrack.artists}
      </motion.p>

      {/* Audio Features Badges */}
      <motion.div
        key={`badges-${currentTrack.id}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="flex flex-wrap items-center justify-center gap-2"
      >
        {/* Mood Badge */}
        <span className="glass-pill px-3 py-1 rounded-full text-[11px] font-medium tracking-wide text-zinc-300 capitalize flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-[#fa405e]" />
          {currentTrack.mood}
        </span>

        {/* BPM / Tempo */}
        <span className="glass-pill px-3 py-1 rounded-full text-[11px] font-mono text-zinc-300 flex items-center gap-1">
          <Activity className="w-3 h-3 text-[#06b6d4]" />
          {Math.round(currentTrack.tempo)} BPM
        </span>

        {/* Musical Key */}
        <span className="glass-pill px-3 py-1 rounded-full text-[11px] font-mono text-zinc-300 flex items-center gap-1">
          <Disc className="w-3 h-3 text-[#b86be8]" />
          {keyName} {modeName}
        </span>

        {/* Decade */}
        <span className="glass-pill px-3 py-1 rounded-full text-[11px] font-mono text-zinc-400">
          {currentTrack.decade}s
        </span>

        {/* Energy bar */}
        <div className="glass-pill px-3 py-1 rounded-full text-[11px] font-mono text-zinc-300 flex items-center gap-1.5">
          <Flame className="w-3 h-3 text-[#f59e0b]" />
          <span>{Math.round(currentTrack.energy * 100)}%</span>
        </div>
      </motion.div>
    </div>
  );
};
