import React, { useEffect } from 'react';
import { usePlayerStore } from './store/usePlayerStore';
import { Loader } from './components/Loader';
import { Navigation } from './components/Navigation';
import { FluidShader } from './components/FluidShader';
import { DiscPlayer } from './components/DiscPlayer';
import { KineticTitle } from './components/KineticTitle';
import { PlayerBar } from './components/PlayerBar';
import { GalleryView } from './components/GalleryView';
import { RecommendationDrawer } from './components/RecommendationDrawer';
import { SearchModal } from './components/SearchModal';
import { AboutModal } from './components/AboutModal';

export const App: React.FC = () => {
  const { currentTrack, setTrack, activeView } = usePlayerStore();

  // Load initial popular track if none selected
  useEffect(() => {
    if (!currentTrack) {
      fetch('/api/search?q=queen&limit=1')
        .then((res) => res.json())
        .then((data) => {
          if (data.tracks && data.tracks.length > 0) {
            // Load track without autoplay until user interacts
            setTrack(data.tracks[0], false);
          }
        })
        .catch(console.warn);
    }
  }, [currentTrack, setTrack]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#08080a] text-zinc-100 flex flex-col">
      {/* 1. Full-screen WebGL Fluid Aurora Shader Background */}
      <FluidShader />

      {/* 2. Top Minimal Navigation Bar */}
      <Navigation />

      {/* 3. Main Views (Main Player vs Gallery) */}
      <main className="flex-1 relative overflow-hidden flex flex-col justify-center items-center">
        {activeView === 'main' ? (
          <div className="flex flex-col items-center justify-center w-full max-w-4xl px-4 py-8 z-10 animate-fade-in">
            {/* Vinyl Disc with Radial Audio Reactive Bars */}
            <DiscPlayer />

            {/* Kinetic Letter-by-Letter Song & Artist Title */}
            <KineticTitle />
          </div>
        ) : (
          <GalleryView />
        )}
      </main>

      {/* 4. Bottom Glass Player Bar */}
      <PlayerBar />

      {/* 5. Modals & Drawers */}
      <RecommendationDrawer />
      <SearchModal />
      <AboutModal />

      {/* 6. Initial Orchestrated "N I M B U S" Loader & Audio Unlock */}
      <Loader />
    </div>
  );
};

export default App;
