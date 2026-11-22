import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Music, Disc as DiscIcon } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { RadialVisualizer } from './RadialVisualizer';

export const DiscPlayer: React.FC = () => {
  const { currentTrack, isPlaying, togglePlay, isSynthesizing } = usePlayerStore();
  const discRef = useRef<HTMLDivElement>(null);
  const rotation = useRef(0);
  const angularVelocity = useRef(0);

  // Disc radius (150px = 300px diameter on desktop, responsive on mobile)
  const discRadius = 145;

  useEffect(() => {
    let lastTime = performance.now();
    let animId: number;

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Target angular velocity: ~0.8 rad/sec when playing, 0 when stopped
      const targetVel = isPlaying ? 0.85 : 0.0;
      // Exponential inertia damping
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
    <div className="relative flex items-center justify-center my-6 select-none">
      {/* Audio Reactive Radial Bar Ring */}
      <RadialVisualizer radius={discRadius} />

      {/* Spinning Inertia Disc */}
      <div
        onClick={togglePlay}
        className="relative group cursor-pointer z-10"
        style={{ width: `${discRadius * 2}px`, height: `${discRadius * 2}px` }}
      >
        <div
          ref={discRef}
          className="w-full h-full rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden transition-shadow duration-500 group-hover:shadow-[0_25px_60px_rgba(250,64,94,0.25)]"
          style={{
            background: 'radial-gradient(circle, #1a1a24 0%, #0d0d12 70%, #050508 100%)',
          }}
        >
          {/* Vinyl Microgrooves */}
          <div className="absolute inset-0 rounded-full opacity-35 bg-[radial-gradient(circle_at_center,_transparent_30%,_rgba(255,255,255,0.08)_32%,_transparent_33%,_rgba(255,255,255,0.06)_50%,_transparent_51%,_rgba(255,255,255,0.08)_70%,_transparent_71%)]" />
          
          {/* Holographic Sheen Reflection */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/5 via-transparent to-white/10 opacity-70 pointer-events-none" />

          {/* Central Artwork Sticker */}
          <div className="absolute inset-[24%] rounded-full overflow-hidden border-2 border-white/20 shadow-inner bg-zinc-900 flex items-center justify-center">
            {currentTrack?.artworkUrl ? (
              <img
                src={currentTrack.artworkUrl}
                alt={currentTrack.name}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-[#fa405e]/40 via-[#b86be8]/40 to-zinc-900 text-zinc-300">
                <Music className="w-8 h-8 opacity-70 mb-1" />
                <span className="text-[9px] font-mono tracking-widest uppercase opacity-75">
                  NIMBUS
                </span>
              </div>
            )}

            {/* Center Vinyl Spindle Hole */}
            <div className="absolute w-5 h-5 rounded-full bg-[#08080a] border-2 border-zinc-700 shadow-inner flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-950" />
            </div>
          </div>
        </div>

        {/* Hover / Play State Center Badge */}
        <div className="absolute inset-0 rounded-full flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
          <div className="w-14 h-14 rounded-full bg-white/90 text-zinc-950 flex items-center justify-center shadow-2xl scale-95 group-hover:scale-100 transition-transform">
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
          className="absolute -bottom-4 px-3 py-1 rounded-full glass-pill border-[#fa405e]/40 text-[#fa405e] text-[11px] font-mono tracking-wider flex items-center gap-1.5 shadow-lg"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#fa405e] animate-ping" />
          GENERATIVE AMBIENT SYNTH
        </motion.div>
      )}
    </div>
  );
};
