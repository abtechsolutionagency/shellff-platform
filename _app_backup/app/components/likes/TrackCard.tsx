

'use client';

import { useState, useEffect } from 'react';
import { Play, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { TrackDownloadButton } from '@/components/player/OfflineDownloadManager';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { TrackLikeWrapper } from './TrackLikeWrapper';
import { LikeButton } from './LikeButton';
import { cn } from '@/lib/utils';

interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  liked?: boolean;
}

interface TrackCardProps {
  track: Track;
  onPlay?: (track: Track) => void;
  showDownload?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TrackCard({
  track,
  onPlay,
  showDownload = false,
  size = 'md',
  className
}: TrackCardProps) {
  const [mounted, setMounted] = useState(false);
  const { playTrack } = useMusicPlayer();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Convert track to music player format
  const convertToPlayerTrack = (track: Track) => ({
    id: track.id,
    title: track.title,
    artist: track.artist,
    imageUrl: track.coverUrl,
    duration: 180, // Mock duration (3 minutes)
    audioUrl: `/api/tracks/${track.id}/stream`
  });

  const handlePlayTrack = () => {
    const playerTrack = convertToPlayerTrack(track);
    if (onPlay) {
      onPlay(track);
    } else {
      playTrack(playerTrack);
    }
  };

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <TrackLikeWrapper track={track}>
      {({ isLiked, isLoading, handleToggleLike }) => (
        <div className={cn('group cursor-pointer', className)}>
          <div className="relative bg-gray-800 rounded-2xl overflow-hidden mb-3 aspect-square">
            <Image
              src={track.coverUrl}
              alt={`${track.title} by ${track.artist}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 16vw"
            />
            
            {/* Control buttons overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={handlePlayTrack}
                  className="bg-white text-black hover:bg-gray-200 rounded-full w-10 h-10"
                >
                  <Play className="h-4 w-4 fill-current" />
                </Button>
                
                {showDownload && (
                  <TrackDownloadButton track={convertToPlayerTrack(track)} />
                )}
              </div>
            </div>

            {/* Like button in top-right corner */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <LikeButton
                trackId={track.id}
                isLiked={isLiked}
                isLoading={isLoading}
                onToggle={handleToggleLike}
                size="sm"
                variant="overlay"
              />
            </div>
          </div>
          
          <div className="px-1">
            <h3 className={cn(
              'font-semibold text-white mb-1 truncate font-poppins',
              sizeClasses[size]
            )}>
              {track.title}
            </h3>
            <p className={cn(
              'text-gray-400 truncate font-inter',
              size === 'sm' ? 'text-xs' : 'text-xs'
            )}>
              {track.artist}
            </p>
          </div>
        </div>
      )}
    </TrackLikeWrapper>
  );
}

