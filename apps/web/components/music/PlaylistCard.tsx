
"use client";

import { useState } from 'react';
import { Play, Pause, Heart, MoreHorizontal, Music } from 'lucide-react';
import { Playlist, audioManager } from '@/lib/audio/AudioManager';
import Image from 'next/image';

interface PlaylistCardProps {
  playlist: Playlist;
  onPlaylistClick?: (playlist: Playlist) => void;
  onPlayClick?: (playlist: Playlist) => void;
  size?: 'small' | 'medium' | 'large';
}

export function PlaylistCard({ 
  playlist, 
  onPlaylistClick, 
  onPlayClick,
  size = 'medium' 
}: PlaylistCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!audioManager || playlist.tracks.length === 0) return;

    if (isPlaying) {
      audioManager.pause();
      setIsPlaying(false);
    } else {
      audioManager.setPlaylist(playlist.tracks, 0);
      audioManager.play(playlist.tracks[0]);
      setIsPlaying(true);
      onPlayClick?.(playlist);
    }
  };

  const cardSizes = {
    small: 'w-40',
    medium: 'w-48',
    large: 'w-56'
  };

  const imageSizes = {
    small: 'h-40',
    medium: 'h-48', 
    large: 'h-56'
  };

  const formatTrackCount = (count: number): string => {
    return `${count} ${count === 1 ? 'track' : 'tracks'}`;
  };

  return (
    <div
      className={`${cardSizes[size]} bg-zinc-900 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:bg-zinc-800 group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onPlaylistClick?.(playlist)}
    >
      {/* Cover Art */}
      <div className={`relative ${imageSizes[size]} bg-zinc-800 rounded-lg overflow-hidden mb-4 group-hover:shadow-lg transition-shadow`}>
        {playlist.coverArt ? (
          <Image
            src={playlist.coverArt}
            alt={`${playlist.name} cover`}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-teal-400">
            <Music className="h-12 w-12 text-white" />
          </div>
        )}
        
        {/* Play Button Overlay */}
        <div className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <button
            onClick={handlePlayClick}
            className="w-12 h-12 rounded-full flex items-center justify-center text-white transition-all duration-300 transform active:scale-95"
            style={{ 
              backgroundColor: '#9B5DE5'
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.backgroundColor = '#00F5D4';
              target.style.transform = 'scale(1.1)';
              target.style.boxShadow = '0 10px 25px rgba(0, 245, 212, 0.25)';
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.backgroundColor = '#9B5DE5';
              target.style.transform = 'scale(1)';
              target.style.boxShadow = 'none';
            }}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Playlist Info */}
      <div className="space-y-2">
        <h3 className="font-semibold text-white truncate" 
            style={{ fontFamily: 'Poppins, sans-serif' }}>
          {playlist.name}
        </h3>
        
        {playlist.description && (
          <p className="text-sm text-zinc-400 line-clamp-2" 
             style={{ fontFamily: 'Inter, sans-serif' }}>
            {playlist.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500" 
             style={{ fontFamily: 'Inter, sans-serif' }}>
            {formatTrackCount(playlist.tracks.length)}
          </p>
          
          <div className={`flex items-center space-x-1 transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <button 
              className="p-1 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Add to favorites functionality
              }}
            >
              <Heart className="h-4 w-4" />
            </button>
            
            <button 
              className="p-1 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Show context menu
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
