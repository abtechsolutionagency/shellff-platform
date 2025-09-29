
import { Playlist, PlaylistTrack } from '@prisma/client';

export interface PlaylistWithTracks extends Playlist {
  _count: {
    tracks: number;
  };
  tracks?: PlaylistTrackWithDetails[];
}

export interface PlaylistTrackWithDetails extends PlaylistTrack {
  track: {
    id: string;
    title: string;
    duration: number;
    artist: {
      id: string;
      name: string;
      avatar: string | null;
    };
    album: {
      id: string;
      title: string;
      coverArt: string | null;
    } | null;
    isLiked?: boolean;
  };
}

export interface CreatePlaylistData {
  name: string;
  description?: string;
  coverArt?: string;
  isPublic?: boolean;
}

export interface UpdatePlaylistData {
  name?: string;
  description?: string;
  coverArt?: string;
  isPublic?: boolean;
}

export interface PlaylistsResponse {
  playlists: PlaylistWithTracks[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PlaylistTracksResponse {
  playlistId: string;
  playlistName: string;
  tracks: Array<{
    id: string;
    title: string;
    duration: number;
    artist: {
      id: string;
      name: string;
      avatar: string | null;
    };
    album: {
      id: string;
      title: string;
      coverArt: string | null;
    } | null;
    isLiked: boolean;
    position: number;
    addedAt: Date;
  }>;
}

export class PlaylistService {
  private static baseUrl = '/api/playlists';

  static async getPlaylists(page = 1, limit = 20): Promise<PlaylistsResponse> {
    const response = await fetch(`${this.baseUrl}?page=${page}&limit=${limit}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch playlists');
    }
    
    return response.json();
  }

  static async getPlaylist(id: string): Promise<PlaylistWithTracks> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch playlist');
    }
    
    return response.json();
  }

  static async createPlaylist(data: CreatePlaylistData): Promise<PlaylistWithTracks> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create playlist');
    }
    
    return response.json();
  }

  static async updatePlaylist(id: string, data: UpdatePlaylistData): Promise<PlaylistWithTracks> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update playlist');
    }
    
    return response.json();
  }

  static async deletePlaylist(id: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete playlist');
    }
    
    return response.json();
  }

  static async getPlaylistTracks(id: string): Promise<PlaylistTracksResponse> {
    const response = await fetch(`${this.baseUrl}/${id}/tracks`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch playlist tracks');
    }
    
    return response.json();
  }

  static async addTrackToPlaylist(
    playlistId: string, 
    trackId: string, 
    position?: number
  ): Promise<{ message: string; playlistTrack: PlaylistTrackWithDetails }> {
    const response = await fetch(`${this.baseUrl}/${playlistId}/tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trackId, position }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add track to playlist');
    }
    
    return response.json();
  }

  static async removeTrackFromPlaylist(
    playlistId: string, 
    trackId: string
  ): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/${playlistId}/tracks/${trackId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove track from playlist');
    }
    
    return response.json();
  }
}
