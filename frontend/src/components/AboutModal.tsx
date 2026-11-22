import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Layers, Cpu, Music, Code2 } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';

export const AboutModal: React.FC = () => {
  const { isAboutOpen, setAboutOpen } = usePlayerStore();

  return (
    <AnimatePresence>
      {isAboutOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none"
          onClick={() => setAboutOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg glass-panel rounded-3xl border border-white/10 shadow-2xl p-6 bg-[#0f0f15] text-left overflow-hidden relative"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#fa405e] to-[#b86be8] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-display font-extrabold text-white tracking-wider">
                    NIMBUS PLAYER
                  </h3>
                  <p className="text-[11px] font-mono text-zinc-400">
                    Inspired by daydreamplayer.com
                  </p>
                </div>
              </div>

              <button
                onClick={() => setAboutOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Architecture Details */}
            <div className="py-4 space-y-4 text-xs text-zinc-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2 text-white font-semibold mb-1 text-sm">
                  <Cpu className="w-4 h-4 text-[#fa405e]" />
                  <span>Cosine KNN Machine Learning Engine</span>
                </div>
                <p className="text-zinc-400">
                  Transformed from the original Python/Streamlit recommendation system. Standardizes 9 acoustic dimensions (valence, energy, danceability, tempo, loudness, acousticness, instrumentalness, liveness, speechiness) via scikit-learn <code className="text-zinc-200">StandardScaler</code>, with brute-force cosine distance search over 157,685 unique tracks.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2 text-white font-semibold mb-1 text-sm">
                  <Layers className="w-4 h-4 text-[#b86be8]" />
                  <span>120Hz Web Audio & Fluid Aurora Shader</span>
                </div>
                <p className="text-zinc-400">
                  Full-screen WebGL fragment shader with Simplex noise that actively reacts to music valence (color palette shifts from cool indigo to warm amber/crimson), energy (turbulence speed), and real-time audio bass from the Web Audio <code className="text-zinc-200">AnalyserNode</code>. Rendered with delta-time exponential damping.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2 text-white font-semibold mb-1 text-sm">
                  <Music className="w-4 h-4 text-[#06b6d4]" />
                  <span>Dual Playback & Generative Synthesizer</span>
                </div>
                <p className="text-zinc-400">
                  Proxies 30-second AAC clips from Apple CDN with HTTP 206 Byte Range support and CORS headers to drive the visualizer. For tracks without preview clips, a Web Audio oscillator pad generates ambient chord progressions tuned to the song's musical key and mode.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2 text-white font-semibold mb-1 text-sm">
                  <Code2 className="w-4 h-4 text-amber-400" />
                  <span>Typography & Motion Design</span>
                </div>
                <p className="text-zinc-400">
                  Features Bricolage Grotesque variable optical typography with instant <code className="text-zinc-200">font-variation-settings</code> weight morphing ("REGULAR / BOLD"), letter-by-letter animated wordmark loader, and rotational vinyl inertia physics.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span>FastAPI • React • Three.js • Zustand</span>
              <button
                onClick={() => setAboutOpen(false)}
                className="px-4 py-1.5 rounded-full bg-white text-zinc-950 font-semibold hover:bg-zinc-200 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
