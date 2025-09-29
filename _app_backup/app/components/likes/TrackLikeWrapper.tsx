

'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { toggleTrackLike } from '@/lib/services/likes';
import { useToast } from '@/hooks/use-toast';

interface Track {
  id: string;
  title: string;
  artist: string;
  liked?: boolean;
}

interface TrackLikeWrapperProps {
  track: Track;
  children: (props: {
    isLiked: boolean;
    isLoading: boolean;
    handleToggleLike: (trackId: string, currentlyLiked: boolean) => Promise<void>;
  }) => ReactNode;
}

export function TrackLikeWrapper({ track, children }: TrackLikeWrapperProps) {
  const { data: session } = useSession() || {};
  const [isLiked, setIsLiked] = useState(track.liked || false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Update liked status when track prop changes
  useEffect(() => {
    setIsLiked(track.liked || false);
  }, [track.liked]);

  const handleToggleLike = async (trackId: string, currentlyLiked: boolean) => {
    if (!session?.user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to like tracks.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await toggleTrackLike(trackId, currentlyLiked);
      
      // Update local state
      setIsLiked(response.liked);
      
      // Show success feedback
      toast({
        title: response.liked ? 'Added to Liked Songs' : 'Removed from Liked Songs',
        description: response.liked 
          ? `"${track.title}" has been added to your liked songs.`
          : `"${track.title}" has been removed from your liked songs.`,
        duration: 2000,
      });
      
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update like status.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {children({
        isLiked,
        isLoading,
        handleToggleLike,
      })}
    </>
  );
}

