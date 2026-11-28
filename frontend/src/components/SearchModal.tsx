import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Play, Music, Flame, Heart, ListPlus } from 'lucide-react';
import { Track } from '../types';
import { usePlayerStore } from '../store/usePlayerStore';
import { SongArtwork } from './SongArtwork';
import { API_BASE_URL } from '../lib/config';

export const SearchModal: React.FC = () => {
  const { isSearchOpen, setSearchOpen, setTrack, addToQueue, toggleLike, likedTracks } = usePlayerStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      // Fetch default popular tracks
      handleSearch('');
    } else {
      setQuery('');
    }
  }, [isSearchOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setSearchOpen]);

  const handleSearch = async (searchTerm: string) => {
    setIsSearching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(searchTerm)}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.tracks || []);
      }
    } catch (e) {
      console.warn('Search query error:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    handleSearch(val);
  };

  const handleSelectTrack = (track: Track) => {
    setTrack(track, true);
    setSearchOpen(false);
  };

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-md select-none"
          onClick={() => setSearchOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl glass-panel rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col bg-[#0f0f14]"
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
              <Search className="w-5 h-5 text-[#fa405e]" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleInputChange}
                placeholder="Search tracks, artists, or keywords (e.g. Queen, Stay, Beatles)..."
                className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder:text-zinc-500 font-medium"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery('');
                    handleSearch('');
                  }}
                  className="p-1 rounded-full text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Results List */}
            <div className="max-h-96 overflow-y-auto p-2 space-y-1">
              {isSearching ? (
                <div className="py-8 text-center text-xs font-mono text-zinc-500">
                  Searching 157,000+ tracks...
                </div>
              ) : results.length === 0 ? (
                <div className="py-8 text-center text-xs font-mono text-zinc-500">
                  No matching tracks found.
                </div>
              ) : (
                results.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => handleSelectTrack(track)}
                    className="p-2.5 rounded-xl hover:bg-white/10 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800 relative">
                        <SongArtwork track={track} className="w-full h-full" showVinylEffect={false} />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-[#fa405e] transition-colors">
                          {track.name}
                        </h4>
                        <p className="text-[11px] text-zinc-400 truncate">
                          {track.artists} • {track.decade}s
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-2 flex-shrink-0 text-[10px] font-mono text-zinc-500"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="capitalize hidden sm:inline">{track.mood}</span>
                      <span className="flex items-center gap-1">
                        <Flame className="w-2.5 h-2.5 text-[#fa405e]" />
                        {track.popularity}%
                      </span>
                      <button
                        onClick={() => toggleLike(track)}
                        className={`p-1.5 rounded-lg hover:bg-white/10 ${
                          likedTracks.some((t) => t.id === track.id) ? 'text-[#fa405e]' : 'text-zinc-400 hover:text-white'
                        }`}
                        title="Like"
                      >
                        <Heart className={`w-3.5 h-3.5 ${likedTracks.some((t) => t.id === track.id) ? 'fill-[#fa405e]' : ''}`} />
                      </button>
                      <button
                        onClick={() => addToQueue(track)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
                        title="Add to Queue"
                      >
                        <ListPlus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2 bg-white/5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span>Press ESC to close</span>
              <span>157,685 Indexed Tracks</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
