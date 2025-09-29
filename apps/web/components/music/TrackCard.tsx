
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Music, 
  MoreHorizontal, 
  Plus,
  Clock,
  Heart,
  Share2,
  PlayCircle,
  ListPlus
} from 'lucide-react';
import { Track, useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { DownloadButton } from '@/components/offline/DownloadButton';
import { formatDuration } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface TrackCardProps {
  track: Track;
  className?: string;
  showDownload?: boolean;
  onAddToQueue?: (track: Track) => void;
  onPlayNext?: (track: Track) => void;
}

export function TrackCard({ 
  track, 
  className = '', 
  showDownload = true,
  onAddToQueue,
  onPlayNext
}: TrackCardProps) {
  const { 
    currentTrack, 
    isPlaying, 
    playTrack, 
    togglePlay, 
    addToQueue 
  } = useMusicPlayer();

  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isCurrentTrack = currentTrack?.id === track.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  const handlePlayClick = async () => {
    if (isCurrentTrack) {
      await togglePlay();
    } else {
      await playTrack(track);
    }
  };

  const handleAddToQueue = () => {
    if (onAddToQueue) {
      onAddToQueue(track);
    } else {
      addToQueue(track);
    }
  };

  const handlePlayNext = () => {
    if (onPlayNext) {
      onPlayNext(track);
    } else {
      // Add to queue at next position
      addToQueue(track);
    }
  };

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        "hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1",
        isCurrentTrack && "ring-2 ring-primary/50 bg-primary/5",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-square relative overflow-hidden bg-muted">
        {track.imageUrl && !imageError ? (
          <Image
            src={track.imageUrl}
            alt={`${track.title} - ${track.artist}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
            <Music className="h-12 w-12 text-muted-foreground/60" />
          </div>
        )}
        
        {/* Play button overlay */}
        <div className={cn(
          "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300",
          isHovered || isCurrentlyPlaying ? "opacity-100" : "opacity-0"
        )}>
          <Button
            size="lg"
            variant={isCurrentlyPlaying ? "secondary" : "default"}
            onClick={handlePlayClick}
            className="rounded-full w-14 h-14 shadow-lg hover:scale-110 transition-transform"
          >
            {isCurrentlyPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-1" />
            )}
          </Button>
        </div>

        {/* Currently playing indicator */}
        {isCurrentlyPlaying && (
          <div className="absolute top-3 right-3">
            <Badge variant="default" className="text-xs animate-pulse">
              <div className="w-2 h-2 bg-current rounded-full mr-1 animate-ping" />
              Playing
            </Badge>
          </div>
        )}

        {/* SHC Cap badge */}
        {track.shcCap && (
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="text-xs font-mono">
              {track.shcCap} SHC
            </Badge>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Track info */}
        <div className="space-y-1">
          <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {track.title}
          </h3>
          <p className="text-muted-foreground text-xs line-clamp-1">
            {track.artist}
          </p>
          {track.albumTitle && (
            <p className="text-muted-foreground text-xs line-clamp-1 opacity-75">
              {track.albumTitle}
            </p>
          )}
        </div>

        {/* Duration */}
        <div className="flex items-center text-muted-foreground text-xs">
          <Clock className="h-3 w-3 mr-1" />
          <span>{formatDuration(track.duration)}</span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1">
            {showDownload && (
              <DownloadButton 
                track={track} 
                variant="ghost" 
                size="sm" 
              />
            )}
            <Button variant="ghost" size="sm">
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => playTrack(track)}>
                <PlayCircle className="h-4 w-4 mr-2" />
                Play Now
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePlayNext}>
                <Plus className="h-4 w-4 mr-2" />
                Play Next
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAddToQueue}>
                <ListPlus className="h-4 w-4 mr-2" />
                Add to Queue
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Heart className="h-4 w-4 mr-2" />
                Add to Liked
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Plus className="h-4 w-4 mr-2" />
                Add to Playlist
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {showDownload && (
                <DropdownMenuItem asChild>
                  <div className="w-full">
                    <DownloadButton 
                      track={track} 
                      variant="ghost" 
                      size="sm" 
                      showText
                      className="w-full justify-start h-8 px-2"
                    />
                  </div>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <Share2 className="h-4 w-4 mr-2" />
                Share Track
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}
