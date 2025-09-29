
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  Trash2, 
  Music, 
  HardDrive, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { offlineCache } from '@/lib/offline-cache';
import { Track } from '@/contexts/MusicPlayerContext';
import { formatDuration } from '@/lib/utils';
import Image from 'next/image';

interface CachedTrack {
  id: string;
  track: Track;
  audioBlob: Blob;
  imageBlob?: Blob;
  downloadDate: number;
  lastAccessed: number;
  size: number;
}

interface DownloadProgress {
  trackId: string;
  progress: number;
  status: 'downloading' | 'completed' | 'error' | 'paused';
  error?: string;
}

interface DownloadManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DownloadManager({ open, onOpenChange }: DownloadManagerProps) {
  const [cachedTracks, setCachedTracks] = useState<CachedTrack[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Map<string, DownloadProgress>>(new Map());
  const [cacheStats, setCacheStats] = useState<{ count: number; totalSize: number; oldestDate?: number }>({ count: 0, totalSize: 0, oldestDate: undefined });
  const [loading, setLoading] = useState(true);

  // Load cached tracks and stats
  const loadData = async () => {
    setLoading(true);
    try {
      const [tracks, stats] = await Promise.all([
        offlineCache.getAllCachedTracks(),
        offlineCache.getCacheStats()
      ]);
      setCachedTracks(tracks);
      setCacheStats(stats);
    } catch (error) {
      console.error('Failed to load offline data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to download progress updates
  useEffect(() => {
    const unsubscribe = offlineCache.onProgressUpdate((progress) => {
      setDownloadProgress(progress);
    });

    return unsubscribe;
  }, []);

  // Load data when dialog opens
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Remove cached track
  const handleRemoveTrack = async (trackId: string) => {
    try {
      await offlineCache.removeCachedTrack(trackId);
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Failed to remove cached track:', error);
    }
  };

  // Clear all cache
  const handleClearCache = async () => {
    try {
      await offlineCache.clearCache();
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  // Render download progress item
  const renderProgressItem = (progress: DownloadProgress) => {
    const track = cachedTracks.find(t => t.id === progress.trackId)?.track;
    
    return (
      <div key={progress.trackId} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
        <div className="flex-shrink-0 w-10 h-10 bg-muted rounded-md flex items-center justify-center">
          {progress.status === 'downloading' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          {progress.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          {progress.status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {track?.title || `Track ${progress.trackId}`}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {track?.artist || 'Unknown Artist'}
          </p>
          
          {progress.status === 'downloading' && (
            <div className="mt-2">
              <Progress value={progress.progress} className="h-1" />
              <p className="text-xs text-muted-foreground mt-1">
                {progress.progress}% complete
              </p>
            </div>
          )}
          
          {progress.status === 'error' && (
            <p className="text-xs text-destructive mt-1">
              {progress.error || 'Download failed'}
            </p>
          )}
        </div>
      </div>
    );
  };

  // Render cached track item
  const renderCachedTrack = (cachedTrack: CachedTrack) => {
    const { track } = cachedTrack;
    
    return (
      <div key={track.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
        <div className="flex-shrink-0 w-12 h-12 bg-muted rounded-md overflow-hidden relative">
          {track.imageUrl ? (
            <Image
              src={track.imageUrl}
              alt={track.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{track.title}</p>
          <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
            <span>{formatDuration(track.duration)}</span>
            <span>{formatSize(cachedTrack.size)}</span>
            <span>Downloaded {new Date(cachedTrack.downloadDate).toLocaleDateString()}</span>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleRemoveTrack(track.id)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  const activeDownloads = Array.from(downloadProgress.values()).filter(p => p.status === 'downloading');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download Manager
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
              <Music className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">{cacheStats.count}</p>
                <p className="text-xs text-muted-foreground">Tracks</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
              <HardDrive className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">{formatSize(cacheStats.totalSize)}</p>
                <p className="text-xs text-muted-foreground">Storage</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">
                  {cacheStats.oldestDate 
                    ? new Date(cacheStats.oldestDate).toLocaleDateString()
                    : 'N/A'
                  }
                </p>
                <p className="text-xs text-muted-foreground">Oldest</p>
              </div>
            </div>
          </div>

          {/* Active Downloads */}
          {activeDownloads.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Active Downloads</h3>
                <Badge variant="secondary">{activeDownloads.length}</Badge>
              </div>
              <div className="space-y-2">
                {activeDownloads.map(renderProgressItem)}
              </div>
            </div>
          )}

          {activeDownloads.length > 0 && <Separator />}

          {/* Cached Tracks */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Downloaded Tracks</h3>
              {cacheStats.count > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleClearCache}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : cachedTracks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <Download className="h-12 w-12 text-muted-foreground mb-4" />
                <h4 className="font-medium text-lg mb-2">No Downloaded Tracks</h4>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Download tracks for offline listening. Downloaded tracks will appear here.
                </p>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="space-y-2 pr-4">
                  {cachedTracks.map(renderCachedTrack)}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
