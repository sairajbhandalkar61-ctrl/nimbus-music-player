import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Sparkles } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';

export const Loader: React.FC = () => {
  const { isUnlocked, unlockAudio } = usePlayerStore();

  const letters = ['N', 'I', 'M', 'B', 'U', 'S'];

  const handleStart = async () => {
    await unlockAudio();
  };

  // Instant enter on Space or Enter while loader screen is visible
  useEffect(() => {
    if (isUnlocked) return;
    const handleKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        void handleStart();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isUnlocked]);

  return (
    <AnimatePresence>
      {!isUnlocked && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          onClick={handleStart}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#08080a] select-none cursor-pointer"
        >
          {/* Ambient luminous glow */}
          <div className="absolute w-[440px] h-[440px] rounded-full bg-gradient-to-tr from-[#fa405e]/25 via-[#b86be8]/20 to-[#06b6d4]/15 blur-[100px] pointer-events-none" />

          {/* Wordmark Letters Rising In Rapidly */}
          <div className="relative flex items-center gap-2.5 sm:gap-4 mb-6">
            {letters.map((letter, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 32, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{
                  duration: 0.5,
                  delay: 0.05 + i * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="font-display text-5xl sm:text-7xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-400"
              >
                {letter}
              </motion.span>
            ))}
          </div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="text-zinc-400 text-xs sm:text-sm tracking-widest uppercase mb-10 flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#fa405e]" />
            Atmospheric Audio Recommender • 157k Library
          </motion.p>

          {/* "Press to listen" Unlock Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 35px rgba(250, 64, 94, 0.45)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            onClick={(e) => {
              e.stopPropagation();
              handleStart();
            }}
            className="group relative px-8 py-3.5 rounded-full bg-white text-zinc-950 font-medium text-xs sm:text-sm tracking-wider flex items-center gap-3 shadow-2xl transition-all duration-200"
          >
            <span className="relative flex items-center justify-center w-6 h-6 rounded-full bg-zinc-950 text-white">
              <Play className="w-3 h-3 fill-white ml-0.5" />
            </span>
            <span className="relative font-bold tracking-widest">ENTER PLAYER</span>
          </motion.button>

          <div className="absolute bottom-8 text-[11px] text-zinc-500 font-mono">
            Click anywhere or press Space to enter
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
