
"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Play, Pause, Heart, Clock, ShoppingCart, MoreHorizontal, Plus, ListPlus, SkipForward } from "lucide-react";
import Image from "next/image";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { cn } from "@/lib/utils";

interface Track {
  id: string;
  title: string;
  duration: number;
  explicit: boolean;
  price?: number;
  playCount: number;
  likeCount: number;
  artist: {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
  };
  album?: {
    id: string;
    title: string;
    coverArt?: string;
  };
  tags: Array<{
    id: string;
    name: string;
    category: string;
  }>;
}

interface TrackCardProps {
  track: Track;
}

export function TrackCard({ track }: TrackCardProps) {
  const { currentTrack, isPlaying, playTrack, pauseTrack, addToQueue, queue } = useMusicPlayer();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const isCurrentTrack = currentTrack?.id === track.id;
  const isTrackPlaying = isCurrentTrack && isPlaying;

  const convertToPlayerTrack = () => ({
    id: track.id,
    title: track.title,
    artist: track.artist.name,
    albumTitle: track.album?.title,
    imageUrl: track.album?.coverArt,
    duration: track.duration,
    albumId: track.album?.id,
    artistId: track.artist.id,
  });

  const handlePlayPause = async () => {
    if (isCurrentTrack && isPlaying) {
      pauseTrack();
    } else {
      await playTrack(convertToPlayerTrack());
    }
  };

  const handleAddToQueue = () => {
    const playerTrack = convertToPlayerTrack();
    addToQueue(playerTrack);
    // TODO: Show toast notification
  };

  const handlePlayNext = async () => {
    const playerTrack = convertToPlayerTrack();
    if (queue && queue.tracks.length > 0) {
      // Play immediately and add to queue at next position
      await playTrack(playerTrack);
    } else {
      // No queue exists, just play the track
      await playTrack(playerTrack);
    }
  };

  const isInQueue = queue?.tracks.some(t => t.id === track.id) || false;

  return (
    <Card className="p-4 hover:bg-accent/50 transition-colors group">
      <div className="flex items-center gap-4">
        {/* Album Cover */}
        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted">
          {track.album?.coverArt ? (
            <Image
              src={track.album.coverArt}
              alt={track.album.title || track.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#9B5DE5] to-[#00F5D4]">
              <Play className="h-5 w-5 text-white" />
            </div>
          )}
          <div className={cn(
            "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity",
            isCurrentTrack ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            <Button 
              size="sm" 
              className={cn(
                "h-8 w-8 rounded-full p-0",
                isTrackPlaying 
                  ? "bg-[#00F5D4] hover:bg-[#00F5D4]/80" 
                  : "bg-[#9B5DE5] hover:bg-[#9B5DE5]/80"
              )}
              onClick={handlePlayPause}
            >
              {isTrackPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={cn(
              "font-semibold truncate transition-colors",
              isCurrentTrack 
                ? "text-[#9B5DE5]" 
                : "text-foreground"
            )}>
              {track.title}
            </h3>
            {track.explicit && (
              <Badge variant="secondary" className="text-xs h-5 px-1">
                E
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="truncate">
              {track.artist.name}
              {track.artist.verified && <span className="ml-1">✓</span>}
            </span>
            {track.album && (
              <>
                <span>•</span>
                <span className="truncate">{track.album.title}</span>
              </>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="hidden md:flex gap-1 flex-wrap max-w-48">
          {track.tags.slice(0, 2).map((tag) => (
            <Badge key={tag.id} variant="outline" className="text-xs">
              {tag.name}
            </Badge>
          ))}
          {track.tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{track.tags.length - 2}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Play className="h-3 w-3" />
            {formatNumber(track.playCount)}
          </div>
          <div className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {formatNumber(track.likeCount)}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(track.duration)}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {track.price && (
            <Button size="sm" variant="outline" className="gap-1">
              <ShoppingCart className="h-3 w-3" />
              {track.price} SHC
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <Heart className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handlePlayNext}>
                <SkipForward className="h-4 w-4 mr-2" />
                Play Next
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAddToQueue} disabled={isInQueue}>
                <ListPlus className="h-4 w-4 mr-2" />
                {isInQueue ? 'Already in Queue' : 'Add to Queue'}
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}
