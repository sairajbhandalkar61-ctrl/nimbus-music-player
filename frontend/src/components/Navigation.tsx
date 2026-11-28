import React, { useEffect } from 'react';
import { Search, Sliders, Activity, Info } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { ViewMode } from '../types';

export const Navigation: React.FC = () => {
  const {
    activeView,
    setActiveView,
    fontWeight,
    setSearchOpen,
    setAboutOpen,
    isEqOpen,
    setEqOpen,
    isAuraOpen,
    setAuraOpen,
    eqPreset,
    crossfadeSeconds,
  } = usePlayerStore();

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--font-weight',
      fontWeight === 'bold' ? '800' : '300'
    );
  }, [fontWeight]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const tag = (activeEl?.tagName || '').toUpperCase();
      const isTyping =
        tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || activeEl?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === '/' && !isTyping) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSearchOpen]);

  const tabs: Array<{ id: ViewMode; label: string; shortLabel: string }> = [
    { id: 'stage', label: 'Stage', shortLabel: 'Stage' },
    { id: 'mixer', label: 'Vibe Mixer', shortLabel: 'Mixer' },
    { id: 'library', label: 'Library', shortLabel: 'Library' },
  ];

  const eqActive = isEqOpen || eqPreset !== 'flat' || crossfadeSeconds > 0;

  return (
    <header className="fixed top-2.5 sm:top-3 left-0 right-0 z-40 px-2 sm:px-6 pointer-events-none">
      <div className="max-w-5xl mx-auto rounded-full bg-white/[0.06] backdrop-blur-xl border border-white/10 shadow-2xl px-2 sm:px-5 py-1.5 sm:py-2 flex items-center justify-between gap-1 sm:gap-2 pointer-events-auto overflow-hidden">
        {/* Left: Spaced N I M B U S Wordmark */}
        <button
          onClick={() => setActiveView('stage')}
          className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 group"
          title="Return to Center Stage"
        >
          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-gradient-to-tr from-[#fa405e] to-[#8b5cf6] shadow-[0_0_12px_rgba(250,64,94,0.8)] group-hover:scale-125 transition-transform hidden xs:inline-block sm:inline-block" />
          <span className="font-display text-[11px] sm:text-sm font-extrabold tracking-[0.08em] sm:tracking-[0.28em] text-white">
            NIMBUS
          </span>
        </button>

        {/* Center: View Switcher Tabs (Stage | Vibe Mixer | Library) */}
        <nav className="flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 rounded-full bg-black/35 border border-white/10 min-w-0">
          {tabs.map((tab) => {
            const isActive =
              activeView === tab.id || (tab.id === 'library' && activeView === 'gallery');
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`px-2 sm:px-4 py-1 rounded-full text-[11px] sm:text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-[#fa405e] to-[#8b5cf6] text-white font-semibold shadow-md shadow-[#fa405e]/20'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Search (/), EQ, Your Aura, About */}
        <div className="flex items-center gap-0.5 sm:gap-1.5 flex-shrink-0">
          <button
            onClick={() => setSearchOpen(true)}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs text-zinc-200 flex items-center gap-1.5 transition-colors"
            title="Search Tracks (/)"
          >
            <Search className="w-3.5 h-3.5 text-[#fa405e]" />
            <span className="hidden md:inline text-zinc-300">Search</span>
            <kbd className="hidden lg:inline text-[10px] bg-white/10 px-1.5 py-0.2 rounded text-zinc-400 font-mono">
              /
            </kbd>
          </button>

          <button
            onClick={() => setEqOpen(!isEqOpen)}
            className={`p-1.5 sm:px-3 sm:py-1.5 rounded-full border text-xs flex items-center gap-1.5 transition-colors ${
              eqActive
                ? 'bg-[#fa405e]/20 border-[#fa405e]/40 text-white'
                : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-zinc-300'
            }`}
            title="5-Band Equalizer & Crossfade"
          >
            <Sliders className="w-3.5 h-3.5 text-[#fa405e]" />
            <span className="hidden md:inline">EQ</span>
          </button>

          <button
            onClick={() => setAuraOpen(!isAuraOpen)}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-full border text-xs flex items-center gap-1.5 transition-colors ${
              isAuraOpen
                ? 'bg-[#8b5cf6]/25 border-[#8b5cf6]/50 text-white'
                : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-zinc-300'
            }`}
            title="Your Listening Aura Stats"
          >
            <Activity className="w-3.5 h-3.5 text-[#8b5cf6]" />
            <span className="hidden lg:inline">Aura</span>
          </button>

          <button
            onClick={() => setAboutOpen(true)}
            className="p-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-zinc-400 hover:text-white transition-colors hidden sm:flex"
            title="About Nimbus"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
