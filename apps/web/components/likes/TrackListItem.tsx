

'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { TrackLikeWrapper } from './TrackLikeWrapper';
import { InlineLikeButton } from './InlineLikeButton';
import { cn } from '@/lib/utils';

interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  coverUrl?: string;
  liked?: boolean;
}

interface TrackListItemProps {
  track: Track;
  index?: number;
  onPlay?: (track: Track) => void;
  showAlbum?: boolean;
  showDuration?: boolean;
  showIndex?: boolean;
  className?: string;
}

export function TrackListItem({
  track,
  index,
  onPlay,
  showAlbum = true,
  showDuration = true,
  showIndex = true,
  className
}: TrackListItemProps) {
  const [mounted, setMounted] = useState(false);
  const { currentTrack, isPlaying, playTrack } = useMusicPlayer();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isCurrentTrack = currentTrack?.id === track.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  // Convert track to music player format
  const convertToPlayerTrack = (track: Track) => ({
    id: track.id,
    title: track.title,
    artist: track.artist,
    albumTitle: track.album,
    imageUrl: track.coverUrl,
    duration: track.duration || 180,
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

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TrackLikeWrapper track={track}>
      {({ isLiked, isLoading, handleToggleLike }) => (
        <div className={cn(
          'group flex items-center p-2 rounded-lg hover:bg-gray-800/50 transition-colors',
          isCurrentTrack && 'bg-gray-800/70',
          className
        )}>
          {/* Index/Play Button */}
          <div className="w-8 flex items-center justify-center">
            {showIndex && !isCurrentlyPlaying && (
              <span className="text-gray-400 text-sm group-hover:hidden">
                {index !== undefined ? index + 1 : ''}
              </span>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handlePlayTrack}
              className={cn(
                'w-8 h-8 p-0 opacity-0 group-hover:opacity-100 rounded-full',
                isCurrentlyPlaying && 'opacity-100'
              )}
            >
              {isCurrentlyPlaying ? (
                <Pause className="h-3 w-3 fill-current" />
              ) : (
                <Play className="h-3 w-3 fill-current" />
              )}
            </Button>
          </div>

          {/* Track Info */}
          <div className="flex items-center min-w-0 flex-1 mx-3">
            {/* Cover Art */}
            {track.coverUrl && (
              <div className="w-10 h-10 relative rounded overflow-hidden flex-shrink-0 mr-3">
                <Image
                  src={track.coverUrl}
                  alt={`${track.title} cover`}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>
            )}

            {/* Title and Artist */}
            <div className="min-w-0 flex-1">
              <div className={cn(
                'font-medium text-sm truncate',
                isCurrentTrack ? 'text-teal-400' : 'text-white'
              )}>
                {track.title}
              </div>
              <div className="text-gray-400 text-xs truncate">
                {track.artist}
              </div>
            </div>
          </div>

          {/* Album */}
          {showAlbum && (
            <div className="hidden md:block min-w-0 flex-1 mx-3">
              <div className="text-gray-400 text-sm truncate">
                {track.album || '--'}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Like Button */}
            <InlineLikeButton
              trackId={track.id}
              trackTitle={track.title}
              isLiked={isLiked}
              isLoading={isLoading}
              onToggle={handleToggleLike}
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            />

            {/* Duration */}
            {showDuration && (
              <div className="text-gray-400 text-sm w-12 text-right">
                {formatDuration(track.duration)}
              </div>
            )}

            {/* More Options */}
            <Button
              size="sm"
              variant="ghost"
              className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </TrackLikeWrapper>
  );
}

