"use client";

import React, { useEffect } from "react";
import { usePlayer } from "@/context/PlayerContext";
import { NowPlayingModal } from "@/components/NowPlayingModal";
import Link from "next/link";
import { Disc3 } from "lucide-react";

export default function NowPlayingPage() {
  const { currentTrack, setIsExpanded } = usePlayer();

  useEffect(() => {
    if (currentTrack) {
      setIsExpanded(true);
    }
  }, [currentTrack, setIsExpanded]);

  if (!currentTrack) {
    return (
      <div className="py-32 text-center text-zinc-500 max-w-md mx-auto p-6 space-y-4">
        <Disc3 className="w-16 h-16 text-zinc-600 mx-auto" />
        <h2 className="text-2xl font-bold text-white">No Track Playing</h2>
        <p className="text-sm text-zinc-400">
          Pick any song from Listen Now, Browse, or Search to start listening.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-full bg-[#FA405E] text-white text-xs font-bold shadow-lg shadow-[#FA405E]/30"
        >
          Explore Music
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <NowPlayingModal />
    </div>
  );
}
