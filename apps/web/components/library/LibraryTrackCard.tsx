
'use client';

import { useState } from 'react';
import { LibraryTrack, usePersonalLibrary } from '@/contexts/PersonalLibraryContext';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { Play, Pause, Heart, MoreHorizontal, Clock, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';

interface LibraryTrackCardProps {
  track: LibraryTrack;
  index?: number;
  showAlbum?: boolean;
  showStats?: boolean;
}

export function LibraryTrackCard({ 
  track, 
  index,
  showAlbum = true,
  showStats = true
}: LibraryTrackCardProps) {
  const { toggleLike } = usePersonalLibrary();
  const { currentTrack, isPlaying, playTrack, pauseTrack } = useMusicPlayer();
  const [isLiking, setIsLiking] = useState(false);

  const isCurrentTrack = currentTrack?.id === track.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  const handlePlayPause = async () => {
    if (isCurrentTrack && isPlaying) {
      pauseTrack();
    } else {
      // Convert LibraryTrack to Track format for player
      const playerTrack = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        albumTitle: track.albumTitle,
        imageUrl: track.imageUrl,
        duration: track.duration,
        audioUrl: track.audioUrl
      };
      await playTrack(playerTrack);
    }
  };

  const handleLike = async () => {
    setIsLiking(true);
    try {
      await toggleLike(track.id);
    } finally {
      setIsLiking(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className={`group flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 hover:bg-shellff-dark/50 ${
      isCurrentTrack ? 'bg-primary/10 border border-primary/30' : ''
    }`}>
      
      {/* Track Number/Play Button */}
      <div className="w-12 h-12 flex items-center justify-center">
        {index !== undefined && !isCurrentTrack ? (
          <span className="text-shellff-neutral font-inter text-sm group-hover:hidden">
            {index + 1}
          </span>
        ) : null}
        
        <Button
          size="sm"
          variant="ghost"
          onClick={handlePlayPause}
          className={`w-10 h-10 rounded-full p-0 ${
            index !== undefined && !isCurrentTrack ? 'hidden group-hover:flex' : 'flex'
          } ${isCurrentTrack ? 'bg-primary/20 text-primary' : 'hover:bg-white/10'}`}
        >
          {isCurrentlyPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Album Art */}
      {track.imageUrl && (
        <div className="w-12 h-12 bg-shellff-accent rounded-lg overflow-hidden relative">
          <Image
            src={track.imageUrl}
            alt={track.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h4 className={`font-poppins font-medium truncate ${
            isCurrentTrack ? 'text-primary' : 'text-white'
          }`}>
            {track.title}
          </h4>
          {isCurrentlyPlaying && (
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
              <div className="w-1 h-1 bg-primary rounded-full animate-pulse [animation-delay:0.2s]"></div>
              <div className="w-1 h-1 bg-primary rounded-full animate-pulse [animation-delay:0.4s]"></div>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2 mt-1">
          <p className="text-shellff-neutral font-inter text-sm truncate">
            {track.artist}
          </p>
          {showAlbum && track.albumTitle && (
            <>
              <span className="text-shellff-neutral">•</span>
              <p className="text-shellff-neutral font-inter text-sm truncate">
                {track.albumTitle}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      {showStats && (
        <div className="hidden lg:flex items-center space-x-6 text-shellff-neutral font-inter text-sm">
          {track.playCount > 0 && (
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-3 w-3" />
              <span>{track.playCount}</span>
            </div>
          )}
          
          {track.shcEarned && track.shcEarned > 0 && (
            <Badge variant="outline" className="border-orange-400 text-orange-400 text-xs">
              +{track.shcEarned.toFixed(1)} SHC
            </Badge>
          )}
          
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(track.dateAdded)}</span>
          </div>
        </div>
      )}

      {/* Duration */}
      <div className="text-shellff-neutral font-inter text-sm flex items-center">
        <Clock className="h-3 w-3 mr-1" />
        {formatDuration(track.duration)}
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleLike}
          disabled={isLiking}
          className={`w-10 h-10 rounded-full p-0 ${
            track.isLiked ? 'text-red-400 hover:text-red-300' : 'text-shellff-neutral hover:text-white'
          }`}
        >
          <Heart className={`h-4 w-4 ${track.isLiked ? 'fill-current' : ''}`} />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="w-10 h-10 rounded-full p-0 text-shellff-neutral hover:text-white"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-shellff-accent border-shellff-accent">
            <DropdownMenuItem className="text-white hover:bg-shellff-dark/50">
              Add to Queue
            </DropdownMenuItem>
            <DropdownMenuItem className="text-white hover:bg-shellff-dark/50">
              Play Next
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-shellff-dark" />
            <DropdownMenuItem className="text-white hover:bg-shellff-dark/50">
              Add to Playlist
            </DropdownMenuItem>
            <DropdownMenuItem className="text-white hover:bg-shellff-dark/50">
              View Album
            </DropdownMenuItem>
            <DropdownMenuItem className="text-white hover:bg-shellff-dark/50">
              View Artist
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-shellff-dark" />
            <DropdownMenuItem className="text-white hover:bg-shellff-dark/50">
              Share
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
