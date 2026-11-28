import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  ListMusic,
  Moon,
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { audioEngine } from '../audio/audioEngine';
import { SleepTimerMode } from '../types';

const SLEEP_OPTIONS: Array<{ mode: SleepTimerMode; label: string }> = [
  { mode: '15m', label: '15 min' },
  { mode: '30m', label: '30 min' },
  { mode: '45m', label: '45 min' },
  { mode: '60m', label: '60 min' },
  { mode: 'end_of_track', label: 'End of track' },
  { mode: 'off', label: 'Off' },
];

export const PlayerBar: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    shuffle,
    repeatMode,
    crossfadeSeconds,
    sleepTimerMode,
    sleepTimerEndsAt,
    queue,
    isRightDrawerOpen,
    rightDrawerTab,
    isSynthesizing,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
    toggleMute,
    toggleLike,
    toggleShuffle,
    cycleRepeatMode,
    setSleepTimer,
    pause,
    syncCurrentTime,
    setRightDrawer,
  } = usePlayerStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);
  const [isSleepMenuOpen, setIsSleepMenuOpen] = useState(false);
  const [sleepRemainingLabel, setSleepRemainingLabel] = useState<string | null>(null);
  const crossfadeFiredRef = useRef<string | null>(null);

  const isQueueActive = isRightDrawerOpen && rightDrawerTab !== 'match';

  // Wire dual-deck callbacks on AudioEngine
  useEffect(() => {
    audioEngine.setPlaybackCallbacks(
      (time, dur) => {
        if (!isDragging && !isSynthesizing) {
          syncCurrentTime(time, dur);
        }
      },
      () => {
        void next(true);
      }
    );
  }, [isDragging, isSynthesizing, next, syncCurrentTime]);

  useEffect(() => {
    crossfadeFiredRef.current = null;
  }, [currentTrack?.id]);

  // Auto-crossfade trigger near end of active streamed/local track
  useEffect(() => {
    if (
      !isPlaying ||
      isSynthesizing ||
      !currentTrack ||
      crossfadeSeconds <= 0 ||
      repeatMode === 'one' ||
      sleepTimerMode === 'end_of_track' ||
      duration <= crossfadeSeconds + 1.5
    ) {
      return;
    }

    const remaining = duration - currentTime;
    if (remaining <= crossfadeSeconds && remaining > 0.25 && crossfadeFiredRef.current !== currentTrack.id) {
      crossfadeFiredRef.current = currentTrack.id;
      void next(true);
    }
  }, [
    currentTime,
    currentTrack,
    crossfadeSeconds,
    duration,
    isPlaying,
    isSynthesizing,
    next,
    repeatMode,
    sleepTimerMode,
  ]);

  // Synthetic progress increment when in generative synth fallback mode
  useEffect(() => {
    if (!isSynthesizing || !isPlaying) return;
    const interval = setInterval(() => {
      syncCurrentTime((currentTime + 0.5) % 30, 30);
    }, 500);
    return () => clearInterval(interval);
  }, [isSynthesizing, isPlaying, currentTime, syncCurrentTime]);

  // Sleep Timer countdown & smooth 5-second fade-out
  useEffect(() => {
    if (sleepTimerMode === 'off') {
      setSleepRemainingLabel(null);
      audioEngine.resetSleepFade();
      return;
    }

    if (sleepTimerMode === 'end_of_track') {
      setSleepRemainingLabel('EOT');
      if (isPlaying && duration > 6 && duration - currentTime <= 5 && duration - currentTime > 0) {
        const ratio = Math.max(0.01, (duration - currentTime) / 5);
        audioEngine.setSleepFade(ratio, 0.4);
      }
      return;
    }

    if (!sleepTimerEndsAt) return;

    const tickTimer = () => {
      const remainingMs = sleepTimerEndsAt - Date.now();
      if (remainingMs <= 0) {
        pause();
        audioEngine.resetSleepFade();
        setSleepTimer('off');
        setSleepRemainingLabel(null);
        return;
      }

      const totalSecs = Math.ceil(remainingMs / 1000);
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      setSleepRemainingLabel(mins > 0 ? `${mins}m` : `${secs}s`);

      if (remainingMs <= 5000) {
        audioEngine.setSleepFade(Math.max(0.01, remainingMs / 5000), 0.9);
      }
    };

    tickTimer();
    const id = window.setInterval(tickTimer, 1000);
    return () => window.clearInterval(id);
  }, [sleepTimerMode, sleepTimerEndsAt, isPlaying, currentTime, duration, pause, setSleepTimer]);

  // Global keyboard shortcuts (ignored when typing in inputs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const tag = (activeEl?.tagName || '').toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || activeEl?.isContentEditable) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        void togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        seek(Math.min(duration, currentTime + 5));
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seek(Math.max(0, currentTime - 5));
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        setVolume(Math.min(1, volume + 0.05));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        setVolume(Math.max(0, volume - 0.05));
      } else if (e.code === 'KeyM') {
        toggleMute();
      } else if (e.code === 'KeyL') {
        toggleLike();
      } else if (e.code === 'KeyQ') {
        e.preventDefault();
        setRightDrawer(!isQueueActive, 'queue');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentTime,
    duration,
    isQueueActive,
    seek,
    setRightDrawer,
    setVolume,
    toggleLike,
    toggleMute,
    togglePlay,
    volume,
  ]);

  const formatTime = (secs: number) => {
    const s = Math.floor(secs || 0);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const currentDisplayTime = isDragging ? dragValue : currentTime;
  const progressPercent = duration > 0 ? Math.min(100, (currentDisplayTime / duration) * 100) : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-2.5 sm:px-6 pb-2.5 sm:pb-4 pointer-events-none">
      <div className="max-w-4xl mx-auto rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/10 p-2.5 sm:p-3.5 shadow-2xl pointer-events-auto flex flex-col gap-2 relative">
        {/* Mobile Top Compact Row: Artwork + Title + Sleep/Queue */}
        <div className="flex sm:hidden items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {currentTrack?.artworkUrl ? (
              <img
                src={currentTrack.artworkUrl}
                alt={currentTrack.name}
                className="w-8 h-8 rounded-lg object-cover border border-white/10 flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-white/[0.08] border border-white/10 flex items-center justify-center flex-shrink-0 text-zinc-300 font-mono text-[10px]">
                {currentTrack?.isLocal ? 'WAV' : '♪'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-white truncate leading-tight">
                {currentTrack?.name || 'No Track Selected'}
              </h4>
              <p className="text-[10px] text-zinc-400 truncate">
                {currentTrack?.artists || 'Select a song to start'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setIsSleepMenuOpen(!isSleepMenuOpen)}
              className={`p-1.5 rounded-lg flex items-center gap-1 transition-all ${
                sleepTimerMode !== 'off'
                  ? 'text-amber-300 bg-amber-400/15'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Sleep Timer"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setRightDrawer(!isQueueActive, 'queue')}
              className={`p-1.5 rounded-lg flex items-center gap-1 transition-all ${
                isQueueActive
                  ? 'bg-gradient-to-r from-[#fa405e] to-[#8b5cf6] text-white'
                  : 'text-zinc-300 hover:text-white'
              }`}
              title="Queue & AI Match"
            >
              <ListMusic className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrubbable Progress Bar */}
        <div className="flex items-center gap-2 sm:gap-3 w-full">
          <span className="text-[10px] sm:text-[11px] font-mono text-zinc-400 w-7 sm:w-8 text-right">
            {formatTime(currentDisplayTime)}
          </span>

          <div className="relative flex-1 py-1 cursor-pointer">
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#fa405e] to-[#8b5cf6] rounded-full transition-all duration-75"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <input
              type="range"
              aria-label="Track progress"
              min={0}
              max={duration || 30}
              step={0.1}
              value={currentDisplayTime}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => {
                setIsDragging(false);
                seek(dragValue);
              }}
              onTouchStart={() => setIsDragging(true)}
              onTouchEnd={() => {
                setIsDragging(false);
                seek(dragValue);
              }}
              onChange={(e) => setDragValue(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <span className="text-[10px] sm:text-[11px] font-mono text-zinc-400 w-7 sm:w-8">
            {formatTime(duration)}
          </span>
        </div>

        {/* Lower Row: Artwork + Title (sm+) | Transport | Volume + Sleep + Queue (sm+) */}
        <div className="flex items-center justify-center sm:justify-between gap-2 sm:gap-4 min-w-0">
          {/* Left: Album Artwork & Track Info (Desktop/Tablet) */}
          <div className="hidden sm:flex items-center gap-2.5 min-w-0 w-1/3">
            {currentTrack?.artworkUrl ? (
              <img
                src={currentTrack.artworkUrl}
                alt={currentTrack.name}
                className="w-10 h-10 rounded-xl object-cover shadow border border-white/10 flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center flex-shrink-0 text-zinc-300 font-mono text-[10px]">
                {currentTrack?.isLocal ? 'WAV' : '♪'}
              </div>
            )}

            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-white truncate leading-tight">
                {currentTrack?.name || 'No Track Selected'}
              </h4>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                {currentTrack?.artists || 'Select a song to start'}
              </p>
            </div>
          </div>

          {/* Center: Thumb-Friendly Transport (Shuffle, Prev, Play/Pause, Next, Repeat) */}
          <div className="flex items-center justify-center gap-3 sm:gap-2 flex-shrink-0">
            <button
              onClick={toggleShuffle}
              className={`p-1.5 rounded-lg transition-colors ${
                shuffle ? 'text-[#fa405e] bg-[#fa405e]/15' : 'text-zinc-400 hover:text-white'
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={() => void prev()}
              className="p-1.5 text-zinc-300 hover:text-white hover:scale-110 active:scale-95 transition-all"
              title="Previous"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={() => void togglePlay()}
              className="w-10 h-10 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-zinc-950" />
              ) : (
                <Play className="w-4 h-4 fill-zinc-950 ml-0.5" />
              )}
            </button>

            <button
              onClick={() => void next(false)}
              className="p-1.5 text-zinc-300 hover:text-white hover:scale-110 active:scale-95 transition-all"
              title="Next"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            <button
              onClick={cycleRepeatMode}
              className={`p-1.5 rounded-lg transition-colors ${
                repeatMode !== 'off'
                  ? 'text-[#8b5cf6] bg-[#8b5cf6]/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-4 h-4" />
              ) : (
                <Repeat className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Right: Volume Slider + Sleep Timer + Queue Toggle (Desktop/Tablet) */}
          <div className="hidden sm:flex items-center justify-end gap-2 w-1/3 flex-shrink-0">
            <div className="hidden md:flex items-center gap-1.5 mr-1">
              <button
                onClick={toggleMute}
                className="text-zinc-400 hover:text-white transition-colors"
                title="Mute (M)"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-zinc-500" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                aria-label="Volume"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 h-1 accent-[#fa405e]"
              />
            </div>

            {/* Sleep Timer Popover */}
            <div className="relative">
              <button
                onClick={() => setIsSleepMenuOpen(!isSleepMenuOpen)}
                className={`p-2 rounded-xl flex items-center gap-1 transition-all ${
                  sleepTimerMode !== 'off'
                    ? 'text-amber-300 bg-amber-400/15'
                    : 'text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
                title="Sleep Timer"
              >
                <Moon className="w-4 h-4" />
                {sleepRemainingLabel && (
                  <span className="text-[10px] font-mono font-bold">
                    {sleepRemainingLabel}
                  </span>
                )}
              </button>
            </div>

            {/* Right Drawer (AI Match + Up Next Queue) Toggle */}
            <button
              onClick={() => setRightDrawer(!isQueueActive, 'queue')}
              className={`px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all ${
                isQueueActive
                  ? 'bg-gradient-to-r from-[#fa405e] to-[#8b5cf6] text-white shadow-lg shadow-[#fa405e]/20'
                  : 'text-zinc-300 hover:text-white hover:bg-white/10'
              }`}
              title="Queue & AI Match (Q)"
            >
              <ListMusic className="w-4 h-4" />
              {queue.length > 0 && (
                <span className="font-mono text-[10px] font-bold">{queue.length}</span>
              )}
            </button>
          </div>
        </div>

        {/* Shared Sleep Timer Popover */}
        {isSleepMenuOpen && (
          <div className="absolute bottom-full mb-2 right-3 w-40 p-1.5 rounded-2xl glass-dark shadow-2xl z-50 space-y-0.5">
            <div className="px-2.5 py-1 text-[10px] font-mono uppercase text-zinc-500">
              Sleep Timer
            </div>
            {SLEEP_OPTIONS.map((opt) => (
              <button
                key={opt.mode}
                onClick={() => {
                  setSleepTimer(opt.mode);
                  setIsSleepMenuOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs transition-colors flex items-center justify-between ${
                  sleepTimerMode === opt.mode
                    ? 'bg-[#fa405e]/20 text-[#fa405e] font-semibold'
                    : 'text-zinc-300 hover:bg-white/10'
                }`}
              >
                <span>{opt.label}</span>
                {sleepTimerMode === opt.mode && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#fa405e]" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
