"use client";

import React, { useState } from "react";
import "./globals.css";
import { PlayerProvider } from "@/context/PlayerContext";
import { LibraryProvider } from "@/context/LibraryContext";
import { Sidebar } from "@/components/Sidebar";
import { Player } from "@/components/Player";
import { Header } from "@/components/Header";
import { NowPlayingModal } from "@/components/NowPlayingModal";
import { PlaylistModal } from "@/components/PlaylistModal";
import { Track } from "@/types/music";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [trackForPlaylist, setTrackForPlaylist] = useState<Track | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleOpenPlaylistModal = (track?: Track) => {
    setTrackForPlaylist(track || null);
    setPlaylistModalOpen(true);
  };

  return (
    <html lang="en" className="dark">
      <head>
        <title>SOUNDWAVE — Premium Music Streaming & AI Discovery</title>
        <meta
          name="description"
          content="Apple Music-inspired hi-fi streaming platform powered by MTG-Jamendo and AI recommendation algorithms."
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Manrope:wght@200..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#101014] text-white antialiased min-h-screen flex flex-col selection:bg-[#FA405E] selection:text-white">
        <PlayerProvider>
          <LibraryProvider>
            <div className="flex h-screen overflow-hidden">
              {/* Sidebar */}
              <Sidebar onCreatePlaylist={() => handleOpenPlaylistModal()} />

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <Header onToggleMobileNav={() => setMobileNavOpen(!mobileNavOpen)} />

                <main className="flex-1 overflow-y-auto pb-32 focus:outline-none">
                  {children}
                </main>
              </div>
            </div>

            {/* Persistent Player */}
            <Player />

            {/* Fullscreen Now Playing Overlay */}
            <NowPlayingModal />

            {/* Global Playlist Creation Modal */}
            <PlaylistModal
              isOpen={playlistModalOpen}
              onClose={() => {
                setPlaylistModalOpen(false);
                setTrackForPlaylist(null);
              }}
              trackToAdd={trackForPlaylist}
            />
          </LibraryProvider>
        </PlayerProvider>
      </body>
    </html>
  );
}
