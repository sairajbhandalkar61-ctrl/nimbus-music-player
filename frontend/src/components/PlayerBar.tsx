import React, { useEffect, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { audioEngine } from '../audio/audioEngine';

export const PlayerBar: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
    toggleMute,
    syncCurrentTime,
    isRecommendationOpen,
    setRecommendationOpen,
    recommendations,
    isSynthesizing,
  } = usePlayerStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);

  // Sync audio element time to Zustand store
  useEffect(() => {
    const audio = audioEngine.getAudioElement();
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (!isDragging && !isSynthesizing) {
        syncCurrentTime(audio.currentTime, audio.duration || 30);
      }
    };

    const handleEnded = () => {
      next();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [isDragging, isSynthesizing, next, syncCurrentTime]);

  // Synthetic progress increment when in generative synth fallback mode
  useEffect(() => {
    if (!isSynthesizing || !isPlaying) return;

    const interval = setInterval(() => {
      syncCurrentTime((currentTime + 0.5) % 30, 30);
    }, 500);

    return () => clearInterval(interval);
  }, [isSynthesizing, isPlaying, currentTime, syncCurrentTime]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        seek(Math.min(duration, currentTime + 5));
      } else if (e.code === 'ArrowLeft') {
        seek(Math.max(0, currentTime - 5));
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        setVolume(Math.min(1, volume + 0.05));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        setVolume(Math.max(0, volume - 0.05));
      } else if (e.code === 'KeyM') {
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, duration, isPlaying, seek, setVolume, toggleMute, togglePlay, volume]);

  const formatTime = (secs: number) => {
    const s = Math.floor(secs || 0);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const currentDisplayTime = isDragging ? dragValue : currentTime;
  const progressPercent = duration > 0 ? (currentDisplayTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pointer-events-none">
      <div className="max-w-4xl mx-auto glass-panel rounded-2xl p-3 sm:p-4 shadow-2xl pointer-events-auto border border-white/10 flex flex-col gap-2.5">
        
        {/* Scrubber Progress Bar */}
        <div className="flex items-center gap-3 w-full">
          <span className="text-[11px] font-mono text-zinc-400 w-8 text-right">
            {formatTime(currentDisplayTime)}
          </span>

          <div className="relative flex-1 group py-1 cursor-pointer">
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#fa405e] to-[#b86be8] rounded-full transition-all duration-75"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <input
              type="range"
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

          <span className="text-[11px] font-mono text-zinc-400 w-8">
            {formatTime(duration)}
          </span>
        </div>

        {/* Lower Row: Track Info + Play Controls + Volume / Drawer Trigger */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left: Thumbnail & Song Name */}
          <div className="flex items-center gap-3 min-w-0 w-1/3">
            {currentTrack?.artworkUrl ? (
              <img
                src={currentTrack.artworkUrl}
                alt={currentTrack.name}
                className="w-10 h-10 rounded-lg object-cover shadow border border-white/10 flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center flex-shrink-0 text-zinc-500 font-mono text-xs">
                ♪
              </div>
            )}
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-semibold text-white truncate leading-tight">
                {currentTrack?.name || 'No Track Selected'}
              </h4>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                {currentTrack?.artists || 'Select a song to start'}
              </p>
            </div>
            {currentTrack?.trackViewUrl && (
              <a
                href={currentTrack.trackViewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-zinc-500 hover:text-white transition-colors flex-shrink-0 hidden sm:block"
                title="Open on Apple Music"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Center: Playback Controls (Prev, Play/Pause, Next) */}
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <button
              onClick={prev}
              className="p-2 text-zinc-400 hover:text-white hover:scale-110 active:scale-95 transition-all"
              title="Previous Track"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={togglePlay}
              className="w-11 h-11 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all duration-150"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-zinc-950" />
              ) : (
                <Play className="w-5 h-5 fill-zinc-950 ml-0.5" />
              )}
            </button>

            <button
              onClick={next}
              className="p-2 text-zinc-400 hover:text-white hover:scale-110 active:scale-95 transition-all"
              title="Next Track"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Right: Volume & Recommendations Drawer */}
          <div className="flex items-center justify-end gap-2.5 w-1/3">
            {/* Volume slider */}
            <div className="hidden sm:flex items-center gap-2">
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
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 h-1 accent-[#fa405e]"
              />
            </div>

            {/* Recommendations Drawer Button */}
            <button
              onClick={() => setRecommendationOpen(!isRecommendationOpen)}
              className={`p-2 rounded-xl text-xs flex items-center gap-1.5 transition-all ${
                isRecommendationOpen
                  ? 'bg-[#fa405e] text-white shadow-lg shadow-[#fa405e]/25'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
              title="Similar Songs"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden md:inline font-mono text-[11px]">
                {recommendations.length}
              </span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
