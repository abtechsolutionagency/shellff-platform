
'use client';

import { useState, useEffect } from 'react';
import { usePersonalLibrary } from '@/contexts/PersonalLibraryContext';
import { Plus, List, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackId: string;
  trackTitle?: string;
}

export function AddToPlaylistModal({ isOpen, onClose, trackId, trackTitle }: AddToPlaylistModalProps) {
  const { library, createPlaylist, addToPlaylist } = usePersonalLibrary();
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [isAddingToPlaylist, setIsAddingToPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowCreateForm(false);
      setNewPlaylistName('');
    }
  }, [isOpen]);

  const handleAddToPlaylist = async (playlistId: string, playlistName: string) => {
    setIsAddingToPlaylist(true);
    try {
      await addToPlaylist(playlistId, trackId);
      toast.success(`Added to "${playlistName}"`);
      onClose();
    } catch (error) {
      console.error('Failed to add to playlist:', error);
      toast.error('Failed to add to playlist. Please try again.');
    } finally {
      setIsAddingToPlaylist(false);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newPlaylistName.trim()) {
      toast.error('Please enter a playlist name');
      return;
    }

    setIsCreatingPlaylist(true);
    try {
      const newPlaylist = await createPlaylist(newPlaylistName);
      await addToPlaylist(newPlaylist.id, trackId);
      toast.success(`Created "${newPlaylistName}" and added track`);
      onClose();
    } catch (error) {
      console.error('Failed to create playlist and add track:', error);
      toast.error('Failed to create playlist. Please try again.');
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-shellff-accent border-shellff-accent max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white font-poppins">
            Add to Playlist
          </DialogTitle>
          <DialogDescription className="text-shellff-neutral font-inter">
            {trackTitle ? `Add "${trackTitle}" to a playlist` : 'Add track to a playlist'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-80 overflow-y-auto">
          {/* Existing Playlists */}
          {library.personalPlaylists.length > 0 && (
            <div className="space-y-2">
              {library.personalPlaylists.map((playlist) => (
                <Card 
                  key={playlist.id}
                  className="bg-shellff-dark border-shellff-dark hover:border-primary/30 cursor-pointer transition-colors"
                  onClick={() => handleAddToPlaylist(playlist.id, playlist.name)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-lg flex items-center justify-center">
                        <List className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate">{playlist.name}</h4>
                        <p className="text-xs text-shellff-neutral">
                          {playlist.tracks.length} tracks
                        </p>
                      </div>
                      {isAddingToPlaylist && (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Create New Playlist */}
          {!showCreateForm ? (
            <Button
              onClick={() => setShowCreateForm(true)}
              variant="outline"
              className="w-full border-shellff-neutral text-shellff-neutral hover:text-white hover:border-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Playlist
            </Button>
          ) : (
            <div className="space-y-3 p-4 bg-shellff-dark rounded-lg border border-shellff-dark">
              <div>
                <label className="text-white font-inter text-sm font-medium mb-2 block">
                  Playlist Name
                </label>
                <Input
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="My New Playlist"
                  className="bg-shellff-accent border-shellff-accent text-white"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateAndAdd()}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateAndAdd}
                  disabled={!newPlaylistName.trim() || isCreatingPlaylist}
                  className="bg-primary hover:bg-primary/90 flex-1"
                  size="sm"
                >
                  {isCreatingPlaylist ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create & Add'
                  )}
                </Button>
                <Button
                  onClick={() => setShowCreateForm(false)}
                  variant="outline"
                  size="sm"
                  disabled={isCreatingPlaylist}
                  className="border-shellff-neutral text-shellff-neutral hover:text-white"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {library.personalPlaylists.length === 0 && !showCreateForm && (
            <div className="text-center py-8">
              <List className="h-12 w-12 text-shellff-neutral mx-auto mb-3" />
              <p className="text-shellff-neutral font-inter text-sm mb-4">
                You don't have any playlists yet
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-primary hover:bg-primary/90 font-poppins"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Playlist
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isCreatingPlaylist || isAddingToPlaylist}
            className="border-shellff-neutral text-shellff-neutral hover:text-white"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
