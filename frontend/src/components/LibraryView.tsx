import React, { useRef, useState } from 'react';
import {
  Heart,
  ListPlus,
  History,
  FolderOpen,
  Compass,
  Plus,
  Trash2,
  Edit3,
  Check,
  Download,
  Upload,
  Play,
  ArrowLeft,
  Music2,
  X,
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { SongArtwork } from './SongArtwork';
import { GalleryView } from './GalleryView';
import { Track } from '../types';

type LibraryTab = 'liked' | 'playlists' | 'history' | 'local' | 'catalog';

export const LibraryView: React.FC = () => {
  const {
    likedTracks,
    playlists,
    playHistory,
    localTracks,
    toggleLike,
    setTrack,
    addToQueue,
    addMultipleToQueue,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    importLocalFiles,
    exportLibrary,
    importLibrary,
    currentTrack,
  } = usePlayerStore();

  const [tab, setTab] = useState<LibraryTab>('liked');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [playlistPickerTrack, setPlaylistPickerTrack] = useState<Track | null>(null);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const flashStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleLocalFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const imported = await importLocalFiles(files);
    if (imported.length > 0) {
      flashStatus(`Imported ${imported.length} audio file${imported.length > 1 ? 's' : ''}`);
      setTab('local');
    } else {
      flashStatus('No supported audio files found (MP3, WAV, FLAC, M4A)');
    }
  };

  const handleExport = () => {
    const json = exportLibrary();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nimbus-library-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flashStatus('Library JSON exported');
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const ok = importLibrary(text);
    flashStatus(ok ? 'Library backup restored!' : 'Invalid JSON backup file');
    e.target.value = '';
  };

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId) || null;

  const renderTrackRow = (track: Track, idx: number, extraRight?: React.ReactNode) => (
    <div
      key={`${track.id}-${idx}`}
      onClick={() => void setTrack(track, true, true)}
      className="group p-3 rounded-2xl song-card flex items-center justify-between gap-3 cursor-pointer"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 relative">
          <SongArtwork track={track} className="w-full h-full" showVinylEffect={false} />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-4 h-4 fill-white text-white ml-0.5" />
          </div>
        </div>
        <div className="min-w-0">
          <h5 className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-[#fa405e] transition-colors">
            {track.name}
          </h5>
          <p className="text-[11px] text-zinc-400 truncate">
            {track.artists} {track.isLocal ? '• Local Audio' : `• ${Math.round(track.tempo)} BPM`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => {
            addToQueue(track);
            flashStatus(`Added "${track.name}" to Queue`);
          }}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
          title="Add to Queue"
        >
          <ListPlus className="w-4 h-4" />
        </button>
        {playlists.length > 0 && (
          <button
            onClick={() => setPlaylistPickerTrack(track)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-[#8b5cf6] hover:bg-white/10"
            title="Add to Playlist"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
        {extraRight}
      </div>
    </div>
  );

  if (tab === 'catalog') {
    return <GalleryView onBackToLibrary={() => setTab('liked')} />;
  }

  return (
    <div
      className="w-full h-screen overflow-y-auto pt-20 pb-36 px-3 sm:px-8 select-none overscroll-contain"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Top Library Glass Card */}
        <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Your Library
              </h2>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">
                {likedTracks.length} liked • {playlists.length} playlists • {localTracks.length} local files
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                className="px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs text-zinc-200 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-[#8b5cf6]" />
                <span>Export</span>
              </button>
              <button
                onClick={() => jsonInputRef.current?.click()}
                className="px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs text-zinc-200 flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-[#fa405e]" />
                <span>Import</span>
              </button>
              <input
                ref={jsonInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportJson}
                className="hidden"
              />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'liked' as const, label: 'Liked Songs', icon: Heart },
              { id: 'playlists' as const, label: 'Playlists', icon: ListPlus },
              { id: 'history' as const, label: 'Recently Played', icon: History },
              { id: 'local' as const, label: 'Local Files', icon: FolderOpen },
              { id: 'catalog' as const, label: 'Explore 157k Catalog', icon: Compass },
            ].map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setTab(item.id);
                    setSelectedPlaylistId(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
                    active
                      ? 'bg-gradient-to-r from-[#fa405e] to-[#8b5cf6] text-white font-semibold shadow-lg shadow-[#fa405e]/20'
                      : 'bg-white/[0.05] text-zinc-300 hover:text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {statusMsg && (
            <div className="px-3 py-2 rounded-xl bg-[#fa405e]/20 border border-[#fa405e]/40 text-xs font-mono text-white">
              {statusMsg}
            </div>
          )}

          {playlistPickerTrack && (
            <div className="p-3 rounded-2xl bg-black/40 border border-[#8b5cf6]/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-200 font-medium truncate">
                  Add "{playlistPickerTrack.name}" to playlist:
                </span>
                <button onClick={() => setPlaylistPickerTrack(null)} className="text-zinc-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {playlists.map((pl) => (
                  <button
                    key={pl.id}
                    onClick={() => {
                      addTrackToPlaylist(pl.id, playlistPickerTrack);
                      flashStatus(`Added to "${pl.name}"`);
                      setPlaylistPickerTrack(null);
                    }}
                    className="px-3 py-1 rounded-full bg-white/10 hover:bg-[#8b5cf6] text-xs text-white transition-colors"
                  >
                    + {pl.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tab Body */}
        {tab === 'liked' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {likedTracks.length === 0 ? (
              <div className="md:col-span-2 py-16 text-center glass-panel rounded-3xl text-xs font-mono text-zinc-400">
                Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white">L</kbd> or tap ♥ on any track to save it here.
              </div>
            ) : (
              likedTracks.map((t, i) =>
                renderTrackRow(
                  t,
                  i,
                  <button
                    onClick={() => toggleLike(t)}
                    className="p-1.5 rounded-lg text-[#fa405e] hover:bg-white/10"
                    title="Unlike"
                  >
                    <Heart className="w-4 h-4 fill-[#fa405e]" />
                  </button>
                )
              )
            )}
          </div>
        )}

        {tab === 'playlists' && (
          <div className="space-y-4">
            {selectedPlaylist ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSelectedPlaylistId(null)}
                    className="px-3 py-1.5 rounded-full glass-pill text-xs text-zinc-200 flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    All Playlists
                  </button>
                  {selectedPlaylist.tracks.length > 0 && (
                    <button
                      onClick={() => {
                        void setTrack(selectedPlaylist.tracks[0], true, true);
                        if (selectedPlaylist.tracks.length > 1) {
                          addMultipleToQueue(selectedPlaylist.tracks.slice(1));
                        }
                      }}
                      className="px-4 py-1.5 rounded-full bg-white text-zinc-950 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-zinc-950" />
                      Play All
                    </button>
                  )}
                </div>

                <h3 className="font-display text-xl font-bold text-white">
                  {selectedPlaylist.name} ({selectedPlaylist.tracks.length})
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {selectedPlaylist.tracks.length === 0 ? (
                    <div className="md:col-span-2 py-12 text-center glass-panel rounded-3xl text-xs text-zinc-400 font-mono">
                      Empty playlist. Use + on any song in Liked, Recent, or Local Files.
                    </div>
                  ) : (
                    selectedPlaylist.tracks.map((t, i) =>
                      renderTrackRow(
                        t,
                        i,
                        <button
                          onClick={() => removeTrackFromPlaylist(selectedPlaylist.id, t.id)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )
                    )
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newPlaylistName.trim()) return;
                    createPlaylist(newPlaylistName, currentTrack || undefined);
                    setNewPlaylistName('');
                    flashStatus('Playlist created');
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="Create a new playlist..."
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/10 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-[#fa405e]"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#fa405e] to-[#8b5cf6] text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Create
                  </button>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {playlists.map((pl) => (
                    <div
                      key={pl.id}
                      onClick={() => {
                        if (editingPlaylistId !== pl.id) setSelectedPlaylistId(pl.id);
                      }}
                      className="p-4 rounded-2xl song-card flex items-center justify-between gap-2 cursor-pointer"
                    >
                      {editingPlaylistId === pl.id ? (
                        <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-white/20 text-xs text-white outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              renamePlaylist(pl.id, editingName);
                              setEditingPlaylistId(null);
                            }}
                            className="p-1.5 rounded-xl bg-white text-zinc-950"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-white truncate">{pl.name}</h4>
                            <p className="text-[11px] text-zinc-400 font-mono">
                              {pl.tracks.length} {pl.tracks.length === 1 ? 'track' : 'tracks'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setEditingPlaylistId(pl.id);
                                setEditingName(pl.name);
                              }}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deletePlaylist(pl.id)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'history' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {playHistory.length === 0 ? (
              <div className="md:col-span-2 py-16 text-center glass-panel rounded-3xl text-xs font-mono text-zinc-400">
                Your recently played tracks will appear here.
              </div>
            ) : (
              playHistory.slice(0, 60).map((item, i) =>
                renderTrackRow(
                  item.track,
                  i,
                  <span className="text-[10px] font-mono text-zinc-500 px-1.5">
                    {new Date(item.playedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )
              )
            )}
          </div>
        )}

        {tab === 'local' && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingFiles(true);
              }}
              onDragLeave={() => setIsDraggingFiles(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingFiles(false);
                void handleLocalFileUpload(e.dataTransfer.files);
              }}
              onClick={() => audioInputRef.current?.click()}
              className={`p-8 rounded-3xl border-2 border-dashed transition-all cursor-pointer text-center ${
                isDraggingFiles
                  ? 'border-[#fa405e] bg-[#fa405e]/15'
                  : 'border-white/15 bg-white/[0.04] hover:border-white/30'
              }`}
            >
              <Music2 className="w-9 h-9 text-[#fa405e] mx-auto mb-2.5" />
              <p className="text-sm font-semibold text-white">
                Click to select or drag-and-drop local audio files
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Supports MP3, WAV, FLAC, M4A • Full Web Audio EQ & Aurora Visualizer
              </p>
              <input
                ref={audioInputRef}
                type="file"
                multiple
                accept=".mp3,.wav,.flac,.m4a,.ogg,.aac,audio/*"
                onChange={(e) => {
                  void handleLocalFileUpload(e.target.files);
                  e.target.value = '';
                }}
                className="hidden"
              />
            </div>

            {localTracks.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {localTracks.map((t, i) => renderTrackRow(t, i))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
