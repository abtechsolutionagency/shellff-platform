
'use client';

import { useState } from 'react';
import { usePersonalLibrary, PersonalPlaylist } from '@/contexts/PersonalLibraryContext';
import { Plus, List, Lock, Globe, Play, MoreHorizontal, Edit2, Trash2, Share, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LibraryTrackCard } from './LibraryTrackCard';

interface PlaylistCardProps {
  playlist: PersonalPlaylist;
  onEdit: (playlist: PersonalPlaylist) => void;
  onDelete: (playlist: PersonalPlaylist) => void;
  onPlay: (playlist: PersonalPlaylist) => void;
}

function PlaylistCard({ playlist, onEdit, onDelete, onPlay }: PlaylistCardProps) {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card className="bg-shellff-accent border-shellff-accent group hover:border-primary/30 transition-all duration-300 hover:glow-purple">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-xl flex items-center justify-center">
              <List className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-white font-poppins text-lg truncate">
                {playlist.name}
              </CardTitle>
              <CardDescription className="text-shellff-neutral font-inter text-sm mt-1">
                {playlist.tracks.length} tracks • {formatDuration(playlist.totalDuration)}
              </CardDescription>
              {playlist.description && (
                <p className="text-shellff-neutral font-inter text-sm mt-2 line-clamp-2">
                  {playlist.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              onClick={() => onPlay(playlist)}
              disabled={playlist.tracks.length === 0}
              className="bg-primary hover:bg-primary/90"
            >
              <Play className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="text-shellff-neutral hover:text-white">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-shellff-accent border-shellff-accent">
                <DropdownMenuItem 
                  onClick={() => onEdit(playlist)}
                  className="text-white hover:bg-shellff-dark/50"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Playlist
                </DropdownMenuItem>
                <DropdownMenuItem className="text-white hover:bg-shellff-dark/50">
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem className="text-white hover:bg-shellff-dark/50">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-shellff-dark" />
                <DropdownMenuItem 
                  onClick={() => onDelete(playlist)}
                  className="text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs text-shellff-neutral font-inter">
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className={
              playlist.isPublic 
                ? "border-green-400 text-green-400" 
                : "border-shellff-neutral text-shellff-neutral"
            }>
              {playlist.isPublic ? (
                <>
                  <Globe className="h-3 w-3 mr-1" />
                  Public
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3 mr-1" />
                  Private
                </>
              )}
            </Badge>
            
            {playlist.playCount > 0 && (
              <span>{playlist.playCount} plays</span>
            )}
          </div>
          
          <span>Updated {formatDate(playlist.updatedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function PlaylistManager() {
  const { library, createPlaylist, deletePlaylist, updatePlaylist } = usePersonalLibrary();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<PersonalPlaylist | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [newPlaylistIsPublic, setNewPlaylistIsPublic] = useState(false);
  
  // Loading states
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      toast.error('Please enter a playlist name');
      return;
    }
    
    setIsCreating(true);
    try {
      await createPlaylist(newPlaylistName, newPlaylistDescription || undefined);
      toast.success(`Playlist "${newPlaylistName}" created successfully`);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setNewPlaylistIsPublic(false);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create playlist:', error);
      toast.error('Failed to create playlist. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditPlaylist = async () => {
    if (!selectedPlaylist || !newPlaylistName.trim()) {
      toast.error('Please enter a playlist name');
      return;
    }
    
    setIsUpdating(true);
    try {
      await updatePlaylist(selectedPlaylist.id, {
        name: newPlaylistName,
        description: newPlaylistDescription || undefined,
        isPublic: newPlaylistIsPublic
      });
      toast.success(`Playlist updated successfully`);
      setIsEditDialogOpen(false);
      setSelectedPlaylist(null);
    } catch (error) {
      console.error('Failed to update playlist:', error);
      toast.error('Failed to update playlist. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!selectedPlaylist) return;
    
    setIsDeleting(true);
    try {
      await deletePlaylist(selectedPlaylist.id);
      toast.success(`Playlist "${selectedPlaylist.name}" deleted successfully`);
      setIsDeleteDialogOpen(false);
      setSelectedPlaylist(null);
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      toast.error('Failed to delete playlist. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = (playlist: PersonalPlaylist) => {
    setSelectedPlaylist(playlist);
    setNewPlaylistName(playlist.name);
    setNewPlaylistDescription(playlist.description || '');
    setNewPlaylistIsPublic(playlist.isPublic);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (playlist: PersonalPlaylist) => {
    setSelectedPlaylist(playlist);
    setIsDeleteDialogOpen(true);
  };

  const handlePlayPlaylist = (playlist: PersonalPlaylist) => {
    // TODO: Implement playlist playback
    console.log('Playing playlist:', playlist.name);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white font-poppins">
            Your Playlists ({library.personalPlaylists.length})
          </h2>
          <p className="text-shellff-neutral font-inter mt-1">
            Create and organize your personal collections
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 font-poppins">
              <Plus className="h-4 w-4 mr-2" />
              New Playlist
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-shellff-accent border-shellff-accent">
            <DialogHeader>
              <DialogTitle className="text-white font-poppins">Create New Playlist</DialogTitle>
              <DialogDescription className="text-shellff-neutral font-inter">
                Add a new playlist to your library
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <label className="text-white font-inter text-sm font-medium mb-2 block">
                  Playlist Name
                </label>
                <Input
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="My Awesome Playlist"
                  className="bg-shellff-dark border-shellff-dark text-white"
                />
              </div>
              
              <div>
                <label className="text-white font-inter text-sm font-medium mb-2 block">
                  Description (Optional)
                </label>
                <Textarea
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  placeholder="A collection of my favorite tracks..."
                  rows={3}
                  className="bg-shellff-dark border-shellff-dark text-white resize-none"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isCreating}
                className="border-shellff-neutral text-shellff-neutral hover:text-white"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreatePlaylist}
                disabled={!newPlaylistName.trim() || isCreating}
                className="bg-primary hover:bg-primary/90"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Playlist'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Playlists Grid */}
      {library.personalPlaylists.length === 0 ? (
        <Card className="bg-shellff-accent border-shellff-accent">
          <CardContent className="text-center py-12">
            <List className="h-16 w-16 text-shellff-neutral mx-auto mb-4" />
            <h3 className="text-white font-poppins text-xl mb-2">No playlists yet</h3>
            <p className="text-shellff-neutral font-inter mb-6">
              Create your first playlist to start organizing your music
            </p>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-primary hover:bg-primary/90 font-poppins"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Playlist
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {library.personalPlaylists.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onPlay={handlePlayPlaylist}
            />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-shellff-accent border-shellff-accent max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-white font-poppins">
              Edit Playlist: {selectedPlaylist?.name}
            </DialogTitle>
            <DialogDescription className="text-shellff-neutral font-inter">
              Update playlist details and manage tracks
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4 overflow-hidden">
            {/* Playlist Settings */}
            <div className="space-y-4">
              <div>
                <label className="text-white font-inter text-sm font-medium mb-2 block">
                  Playlist Name
                </label>
                <Input
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="bg-shellff-dark border-shellff-dark text-white"
                />
              </div>
              
              <div>
                <label className="text-white font-inter text-sm font-medium mb-2 block">
                  Description
                </label>
                <Textarea
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  rows={3}
                  className="bg-shellff-dark border-shellff-dark text-white resize-none"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="public"
                  checked={newPlaylistIsPublic}
                  onChange={(e) => setNewPlaylistIsPublic(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="public" className="text-white font-inter text-sm">
                  Make this playlist public
                </label>
              </div>
            </div>

            {/* Track List */}
            <div className="space-y-4 overflow-hidden">
              <h4 className="text-white font-poppins font-medium">
                Tracks ({selectedPlaylist?.tracks.length || 0})
              </h4>
              
              <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                {selectedPlaylist?.tracks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-shellff-neutral font-inter">
                      No tracks in this playlist yet
                    </p>
                  </div>
                ) : (
                  selectedPlaylist?.tracks.map((track) => (
                    <LibraryTrackCard 
                      key={track.id} 
                      track={track}
                      showAlbum={false}
                      showStats={false}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isUpdating}
              className="border-shellff-neutral text-shellff-neutral hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditPlaylist}
              disabled={isUpdating || !newPlaylistName.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-shellff-accent border-shellff-accent">
          <DialogHeader>
            <DialogTitle className="text-white font-poppins">Delete Playlist</DialogTitle>
            <DialogDescription className="text-shellff-neutral font-inter">
              Are you sure you want to delete &ldquo;{selectedPlaylist?.name}&rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="border-shellff-neutral text-shellff-neutral hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeletePlaylist}
              disabled={isDeleting}
              variant="destructive"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Playlist'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
