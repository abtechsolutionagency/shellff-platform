
// Likes service for client-side like/unlike operations
export interface LikeResponse {
  message: string;
  liked: boolean;
}

export interface LikedTrack {
  id: string;
  title: string;
  duration: number;
  trackNumber?: number;
  explicit: boolean;
  price?: number;
  playCount: number;
  likeCount: number;
  isExclusive: boolean;
  createdAt: string;
  updatedAt: string;
  likedAt: string;
  liked: true;
  artist: {
    id: string;
    name: string;
    profilePicture?: string;
  };
  album?: {
    id: string;
    title: string;
    coverArt?: string;
  };
  mediaAssets: Array<{
    id: string;
    type: string;
    url?: string;
    cloudStoragePath?: string;
  }>;
}

export interface LikedTracksResponse {
  tracks: LikedTrack[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Like a track
 */
export async function likeTrack(trackId: string): Promise<LikeResponse> {
  const response = await fetch(`/api/tracks/${trackId}/like`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to like track');
  }

  return response.json();
}

/**
 * Unlike a track
 */
export async function unlikeTrack(trackId: string): Promise<LikeResponse> {
  const response = await fetch(`/api/tracks/${trackId}/like`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to unlike track');
  }

  return response.json();
}

/**
 * Toggle like status for a track
 */
export async function toggleTrackLike(trackId: string, isCurrentlyLiked: boolean): Promise<LikeResponse> {
  if (isCurrentlyLiked) {
    return unlikeTrack(trackId);
  } else {
    return likeTrack(trackId);
  }
}

/**
 * Check if a track is liked by the current user
 */
export async function checkTrackLikeStatus(trackId: string): Promise<{ liked: boolean }> {
  const response = await fetch(`/api/tracks/${trackId}/like`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to check like status');
  }

  return response.json();
}

/**
 * Get user's liked tracks with pagination
 */
export async function getLikedTracks(
  page: number = 1,
  limit: number = 20
): Promise<LikedTracksResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  const response = await fetch(`/api/user/likes?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch liked tracks');
  }

  return response.json();
}

/**
 * Get multiple tracks' like statuses (for bulk checking)
 */
export async function checkMultipleTrackLikeStatus(trackIds: string[]): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};
  
  // Use Promise.allSettled to handle individual failures gracefully
  const promises = trackIds.map(async (trackId) => {
    try {
      const result = await checkTrackLikeStatus(trackId);
      results[trackId] = result.liked;
    } catch (error) {
      console.warn(`Failed to check like status for track ${trackId}:`, error);
      results[trackId] = false; // Default to not liked on error
    }
  });

  await Promise.allSettled(promises);
  return results;
}

/**
 * Like multiple tracks (bulk like)
 */
export async function likeMultipleTracks(trackIds: string[]): Promise<Record<string, { success: boolean; error?: string }>> {
  const results: Record<string, { success: boolean; error?: string }> = {};
  
  const promises = trackIds.map(async (trackId) => {
    try {
      await likeTrack(trackId);
      results[trackId] = { success: true };
    } catch (error) {
      results[trackId] = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  });

  await Promise.allSettled(promises);
  return results;
}

/**
 * Unlike multiple tracks (bulk unlike)
 */
export async function unlikeMultipleTracks(trackIds: string[]): Promise<Record<string, { success: boolean; error?: string }>> {
  const results: Record<string, { success: boolean; error?: string }> = {};
  
  const promises = trackIds.map(async (trackId) => {
    try {
      await unlikeTrack(trackId);
      results[trackId] = { success: true };
    } catch (error) {
      results[trackId] = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  });

  await Promise.allSettled(promises);
  return results;
}
