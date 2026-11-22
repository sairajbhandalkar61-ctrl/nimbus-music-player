"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PlayCircle,
  Compass,
  Sparkles,
  Search,
  Library,
  Heart,
  ListMusic,
  BarChart3,
  PlusCircle,
  Disc3,
  Radio,
  ChevronLeft,
  ChevronRight,
  Music2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLibrary } from "@/context/LibraryContext";

interface SidebarProps {
  onCreatePlaylist: () => void;
}

export function Sidebar({ onCreatePlaylist }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { playlists } = useLibrary();

  const mainNav = [
    { label: "Listen Now", href: "/", icon: PlayCircle },
    { label: "Browse", href: "/browse", icon: Compass },
    { label: "AI Discovery", href: "/discover", icon: Sparkles, badge: "AI" },
    { label: "Search", href: "/search", icon: Search },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
  ];

  const libraryNav = [
    { label: "Library", href: "/library", icon: Library },
    { label: "Favorites", href: "/library?tab=favorites", icon: Heart },
    { label: "Playlists", href: "/library?tab=playlists", icon: ListMusic },
  ];

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0 bg-[#17171C]/90 backdrop-blur-xl border-r border-white/5 transition-all duration-300 z-40 select-none",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FA405E] to-[#B86BE8] p-[2px] shadow-lg shadow-[#FA405E]/20 transition-transform group-hover:scale-105">
            <div className="w-full h-full bg-[#17171C] rounded-[10px] flex items-center justify-center">
              <Disc3 className="w-5 h-5 text-[#FA405E] animate-spin-slow" />
            </div>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-heading font-black tracking-wider text-lg bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
                SOUND<span className="text-[#FA405E]">WAVE</span>
              </span>
              <span className="text-[10px] tracking-widest text-[#A1A1AA] uppercase font-mono">
                Apple Music Hi-Fi
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        {/* Main Section */}
        <div>
          {!collapsed && (
            <h3 className="px-3 text-[11px] font-semibold text-zinc-500 tracking-wider uppercase mb-2">
              Discover
            </h3>
          )}
          <nav className="space-y-1">
            {mainNav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative",
                    active
                      ? "bg-[#FA405E] text-white shadow-lg shadow-[#FA405E]/25"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  )}
                  title={item.label}
                >
                  <Icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", active ? "text-white" : "text-zinc-400 group-hover:text-white")} />
                  {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                  {!collapsed && item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#FA405E] to-[#B86BE8] text-white font-bold tracking-wide">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Library Section */}
        <div>
          {!collapsed && (
            <div className="flex items-center justify-between px-3 mb-2">
              <h3 className="text-[11px] font-semibold text-zinc-500 tracking-wider uppercase">
                My Library
              </h3>
              <button
                onClick={onCreatePlaylist}
                className="text-zinc-400 hover:text-[#FA405E] transition-colors"
                title="Create Playlist"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
            </div>
          )}
          <nav className="space-y-1">
            {libraryNav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                    active
                      ? "bg-[#FA405E] text-white shadow-lg shadow-[#FA405E]/25"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  )}
                  title={item.label}
                >
                  <Icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", active ? "text-white" : "text-zinc-400 group-hover:text-white")} />
                  {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Playlists */}
        {!collapsed && playlists.length > 0 && (
          <div>
            <h3 className="px-3 text-[11px] font-semibold text-zinc-500 tracking-wider uppercase mb-2">
              Playlists
            </h3>
            <div className="space-y-1">
              {playlists.map((pl) => (
                <Link
                  key={pl.id}
                  href={`/playlist/${pl.id}`}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors truncate group"
                >
                  <Music2 className="w-4 h-4 text-zinc-500 group-hover:text-[#FA405E] shrink-0" />
                  <span className="truncate">{pl.title}</span>
                  <span className="text-[11px] text-zinc-600 ml-auto shrink-0">
                    {pl.tracks.length}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Status Footer */}
      <div className="p-4 border-t border-white/5">
        {!collapsed ? (
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors border border-white/5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FA405E] to-[#B86BE8] flex items-center justify-center font-bold text-sm text-white shadow-md">
              SW
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-semibold text-white truncate">Premium Listener</span>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Lossless Hi-Fi
              </span>
            </div>
          </div>
        ) : (
          <div className="w-9 h-9 mx-auto rounded-full bg-gradient-to-tr from-[#FA405E] to-[#B86BE8] flex items-center justify-center font-bold text-sm text-white">
            SW
          </div>
        )}
      </div>
    </aside>
  );
}
