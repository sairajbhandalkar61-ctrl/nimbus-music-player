import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sliders, RotateCcw, Waves } from 'lucide-react';
import { EQ_PRESETS, usePlayerStore } from '../store/usePlayerStore';
import { EQ_LABELS } from '../audio/audioEngine';
import { CrossfadeDuration, EqPresetId } from '../types';

const PRESET_KEYS: Exclude<EqPresetId, 'custom'>[] = [
  'flat',
  'bass_boost',
  'vocal',
  'lofi',
  'electronic',
  'late_night',
];

const CROSSFADE_OPTIONS: CrossfadeDuration[] = [0, 2, 4, 6];

export const EqualizerModal: React.FC = () => {
  const {
    isEqOpen,
    setEqOpen,
    eqPreset,
    eqBands,
    setEqPreset,
    setEqBand,
    crossfadeSeconds,
    setCrossfade,
  } = usePlayerStore();

  const handleFaderPointer = (
    index: number,
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
    if (clientY === undefined) return;
    const ratio = 1 - Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    const db = Math.round((ratio * 24 - 12) * 2) / 2;
    setEqBand(index, db);
  };

  return (
    <AnimatePresence>
      {isEqOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none"
          onClick={() => setEqOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg glass-dark rounded-3xl border border-white/10 shadow-2xl p-5 sm:p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#fa405e] to-[#8b5cf6] flex items-center justify-center">
                  <Sliders className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-display font-extrabold text-white tracking-wide">
                    5-Band Equalizer
                  </h3>
                  <p className="text-[11px] font-mono text-zinc-400">
                    {eqPreset === 'custom' ? 'Custom Curve' : EQ_PRESETS[eqPreset].label} • Web Audio Biquad
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setEqPreset('flat')}
                  className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Reset to Flat"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEqOpen(false)}
                  className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Presets */}
            <div className="py-4">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                Presets
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_KEYS.map((key) => {
                  const active = eqPreset === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setEqPreset(key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        active
                          ? 'bg-gradient-to-r from-[#fa405e] to-[#8b5cf6] text-white font-semibold shadow-lg shadow-[#fa405e]/20'
                          : 'bg-white/[0.06] border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {EQ_PRESETS[key].label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5 Vertical Faders (-12dB to +12dB) */}
            <div className="py-4 px-3 rounded-2xl bg-white/[0.04] border border-white/10">
              <div className="grid grid-cols-5 gap-2 sm:gap-4 items-center">
                {EQ_LABELS.map((label, idx) => {
                  const val = eqBands[idx] ?? 0;
                  const pct = ((val + 12) / 24) * 100;
                  return (
                    <div key={label} className="flex flex-col items-center gap-2">
                      <span
                        className={`text-[11px] font-mono font-semibold ${
                          val > 0 ? 'text-[#fa405e]' : val < 0 ? 'text-[#8b5cf6]' : 'text-zinc-400'
                        }`}
                      >
                        {val > 0 ? `+${val}` : val}
                      </span>

                      {/* Interactive Vertical Fader Track */}
                      <div
                        className="relative w-10 h-36 flex items-center justify-center cursor-pointer touch-none"
                        onMouseDown={(e) => handleFaderPointer(idx, e)}
                        onMouseMove={(e) => {
                          if (e.buttons === 1) handleFaderPointer(idx, e);
                        }}
                        onTouchStart={(e) => handleFaderPointer(idx, e)}
                        onTouchMove={(e) => handleFaderPointer(idx, e)}
                      >
                        {/* Center 0dB tick */}
                        <div className="absolute left-2 right-2 top-1/2 h-px bg-white/20 pointer-events-none" />

                        {/* Track */}
                        <div className="relative w-2 h-full rounded-full bg-white/10 overflow-hidden pointer-events-none">
                          <div
                            className="absolute bottom-0 left-0 right-0 rounded-full bg-gradient-to-t from-[#8b5cf6] to-[#fa405e] transition-all duration-75"
                            style={{ height: `${pct}%` }}
                          />
                        </div>

                        {/* Thumb Knob */}
                        <div
                          className="absolute w-4 h-4 rounded-full bg-white shadow-[0_0_12px_rgba(250,64,94,0.75)] border border-white/50 pointer-events-none transition-all duration-75"
                          style={{ bottom: `calc(${pct}% - 8px)` }}
                        />

                        {/* Accessible range input */}
                        <input
                          type="range"
                          aria-label={`${label} Equalizer Band`}
                          min={-12}
                          max={12}
                          step={0.5}
                          value={val}
                          onChange={(e) => setEqBand(idx, parseFloat(e.target.value))}
                          className="sr-only"
                        />
                      </div>

                      <span className="text-[11px] font-mono text-zinc-300">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Smooth Crossfade Selector */}
            <div className="pt-4 mt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Waves className="w-4 h-4 text-[#8b5cf6]" />
                <div>
                  <div className="text-xs font-semibold text-white">Smooth Crossfade</div>
                  <div className="text-[10px] font-mono text-zinc-400">
                    Gain overlap between tracks
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {CROSSFADE_OPTIONS.map((sec) => {
                  const active = crossfadeSeconds === sec;
                  return (
                    <button
                      key={sec}
                      onClick={() => setCrossfade(sec)}
                      className={`px-3 py-1 rounded-full text-xs font-mono transition-all border ${
                        active
                          ? 'bg-gradient-to-r from-[#fa405e] to-[#8b5cf6] text-white border-transparent font-bold'
                          : 'bg-white/[0.06] border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {sec === 0 ? 'Off' : `${sec}s`}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
