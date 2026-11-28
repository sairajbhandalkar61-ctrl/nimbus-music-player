import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Music } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { RadialVisualizer } from './RadialVisualizer';

export const DiscPlayer: React.FC = () => {
  const { currentTrack, isPlaying, togglePlay, isSynthesizing } = usePlayerStore();
  const discRef = useRef<HTMLDivElement>(null);
  const rotation = useRef(0);
  const angularVelocity = useRef(0);

  const discRadius = 142;

  useEffect(() => {
    let lastTime = performance.now();
    let animId: number;

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const targetVel = isPlaying ? 0.85 : 0.0;
      const damp = 1 - Math.exp(-2.5 * dt);
      angularVelocity.current += (targetVel - angularVelocity.current) * damp;

      rotation.current += angularVelocity.current * dt;

      if (discRef.current) {
        discRef.current.style.transform = `rotate(${rotation.current}rad)`;
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  return (
    <div className="relative flex items-center justify-center my-1 sm:my-4 scale-[0.78] sm:scale-95 md:scale-100 select-none">
      {/* Ambient rose-violet glow behind disc */}
      <div
        className={`absolute w-72 h-72 rounded-full blur-3xl transition-opacity duration-700 pointer-events-none bg-gradient-to-tr from-[#fa405e]/30 via-[#8b5cf6]/25 to-transparent ${
          isPlaying ? 'opacity-100' : 'opacity-40'
        }`}
      />

      {/* Audio Reactive 120Hz Radial Bar Ring */}
      <RadialVisualizer radius={discRadius} />

      {/* Spinning Inertia Vinyl Disc */}
      <div
        onClick={() => void togglePlay()}
        className="relative group cursor-pointer z-10"
        style={{ width: `${discRadius * 2}px`, height: `${discRadius * 2}px` }}
      >
        <div
          ref={discRef}
          className="w-full h-full rounded-full shadow-[0_24px_60px_rgba(0,0,0,0.85)] relative overflow-hidden transition-shadow duration-500 border border-white/10 group-hover:shadow-[0_25px_70px_rgba(250,64,94,0.3)]"
          style={{
            background: 'radial-gradient(circle, #181822 0%, #0b0b10 68%, #040406 100%)',
          }}
        >
          {/* Realistic Vinyl Microgrooves */}
          <div className="absolute inset-0 rounded-full opacity-45 bg-[radial-gradient(circle_at_center,_transparent_28%,_rgba(255,255,255,0.08)_29%,_transparent_30%,_rgba(255,255,255,0.05)_44%,_transparent_45%,_rgba(255,255,255,0.07)_58%,_transparent_59%,_rgba(255,255,255,0.06)_74%,_transparent_75%,_rgba(255,255,255,0.08)_89%,_transparent_90%)]" />

          {/* Specular Anisotropic Shine */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none opacity-65"
            style={{
              background:
                'conic-gradient(from 40deg, transparent 0deg, rgba(255,255,255,0.14) 35deg, transparent 80deg, transparent 180deg, rgba(250,64,94,0.12) 220deg, transparent 270deg)',
            }}
          />

          {/* Glowing Rose / Album Art Center Label */}
          <div className="absolute inset-[25%] rounded-full overflow-hidden border-2 border-[#fa405e]/60 shadow-[0_0_28px_rgba(250,64,94,0.4)] bg-zinc-900 flex items-center justify-center">
            {currentTrack?.artworkUrl ? (
              <img
                src={currentTrack.artworkUrl}
                alt={currentTrack.name}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-[#fa405e]/65 via-[#8b5cf6]/60 to-[#08080a] text-white">
                <Music className="w-8 h-8 opacity-90 mb-1" />
                <span className="text-[9px] font-mono tracking-widest uppercase opacity-90">
                  NIMBUS
                </span>
              </div>
            )}

            {/* Center Vinyl Spindle Hole */}
            <div className="absolute w-5 h-5 rounded-full bg-[#08080a] border-2 border-white/30 shadow-inner flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-950" />
            </div>
          </div>
        </div>

        {/* Hover / Play State Center Badge */}
        <div className="absolute inset-0 rounded-full flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
          <div className="w-14 h-14 rounded-full bg-white/95 text-zinc-950 flex items-center justify-center shadow-2xl scale-95 group-hover:scale-100 transition-transform">
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-zinc-950" />
            ) : (
              <Play className="w-6 h-6 fill-zinc-950 ml-1" />
            )}
          </div>
        </div>
      </div>

      {/* Synthesizer Indicator Badge */}
      {isSynthesizing && isPlaying && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-3 px-3 py-1 rounded-full glass-pill border-[#fa405e]/40 text-[#fa405e] text-[10px] font-mono tracking-wider flex items-center gap-1.5 shadow-lg"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#fa405e] animate-ping" />
          GENERATIVE AMBIENT SYNTH
        </motion.div>
      )}
    </div>
  );
};
