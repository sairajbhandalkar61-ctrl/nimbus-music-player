"use client";

import React, { useState } from "react";
import { X, Plus, Music2, Check } from "lucide-react";
import { useLibrary } from "@/context/LibraryContext";
import { Track } from "@/types/music";

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackToAdd?: Track | null;
}

export function PlaylistModal({ isOpen, onClose, trackToAdd }: PlaylistModalProps) {
  const { playlists, createPlaylist, addTrackToPlaylist } = useLibrary();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [addedIds, setAddedIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const newPl = createPlaylist(title, description);
    if (trackToAdd) {
      addTrackToPlaylist(newPl.id, trackToAdd);
    }
    setTitle("");
    setDescription("");
    onClose();
  };

  const handleAddToExisting = (playlistId: string) => {
    if (!trackToAdd) return;
    addTrackToPlaylist(playlistId, trackToAdd);
    setAddedIds((prev) => [...prev, playlistId]);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#1B1B22] border border-white/10 rounded-3xl p-6 shadow-2xl relative select-none">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {trackToAdd ? (
          <div>
            <h3 className="text-xl font-bold text-white font-heading mb-1">Add to Playlist</h3>
            <p className="text-xs text-zinc-400 mb-4 truncate">
              Adding: <span className="text-white font-semibold">{trackToAdd.title}</span> by {trackToAdd.artist}
            </p>

            {/* List existing playlists */}
            <div className="max-h-48 overflow-y-auto space-y-1.5 mb-6 pr-1">
              {playlists.map((pl) => {
                const isAdded = addedIds.includes(pl.id);
                return (
                  <button
                    key={pl.id}
                    onClick={() => handleAddToExisting(pl.id)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] transition-all border border-white/5 text-left group"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
                        <Music2 className="w-4 h-4 text-[#FA405E]" />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-semibold text-white truncate">{pl.title}</p>
                        <p className="text-[11px] text-zinc-500">{pl.tracks.length} tracks</p>
                      </div>
                    </div>
                    {isAdded ? (
                      <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                        <Check className="w-4 h-4" /> Added
                      </span>
                    ) : (
                      <Plus className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-white/10 pt-4">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Or Create New Playlist
              </h4>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <h3 className="text-xl font-bold text-white font-heading">New Playlist</h3>
            <p className="text-xs text-zinc-400 mt-1">Create your personalized collection of music.</p>
          </div>
        )}

        {/* Create Playlist Form */}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Playlist Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Midnight Vibes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#131317] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-[#FA405E] outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              placeholder="What's this playlist for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-[#131317] border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-zinc-600 focus:border-[#FA405E] outline-none transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#FA405E] to-[#B86BE8] text-white font-bold text-sm shadow-lg shadow-[#FA405E]/30 hover:opacity-95 transition-all mt-2"
          >
            Create Playlist
          </button>
        </form>
      </div>
    </div>
  );
}
