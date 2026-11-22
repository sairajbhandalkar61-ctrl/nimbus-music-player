"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Search, Sparkles, Menu, X } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  onToggleMobileNav?: () => void;
}

export function Header({ onToggleMobileNav }: HeaderProps) {
  const router = useRouter();
  const [searchVal, setSearchVal] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-[#101014]/80 backdrop-blur-xl border-b border-white/5 px-6 flex items-center justify-between select-none">
      {/* History buttons & Mobile trigger */}
      <div className="flex items-center gap-3">
        {onToggleMobileNav && (
          <button
            onClick={onToggleMobileNav}
            className="md:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => router.forward()}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Go forward"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Search Input */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md mx-4">
        <div className="relative flex items-center group">
          <Search className="absolute left-3.5 w-4 h-4 text-zinc-500 group-focus-within:text-[#FA405E] transition-colors" />
          <input
            type="text"
            placeholder="Search songs, artists, albums, or moods..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full bg-[#1C1C24] hover:bg-[#22222C] focus:bg-[#252532] text-sm text-white placeholder-zinc-500 rounded-full pl-10 pr-4 py-2 border border-white/5 focus:border-[#FA405E]/40 outline-none transition-all shadow-inner"
          />
        </div>
      </form>

      {/* Right Stats / Link */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>56,637 AI MTG-Jamendo Tracks</span>
        </div>

        <Link
          href="/discover"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#FA405E] to-[#B86BE8] text-white text-xs font-semibold shadow-md shadow-[#FA405E]/20 hover:opacity-95 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">AI Studio</span>
        </Link>
      </div>
    </header>
  );
}
