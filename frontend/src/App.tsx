import React, { useEffect } from 'react';
import { usePlayerStore } from './store/usePlayerStore';
import { Loader } from './components/Loader';
import { Navigation } from './components/Navigation';
import { FluidShader } from './components/FluidShader';
import { DiscPlayer } from './components/DiscPlayer';
import { KineticTitle } from './components/KineticTitle';
import { PlayerBar } from './components/PlayerBar';
import { GalleryView } from './components/GalleryView';
import { VibeMixerView } from './components/VibeMixerView';
import { LibraryView } from './components/LibraryView';
import { RightDrawer } from './components/RightDrawer';
import { SearchModal } from './components/SearchModal';
import { EqualizerModal } from './components/EqualizerModal';
import { LyricsOverlay } from './components/LyricsOverlay';
import { AuraModal } from './components/AuraModal';
import { AboutModal } from './components/AboutModal';

export const App: React.FC = () => {
  const {
    currentTrack,
    setTrack,
    activeView,
    isRightDrawerOpen,
    importLocalFiles,
    addMultipleToQueue,
  } = usePlayerStore();

  // Load initial popular track if none selected
  useEffect(() => {
    if (!currentTrack) {
      fetch('/api/search?q=queen&limit=1')
        .then((res) => res.json())
        .then((data) => {
          if (data.tracks && data.tracks.length > 0) {
            void setTrack(data.tracks[0], false);
          }
        })
        .catch(console.warn);
    }
  }, [currentTrack, setTrack]);

  // Global drag-and-drop support for local audio files
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    const hasAudio = Array.from(e.dataTransfer.files).some(
      (f) => /\.(mp3|wav|flac|m4a|ogg|aac)$/i.test(f.name) || f.type.startsWith('audio/')
    );
    if (!hasAudio) return;

    e.preventDefault();
    const imported = await importLocalFiles(e.dataTransfer.files);
    if (imported.length > 0) {
      await setTrack(imported[0], true, true);
      if (imported.length > 1) {
        addMultipleToQueue(imported.slice(1));
      }
    }
  };

  return (
    <div
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault();
        }
      }}
      onDrop={(e) => void handleDrop(e)}
      className="relative w-screen h-screen overflow-hidden bg-[#08080a] text-zinc-100 flex flex-col"
    >
      {/* 1. Living WebGL Fluid Aurora Background */}
      <FluidShader />

      {/* 2. Top Floating Pill Navbar */}
      <Navigation />

      {/* 3. Main Views (Stage | Vibe Mixer | Library | Gallery) */}
      <main
        className={`flex-1 relative overflow-hidden flex flex-col justify-center items-center transition-all duration-300 ${
          activeView === 'stage' && isRightDrawerOpen ? 'xl:pr-[440px]' : ''
        }`}
      >
        {activeView === 'stage' ? (
          <div className="flex flex-col items-center justify-center w-full max-w-4xl px-4 pt-12 pb-24 z-10">
            <DiscPlayer />
            <KineticTitle />
          </div>
        ) : activeView === 'mixer' ? (
          <VibeMixerView />
        ) : activeView === 'library' ? (
          <LibraryView />
        ) : (
          <GalleryView />
        )}
      </main>

      {/* 4. Bottom Floating Glass Player Dock */}
      <PlayerBar />

      {/* 5. Right Frosted-Glass Slide-Over Drawer (AI Match + Up Next) */}
      <RightDrawer />

      {/* 6. Full-screen Glowing Synced Lyrics Overlay */}
      <LyricsOverlay />

      {/* 7. Modals */}
      <SearchModal />
      <EqualizerModal />
      <AuraModal />
      <AboutModal />

      {/* 8. Initial Orchestrated "N I M B U S" Loader & Audio Unlock */}
      <Loader />
    </div>
  );
};

export default App;
