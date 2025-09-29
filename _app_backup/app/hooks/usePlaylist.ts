
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PlaylistService, PlaylistWithTracks, PlaylistsResponse } from '@/lib/services/playlistService';
import { toast } from 'react-hot-toast';

export function usePlaylists() {
  const { data: session } = useSession() || {};
  const [playlists, setPlaylists] = useState<PlaylistWithTracks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const fetchPlaylists = async (page = 1, limit = 20) => {
    if (!session?.user) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await PlaylistService.getPlaylists(page, limit);
      setPlaylists(response.playlists);
      setPagination(response.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load playlists';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createPlaylist = async (data: { 
    name: string; 
    description?: string; 
    coverArt?: string; 
    isPublic?: boolean 
  }) => {
    try {
      const newPlaylist = await PlaylistService.createPlaylist(data);
      setPlaylists(prev => [newPlaylist, ...prev]);
      toast.success(`Playlist "${data.name}" created successfully!`);
      return newPlaylist;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create playlist';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  };

  const deletePlaylist = async (id: string) => {
    try {
      const result = await PlaylistService.deletePlaylist(id);
      setPlaylists(prev => prev.filter(playlist => playlist.id !== id));
      toast.success(result.message);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete playlist';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  };

  const updatePlaylist = async (id: string, data: { 
    name?: string; 
    description?: string; 
    coverArt?: string; 
    isPublic?: boolean 
  }) => {
    try {
      const updatedPlaylist = await PlaylistService.updatePlaylist(id, data);
      setPlaylists(prev => prev.map(playlist => 
        playlist.id === id ? updatedPlaylist : playlist
      ));
      toast.success('Playlist updated successfully!');
      return updatedPlaylist;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update playlist';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, [session]);

  return {
    playlists,
    loading,
    error,
    pagination,
    fetchPlaylists,
    createPlaylist,
    deletePlaylist,
    updatePlaylist,
    refetch: () => fetchPlaylists(pagination.page, pagination.limit)
  };
}

export function usePlaylist(id: string) {
  const { data: session } = useSession() || {};
  const [playlist, setPlaylist] = useState<PlaylistWithTracks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaylist = async () => {
    if (!session?.user || !id) return;

    try {
      setLoading(true);
      setError(null);
      
      const fetchedPlaylist = await PlaylistService.getPlaylist(id);
      setPlaylist(fetchedPlaylist);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load playlist';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addTrackToPlaylist = async (trackId: string, position?: number) => {
    if (!playlist) return;

    try {
      const result = await PlaylistService.addTrackToPlaylist(playlist.id, trackId, position);
      
      // Refresh playlist data
      await fetchPlaylist();
      
      toast.success(result.message);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add track';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  };

  const removeTrackFromPlaylist = async (trackId: string) => {
    if (!playlist) return;

    try {
      const result = await PlaylistService.removeTrackFromPlaylist(playlist.id, trackId);
      
      // Refresh playlist data
      await fetchPlaylist();
      
      toast.success(result.message);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove track';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    fetchPlaylist();
  }, [id, session]);

  return {
    playlist,
    loading,
    error,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    refetch: fetchPlaylist
  };
}
