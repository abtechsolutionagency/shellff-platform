

'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { 
  toggleTrackLike, 
  checkTrackLikeStatus, 
  getLikedTracks,
  checkMultipleTrackLikeStatus,
  type LikedTracksResponse 
} from '@/lib/services/likes';
import { useToast } from '@/hooks/use-toast';

export interface UseLikesOptions {
  onLike?: (trackId: string) => void;
  onUnlike?: (trackId: string) => void;
  showToast?: boolean;
}

export function useLikes(options: UseLikesOptions = {}) {
  const { data: session } = useSession() || {};
  const { toast } = useToast();
  const { onLike, onUnlike, showToast = true } = options;

  const [loadingTracks, setLoadingTracks] = useState<Set<string>>(new Set());

  const isTrackLoading = useCallback((trackId: string) => {
    return loadingTracks.has(trackId);
  }, [loadingTracks]);

  const setTrackLoading = useCallback((trackId: string, loading: boolean) => {
    setLoadingTracks(prev => {
      const newSet = new Set(prev);
      if (loading) {
        newSet.add(trackId);
      } else {
        newSet.delete(trackId);
      }
      return newSet;
    });
  }, []);

  const toggleLike = useCallback(async (trackId: string, isCurrentlyLiked: boolean, trackTitle?: string): Promise<boolean> => {
    if (!session?.user) {
      if (showToast) {
        toast({
          title: 'Sign in required',
          description: 'Please sign in to like tracks.',
          variant: 'destructive',
        });
      }
      return isCurrentlyLiked;
    }

    if (isTrackLoading(trackId)) {
      return isCurrentlyLiked;
    }

    setTrackLoading(trackId, true);

    try {
      const response = await toggleTrackLike(trackId, isCurrentlyLiked);
      
      // Call callbacks
      if (response.liked && onLike) {
        onLike(trackId);
      } else if (!response.liked && onUnlike) {
        onUnlike(trackId);
      }
      
      // Show toast notification
      if (showToast) {
        toast({
          title: response.liked ? 'Added to Liked Songs' : 'Removed from Liked Songs',
          description: response.liked 
            ? trackTitle ? `"${trackTitle}" has been added to your liked songs.` : 'Track has been added to your liked songs.'
            : trackTitle ? `"${trackTitle}" has been removed from your liked songs.` : 'Track has been removed from your liked songs.',
          duration: 2000,
        });
      }
      
      return response.liked;
      
    } catch (error) {
      console.error('Error toggling like:', error);
      if (showToast) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to update like status.',
          variant: 'destructive',
        });
      }
      return isCurrentlyLiked; // Return original state on error
    } finally {
      setTrackLoading(trackId, false);
    }
  }, [session, isTrackLoading, setTrackLoading, onLike, onUnlike, showToast, toast]);

  const checkLikeStatus = useCallback(async (trackId: string): Promise<boolean> => {
    if (!session?.user) {
      return false;
    }

    try {
      const result = await checkTrackLikeStatus(trackId);
      return result.liked;
    } catch (error) {
      console.warn(`Failed to check like status for track ${trackId}:`, error);
      return false;
    }
  }, [session]);

  const checkMultipleLikeStatus = useCallback(async (trackIds: string[]): Promise<Record<string, boolean>> => {
    if (!session?.user || trackIds.length === 0) {
      return {};
    }

    try {
      return await checkMultipleTrackLikeStatus(trackIds);
    } catch (error) {
      console.warn('Failed to check multiple like statuses:', error);
      return {};
    }
  }, [session]);

  const getLikedTracksList = useCallback(async (page: number = 1, limit: number = 20): Promise<LikedTracksResponse | null> => {
    if (!session?.user) {
      return null;
    }

    try {
      return await getLikedTracks(page, limit);
    } catch (error) {
      console.error('Failed to fetch liked tracks:', error);
      if (showToast) {
        toast({
          title: 'Error',
          description: 'Failed to load liked tracks.',
          variant: 'destructive',
        });
      }
      return null;
    }
  }, [session, showToast, toast]);

  return {
    // Actions
    toggleLike,
    checkLikeStatus,
    checkMultipleLikeStatus,
    getLikedTracksList,
    
    // State
    isTrackLoading,
    
    // Utils
    isSignedIn: !!session?.user,
  };
}

