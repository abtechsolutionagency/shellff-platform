
"use client";

import { useState } from 'react';
import { Play, Pause, Heart, MoreHorizontal, Clock } from 'lucide-react';
import { Track, audioManager } from '@/lib/audio/AudioManager';
import Image from 'next/image';

interface TrackListProps {
  tracks: Track[];
  showAlbum?: boolean;
  showArtist?: boolean;
  showDuration?: boolean;
  showIndex?: boolean;
  onTrackSelect?: (track: Track, playlist: Track[]) => void;
}

export function TrackList({ 
  tracks, 
  showAlbum = true, 
  showArtist = true, 
  showDuration = true, 
  showIndex = true,
  onTrackSelect 
}: TrackListProps) {
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);
  const [currentPlayingTrack, setCurrentPlayingTrack] = useState<string | null>(null);
  const [playingStates, setPlayingStates] = useState<Record<string, boolean>>({});

  const handleTrackPlay = (track: Track, index: number) => {
    if (!audioManager) return;

    // Set up playlist starting from selected track
    audioManager.setPlaylist(tracks, index);
    audioManager.play(track);
    
    setCurrentPlayingTrack(track.id);
    setPlayingStates({ [track.id]: true });
    
    onTrackSelect?.(track, tracks);
  };

  const handleTrackPause = (track: Track) => {
    if (!audioManager) return;
    
    audioManager.pause();
    setPlayingStates({ ...playingStates, [track.id]: false });
  };

  const formatDuration = (duration: number): string => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  if (tracks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
          <Clock className="h-8 w-8 text-zinc-500" />
        </div>
        <p className="text-zinc-400" style={{ fontFamily: 'Inter, sans-serif' }}>
          No tracks available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-zinc-400 border-b border-zinc-800"
           style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="col-span-1 text-center">{showIndex ? "#" : ""}</div>
        <div className="col-span-5">TITLE</div>
        {showAlbum && <div className="col-span-3">ALBUM</div>}
        <div className="col-span-2">DATE ADDED</div>
        {showDuration && <div className="col-span-1 text-right">
          <Clock className="h-4 w-4 ml-auto" />
        </div>}
      </div>

      {/* Track List */}
      {tracks.map((track, index) => {
        const isHovered = hoveredTrack === track.id;
        const isCurrentPlaying = currentPlayingTrack === track.id;
        const isPlaying = playingStates[track.id] || false;

        return (
          <div
            key={track.id}
            className="grid grid-cols-12 gap-4 px-4 py-2 rounded-lg hover:bg-zinc-800/50 transition-all duration-200 group cursor-pointer"
            onMouseEnter={() => setHoveredTrack(track.id)}
            onMouseLeave={() => setHoveredTrack(null)}
            onClick={() => handleTrackPlay(track, index)}
          >
            {/* Index/Play Button */}
            <div className="col-span-1 flex items-center justify-center">
              {isHovered || isCurrentPlaying ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isPlaying) {
                      handleTrackPause(track);
                    } else {
                      handleTrackPlay(track, index);
                    }
                  }}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <Play className="h-3 w-3 ml-0.5" />
                  )}
                </button>
              ) : (
                <span className="text-sm text-zinc-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {showIndex ? index + 1 : ""}
                </span>
              )}
            </div>

            {/* Title and Artist */}
            <div className="col-span-5 flex items-center space-x-3">
              <div className="relative w-10 h-10 bg-zinc-800 rounded overflow-hidden flex-shrink-0">
                {track.coverArt ? (
                  <Image
                    src={track.coverArt}
                    alt={`${track.title} cover`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-teal-400">
                    <span className="text-white text-xs font-bold">
                      {track.title.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium truncate ${isCurrentPlaying ? 'text-purple-400' : 'text-white'}`}
                   style={{ fontFamily: 'Inter, sans-serif' }}>
                  {track.title}
                </p>
                {showArtist && (
                  <p className="text-xs text-zinc-400 truncate" 
                     style={{ fontFamily: 'Inter, sans-serif' }}>
                    {track.artist}
                  </p>
                )}
              </div>
            </div>

            {/* Album */}
            {showAlbum && (
              <div className="col-span-3 flex items-center">
                <p className="text-sm text-zinc-400 truncate" 
                   style={{ fontFamily: 'Inter, sans-serif' }}>
                  {track.album || 'Unknown Album'}
                </p>
              </div>
            )}

            {/* Date Added */}
            <div className="col-span-2 flex items-center">
              <p className="text-sm text-zinc-400" 
                 style={{ fontFamily: 'Inter, sans-serif' }}>
                {track.createdAt ? formatDate(track.createdAt) : 'Unknown'}
              </p>
            </div>

            {/* Duration and Actions */}
            {showDuration && (
              <div className="col-span-1 flex items-center justify-end space-x-2">
                <button 
                  className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-zinc-700 ${isCurrentPlaying ? 'text-purple-400' : 'text-zinc-400 hover:text-white'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Add to favorites functionality
                  }}
                >
                  <Heart className="h-4 w-4" />
                </button>
                
                <span className="text-sm text-zinc-400 w-10 text-right" 
                      style={{ fontFamily: 'Inter, sans-serif' }}>
                  {formatDuration(track.duration)}
                </span>
                
                <button 
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Show context menu
                  }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

