
'use client';

import { useEffect, useState } from 'react';
import { Clock, Play } from 'lucide-react';
import { useRecentTracks } from '@/hooks/useListeningHistory';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { TrackListItem } from '@/components/likes/TrackListItem';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface RecentlyPlayedSectionProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

export function RecentlyPlayedSection({ 
  limit = 10, 
  showHeader = true, 
  className = "" 
}: RecentlyPlayedSectionProps) {
  const { recentTracks, loading, error, refresh } = useRecentTracks();
  const { playTrack, currentTrack, isPlaying } = useMusicPlayer();
  const [displayedTracks, setDisplayedTracks] = useState(limit);

  useEffect(() => {
    refresh(limit);
  }, [limit]);

  // Convert API track format to TrackListItem format
  const convertToListItemTrack = (track: any) => ({
    id: track.id,
    title: track.title,
    artist: track.artist,
    album: track.albumTitle,
    duration: track.duration,
    coverUrl: track.imageUrl
  });

  const handlePlayTrack = async (track: any) => {
    await playTrack(track, recentTracks);
  };

  const handleLoadMore = () => {
    const newLimit = displayedTracks + 10;
    setDisplayedTracks(newLimit);
    refresh(newLimit);
  };

  if (error) {
    return (
      <div className={`${className}`}>
        {showHeader && (
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Recently Played</h2>
          </div>
        )}
        <div className="text-center py-8 text-muted-foreground">
          Failed to load recently played tracks
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Recently Played</h2>
          </div>
          {recentTracks.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => refresh(displayedTracks)}
              disabled={loading}
            >
              Refresh
            </Button>
          )}
        </div>
      )}

      {loading && recentTracks.length === 0 ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 p-3">
              <Skeleton className="w-12 h-12 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="w-3/4 h-4" />
                <Skeleton className="w-1/2 h-3" />
              </div>
              <Skeleton className="w-8 h-8 rounded-full" />
            </div>
          ))}
        </div>
      ) : recentTracks.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-lg mb-2">No Recent Tracks</h3>
          <p className="text-muted-foreground text-sm">
            Start listening to music to see your recently played tracks here.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {recentTracks.slice(0, displayedTracks).map((track, index) => (
            <TrackListItem
              key={`${track.id}-${index}`}
              track={convertToListItemTrack(track)}
              index={index}
              onPlay={handlePlayTrack}
              showIndex={true}
              showDuration={true}
              showAlbum={false}
              className="hover:bg-muted/50 rounded-lg transition-colors p-3"
            />
          ))}
          
          {recentTracks.length > displayedTracks && (
            <div className="pt-4 text-center">
              <Button 
                variant="outline" 
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Compact version for sidebars or smaller spaces
export function RecentlyPlayedCompact({ limit = 5 }: { limit?: number }) {
  const { recentTracks, loading } = useRecentTracks();
  const { playTrack, currentTrack, isPlaying } = useMusicPlayer();

  const handlePlayTrack = async (track: any) => {
    await playTrack(track, recentTracks);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: limit }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded" />
            <div className="flex-1 space-y-1">
              <Skeleton className="w-full h-3" />
              <Skeleton className="w-3/4 h-3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (recentTracks.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        No recent tracks
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recentTracks.slice(0, limit).map((track, index) => (
        <div 
          key={`${track.id}-${index}`}
          className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-md transition-colors cursor-pointer group"
          onClick={() => handlePlayTrack(track)}
        >
          <div className="relative w-10 h-10 bg-muted rounded overflow-hidden flex-shrink-0">
            {track.imageUrl ? (
              <img 
                src={track.imageUrl} 
                alt={track.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
            
            {/* Play overlay */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {currentTrack?.id === track.id && isPlaying ? (
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              ) : (
                <Play className="w-4 h-4 text-white" />
              )}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {track.title}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {track.artist}
            </p>
          </div>
          
          {currentTrack?.id === track.id && isPlaying && (
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}
