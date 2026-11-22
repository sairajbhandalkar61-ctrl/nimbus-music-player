import React, { useEffect } from 'react';
import { Search, Info, Radio, Sparkles } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';

export const Navigation: React.FC = () => {
  const {
    activeView,
    setActiveView,
    fontWeight,
    toggleFontWeight,
    setSearchOpen,
    setAboutOpen,
    isRecommendationOpen,
    setRecommendationOpen,
    recommendations,
  } = usePlayerStore();

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--font-weight',
      fontWeight === 'bold' ? '800' : '300'
    );
  }, [fontWeight]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSearchOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between bg-[#08080a]/85 backdrop-blur-xl border-b border-white/5 transition-all">
      {/* Left: Brand Logo & Wordmark */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveView('main')}
          className="flex items-center gap-2.5 text-left group"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#fa405e] via-[#b86be8] to-[#06b6d4] flex items-center justify-center shadow-lg shadow-[#fa405e]/25 group-hover:scale-105 transition-transform">
            <Radio className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-display text-base sm:text-lg tracking-wider font-extrabold text-white leading-none">
              NIMBUS
            </h1>
            <span className="text-[10px] tracking-widest text-zinc-400 uppercase font-mono">
              FLUID PLAYER
            </span>
          </div>
        </button>
      </div>

      {/* Center: Minimal Navigation (Main, Gallery, About) */}
      <nav className="flex items-center gap-1 p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
        <button
          onClick={() => setActiveView('main')}
          className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all ${
            activeView === 'main'
              ? 'bg-white text-zinc-950 shadow-md font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Player
        </button>

        <button
          onClick={() => setActiveView('gallery')}
          className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all ${
            activeView === 'gallery'
              ? 'bg-white text-zinc-950 shadow-md font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Discovery Gallery
        </button>

        <button
          onClick={() => setAboutOpen(true)}
          className="px-3 py-1.5 rounded-full text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1.5"
        >
          <Info className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">About</span>
        </button>
      </nav>

      {/* Right: Controls & Font Weight Morph Toggle */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Instant Search Button */}
        <button
          onClick={() => setSearchOpen(true)}
          className="glass-pill px-3 py-1.5 rounded-full text-xs text-zinc-300 flex items-center gap-2 hover:border-zinc-400 transition-colors"
          title="Search track or artist (⌘K)"
        >
          <Search className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden md:inline text-zinc-400">Search</span>
          <kbd className="hidden lg:inline text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-zinc-400 font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Font-weight Toggle ("REGULAR / BOLD") */}
        <button
          onClick={toggleFontWeight}
          className="glass-pill px-3 py-1.5 rounded-full text-xs font-mono tracking-wider text-zinc-300 hover:text-white transition-all flex items-center gap-1.5"
          title="Toggle Typography Weight"
        >
          <span className={fontWeight === 'regular' ? 'text-[#fa405e] font-semibold' : 'text-zinc-500'}>
            REG
          </span>
          <span className="text-zinc-600">/</span>
          <span className={fontWeight === 'bold' ? 'text-[#fa405e] font-bold' : 'text-zinc-500'}>
            BOLD
          </span>
        </button>

        {/* Similar Tracks Drawer Toggle */}
        <button
          onClick={() => setRecommendationOpen(!isRecommendationOpen)}
          className={`glass-pill px-3 py-1.5 rounded-full text-xs text-zinc-300 flex items-center gap-1.5 relative ${
            isRecommendationOpen ? 'bg-white/20 border-white/40' : ''
          }`}
          title="Toggle Recommendations"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#fa405e]" />
          <span className="hidden sm:inline">Similar</span>
          {recommendations.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#fa405e] text-white text-[10px] font-bold flex items-center justify-center">
              {recommendations.length}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
