
'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export interface LibraryTrack {
  id: string;
  title: string;
  artist: string;
  albumTitle?: string;
  imageUrl?: string;
  duration: number;
  audioUrl?: string;
  dateAdded: string;
  playCount: number;
  lastPlayed?: string;
  isLiked: boolean;
  shcEarned?: number;
}

export interface PersonalPlaylist {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  tracks: LibraryTrack[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  playCount: number;
  totalDuration: number;
}

export interface ListeningSession {
  id: string;
  trackId: string;
  track: LibraryTrack;
  startTime: string;
  endTime?: string;
  duration: number;
  shcEarned: number;
  deviceInfo: string;
}

export interface PersonalLibraryState {
  likedTracks: LibraryTrack[];
  personalPlaylists: PersonalPlaylist[];
  listeningHistory: ListeningSession[];
  recentPlays: LibraryTrack[];
  recommendations: LibraryTrack[];
  totalListeningTime: number;
  totalShcEarned: number;
  syncStatus: 'syncing' | 'synced' | 'offline';
}

export interface PersonalLibraryContextType {
  // State
  library: PersonalLibraryState;
  isLoading: boolean;
  
  // Likes Management
  toggleLike: (trackId: string) => Promise<void>;
  getLikedTracks: () => LibraryTrack[];
  
  // Playlist Management
  createPlaylist: (name: string, description?: string) => Promise<PersonalPlaylist>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  addToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  updatePlaylist: (playlistId: string, updates: Partial<PersonalPlaylist>) => Promise<void>;
  
  // Listening History
  recordListeningSession: (track: LibraryTrack, duration: number, shcEarned: number) => Promise<void>;
  getListeningHistory: (limit?: number) => ListeningSession[];
  getRecentPlays: (limit?: number) => LibraryTrack[];
  
  // Recommendations
  refreshRecommendations: () => Promise<void>;
  
  // Sync & Storage
  syncLibrary: () => Promise<void>;
  exportLibrary: () => Promise<string>;
  importLibrary: (data: string) => Promise<void>;
}

const PersonalLibraryContext = createContext<PersonalLibraryContextType | null>(null);

export const usePersonalLibrary = () => {
  const context = useContext(PersonalLibraryContext);
  if (!context) {
    throw new Error('usePersonalLibrary must be used within a PersonalLibraryProvider');
  }
  return context;
};

interface PersonalLibraryProviderProps {
  children: ReactNode;
}

export function PersonalLibraryProvider({ children }: PersonalLibraryProviderProps) {
  const { data: session } = useSession() || {};
  const [library, setLibrary] = useState<PersonalLibraryState>({
    likedTracks: [],
    personalPlaylists: [],
    listeningHistory: [],
    recentPlays: [],
    recommendations: [],
    totalListeningTime: 0,
    totalShcEarned: 0,
    syncStatus: 'synced'
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load library data on session change
  useEffect(() => {
    if (session?.user) {
      loadLibraryData();
    }
  }, [session]);

  // Auto-sync every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (session?.user && library.syncStatus === 'synced') {
        syncLibrary();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [session, library.syncStatus]);

  const loadLibraryData = async () => {
    setIsLoading(true);
    try {
      // Load playlists from API
      const response = await fetch('/api/playlists');
      if (response.ok) {
        const playlists = await response.json();
        const personalPlaylists: PersonalPlaylist[] = playlists.map((playlist: any) => ({
          id: playlist.id,
          name: playlist.name,
          description: playlist.description || '',
          tracks: [], // Will be loaded when playlist is opened
          isPublic: playlist.isPublic || false,
          createdAt: playlist.createdAt,
          updatedAt: playlist.updatedAt,
          playCount: 0,
          totalDuration: playlist._count?.tracks ? playlist._count.tracks * 180 : 0 // Estimated duration
        }));

        setLibrary(prev => ({
          ...prev,
          personalPlaylists
        }));
      }

      // Load from localStorage for other data (liked tracks, history, etc.)
      const userId = (session?.user as any)?.userId || session?.user?.email || 'default';
      const storedLibrary = localStorage.getItem(`shellff-library-${userId}`);
      if (storedLibrary) {
        const parsed = JSON.parse(storedLibrary);
        setLibrary(prev => ({ 
          ...prev, 
          likedTracks: parsed.likedTracks || [],
          listeningHistory: parsed.listeningHistory || [],
          recentPlays: parsed.recentPlays || [],
          totalListeningTime: parsed.totalListeningTime || 0,
          totalShcEarned: parsed.totalShcEarned || 0
        }));
      }
      
      // Load recommendations
      await refreshRecommendations();
    } catch (error) {
      console.error('Failed to load library data:', error);
      // Fallback to localStorage if API fails
      const userId = (session?.user as any)?.userId || session?.user?.email || 'default';
      const storedLibrary = localStorage.getItem(`shellff-library-${userId}`);
      if (storedLibrary) {
        const parsed = JSON.parse(storedLibrary);
        setLibrary(prev => ({ ...prev, ...parsed }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveLibraryData = async () => {
    try {
      const userId = (session?.user as any)?.userId || session?.user?.email || 'default';
      localStorage.setItem(`shellff-library-${userId}`, JSON.stringify(library));
    } catch (error) {
      console.error('Failed to save library data:', error);
    }
  };

  const toggleLike = async (trackId: string) => {
    setLibrary(prev => {
      const isLiked = prev.likedTracks.some(track => track.id === trackId);
      
      if (isLiked) {
        return {
          ...prev,
          likedTracks: prev.likedTracks.filter(track => track.id !== trackId)
        };
      } else {
        // In a real app, fetch track details from API
        const mockTrack: LibraryTrack = {
          id: trackId,
          title: `Track ${trackId}`,
          artist: 'Various Artists',
          duration: 180,
          dateAdded: new Date().toISOString(),
          playCount: 0,
          isLiked: true,
          shcEarned: 0
        };
        
        return {
          ...prev,
          likedTracks: [...prev.likedTracks, mockTrack]
        };
      }
    });
    
    await saveLibraryData();
  };

  const getLikedTracks = () => {
    return library.likedTracks;
  };

  const createPlaylist = async (name: string, description?: string): Promise<PersonalPlaylist> => {
    try {
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) {
        throw new Error('Failed to create playlist');
      }

      const playlist = await response.json();
      
      const newPlaylist: PersonalPlaylist = {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        tracks: [],
        isPublic: playlist.isPublic || false,
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt,
        playCount: 0,
        totalDuration: 0
      };

      setLibrary(prev => ({
        ...prev,
        personalPlaylists: [...prev.personalPlaylists, newPlaylist]
      }));

      return newPlaylist;
    } catch (error) {
      console.error('Failed to create playlist:', error);
      throw error;
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    try {
      const response = await fetch(`/api/playlists/${playlistId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete playlist');
      }

      setLibrary(prev => ({
        ...prev,
        personalPlaylists: prev.personalPlaylists.filter(p => p.id !== playlistId)
      }));
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      throw error;
    }
  };

  const addToPlaylist = async (playlistId: string, trackId: string) => {
    try {
      const response = await fetch(`/api/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trackId }),
      });

      if (!response.ok) {
        throw new Error('Failed to add track to playlist');
      }

      // Fetch the track details for the local state update
      const trackResponse = await fetch(`/api/tracks/${trackId}`);
      let trackDetails: LibraryTrack;
      
      if (trackResponse.ok) {
        const track = await trackResponse.json();
        trackDetails = {
          id: track.id,
          title: track.title,
          artist: track.artistName,
          albumTitle: track.albumTitle,
          duration: track.duration || 180,
          dateAdded: new Date().toISOString(),
          playCount: 0,
          isLiked: false,
          shcEarned: 0,
          imageUrl: track.albumCover
        };
      } else {
        // Fallback if track details can't be fetched
        trackDetails = {
          id: trackId,
          title: `Track ${trackId}`,
          artist: 'Various Artists',
          duration: 180,
          dateAdded: new Date().toISOString(),
          playCount: 0,
          isLiked: false,
          shcEarned: 0
        };
      }

      setLibrary(prev => ({
        ...prev,
        personalPlaylists: prev.personalPlaylists.map(playlist => 
          playlist.id === playlistId
            ? {
                ...playlist,
                tracks: [...playlist.tracks, trackDetails],
                totalDuration: playlist.totalDuration + trackDetails.duration,
                updatedAt: new Date().toISOString()
              }
            : playlist
        )
      }));
    } catch (error) {
      console.error('Failed to add track to playlist:', error);
      throw error;
    }
  };

  const removeFromPlaylist = async (playlistId: string, trackId: string) => {
    try {
      const response = await fetch(`/api/playlists/${playlistId}/tracks/${trackId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove track from playlist');
      }

      setLibrary(prev => ({
        ...prev,
        personalPlaylists: prev.personalPlaylists.map(playlist =>
          playlist.id === playlistId
            ? {
                ...playlist,
                tracks: playlist.tracks.filter(track => track.id !== trackId),
                totalDuration: playlist.tracks
                  .filter(track => track.id !== trackId)
                  .reduce((acc, track) => acc + track.duration, 0),
                updatedAt: new Date().toISOString()
              }
            : playlist
        )
      }));
    } catch (error) {
      console.error('Failed to remove track from playlist:', error);
      throw error;
    }
  };

  const updatePlaylist = async (playlistId: string, updates: Partial<PersonalPlaylist>) => {
    try {
      const response = await fetch(`/api/playlists/${playlistId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: updates.name,
          description: updates.description,
          isPublic: updates.isPublic,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update playlist');
      }

      const updatedPlaylist = await response.json();

      setLibrary(prev => ({
        ...prev,
        personalPlaylists: prev.personalPlaylists.map(playlist =>
          playlist.id === playlistId
            ? { 
                ...playlist, 
                name: updatedPlaylist.name,
                description: updatedPlaylist.description,
                isPublic: updatedPlaylist.isPublic,
                updatedAt: updatedPlaylist.updatedAt 
              }
            : playlist
        )
      }));
    } catch (error) {
      console.error('Failed to update playlist:', error);
      throw error;
    }
  };

  const recordListeningSession = async (track: LibraryTrack, duration: number, shcEarned: number) => {
    const session: ListeningSession = {
      id: `session-${Date.now()}`,
      trackId: track.id,
      track,
      startTime: new Date().toISOString(),
      duration,
      shcEarned,
      deviceInfo: navigator.userAgent.substring(0, 50)
    };

    setLibrary(prev => ({
      ...prev,
      listeningHistory: [session, ...prev.listeningHistory.slice(0, 99)], // Keep last 100
      recentPlays: [track, ...prev.recentPlays.filter(t => t.id !== track.id).slice(0, 19)], // Keep last 20, unique
      totalListeningTime: prev.totalListeningTime + duration,
      totalShcEarned: prev.totalShcEarned + shcEarned
    }));

    await saveLibraryData();
  };

  const getListeningHistory = (limit = 50) => {
    return library.listeningHistory.slice(0, limit);
  };

  const getRecentPlays = (limit = 20) => {
    return library.recentPlays.slice(0, limit);
  };

  const refreshRecommendations = async () => {
    // Mock recommendations based on listening history and likes
    const mockRecommendations: LibraryTrack[] = Array.from({ length: 10 }, (_, i) => ({
      id: `rec-${i + 1}`,
      title: `Recommended Track ${i + 1}`,
      artist: `Recommended Artist ${i + 1}`,
      albumTitle: `Recommended Album ${i + 1}`,
      duration: 180 + Math.floor(Math.random() * 120),
      dateAdded: new Date().toISOString(),
      playCount: Math.floor(Math.random() * 1000),
      isLiked: false,
      shcEarned: Math.floor(Math.random() * 50)
    }));

    setLibrary(prev => ({
      ...prev,
      recommendations: mockRecommendations
    }));
  };

  const syncLibrary = async () => {
    setLibrary(prev => ({ ...prev, syncStatus: 'syncing' }));
    
    try {
      // Mock sync delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLibrary(prev => ({ ...prev, syncStatus: 'synced' }));
    } catch (error) {
      console.error('Sync failed:', error);
      setLibrary(prev => ({ ...prev, syncStatus: 'offline' }));
    }
  };

  const exportLibrary = async (): Promise<string> => {
    return JSON.stringify(library, null, 2);
  };

  const importLibrary = async (data: string) => {
    try {
      const imported = JSON.parse(data);
      setLibrary(prev => ({ ...prev, ...imported }));
      await saveLibraryData();
    } catch (error) {
      console.error('Failed to import library:', error);
      throw error;
    }
  };

  const value: PersonalLibraryContextType = {
    library,
    isLoading,
    toggleLike,
    getLikedTracks,
    createPlaylist,
    deletePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    updatePlaylist,
    recordListeningSession,
    getListeningHistory,
    getRecentPlays,
    refreshRecommendations,
    syncLibrary,
    exportLibrary,
    importLibrary
  };

  return (
    <PersonalLibraryContext.Provider value={value}>
      {children}
    </PersonalLibraryContext.Provider>
  );
}
