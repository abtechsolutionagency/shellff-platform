

'use client';

import { useState, useEffect } from 'react';
import { 
  Download, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Loader, 
  HardDrive,
  X,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import Image from 'next/image';
import { useMusicPlayer, Track } from '@/contexts/MusicPlayerContext';
import { offlineCache } from '@/lib/offline-cache';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';

interface DownloadProgress {
  trackId: string;
  progress: number;
  status: 'downloading' | 'completed' | 'error' | 'paused';
  error?: string;
}

interface CachedTrack {
  id: string;
  track: Track;
  audioBlob: Blob;
  imageBlob?: Blob;
  downloadDate: number;
  lastAccessed: number;
  size: number;
}

interface OfflineDownloadManagerProps {
  track?: Track;
  children?: React.ReactNode;
}

export function OfflineDownloadManager({ track, children }: OfflineDownloadManagerProps) {
  const { playTrack, currentTrack, isPlaying } = useMusicPlayer();
  
  const [isOpen, setIsOpen] = useState(false);
  const [cachedTracks, setCachedTracks] = useState<CachedTrack[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Map<string, DownloadProgress>>(new Map());
  const [cacheStats, setCacheStats] = useState<{ count: number; totalSize: number; oldestDate?: number }>({ count: 0, totalSize: 0, oldestDate: undefined });
  const [isLoading, setIsLoading] = useState(false);

  // Load cached tracks and stats
  const loadCacheData = async () => {
    setIsLoading(true);
    try {
      const [tracks, stats] = await Promise.all([
        offlineCache.getAllCachedTracks(),
        offlineCache.getCacheStats()
      ]);
      setCachedTracks(tracks);
      setCacheStats(stats);
    } catch (error) {
      console.error('Failed to load cache data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to download progress updates
  useEffect(() => {
    const unsubscribe = offlineCache.onProgressUpdate((progress) => {
      setDownloadProgress(progress);
      // Reload cache data when downloads complete
      if (Array.from(progress.values()).some(p => p.status === 'completed')) {
        setTimeout(loadCacheData, 1000);
      }
    });

    return unsubscribe;
  }, []);

  // Load data when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadCacheData();
    }
  }, [isOpen]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const handleDownloadTrack = async (trackToDownload: Track) => {
    try {
      const success = await offlineCache.downloadTrack(trackToDownload);
      if (success) {
        console.log(`Downloaded: ${trackToDownload.title}`);
      }
    } catch (error) {
      console.error('Failed to download track:', error);
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    try {
      const success = await offlineCache.removeCachedTrack(trackId);
      if (success) {
        setCachedTracks(prev => prev.filter(t => t.id !== trackId));
        setCacheStats(prev => ({
          ...prev,
          count: prev.count - 1
        }));
        console.log('Track removed from offline cache');
      }
    } catch (error) {
      console.error('Failed to remove track:', error);
    }
  };

  const handleClearCache = async () => {
    try {
      const success = await offlineCache.clearCache();
      if (success) {
        setCachedTracks([]);
        setCacheStats({ count: 0, totalSize: 0, oldestDate: undefined });
        console.log('Cache cleared');
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  const handlePlayOfflineTrack = (cachedTrack: CachedTrack) => {
    playTrack(cachedTrack.track);
  };

  const isTrackCached = (trackId: string) => {
    return cachedTracks.some(t => t.id === trackId);
  };

  const isTrackDownloading = (trackId: string) => {
    const progress = downloadProgress.get(trackId);
    return progress?.status === 'downloading';
  };

  const getDownloadProgress = (trackId: string) => {
    return downloadProgress.get(trackId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            <Download className="w-5 h-5" />
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] bg-[#1a1a1a] border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3 text-white">
            <HardDrive className="w-6 h-6 text-[#9B5DE5]" />
            <span>Offline Downloads</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col space-y-6">
          {/* Quick Download Section (if track prop provided) */}
          {track && (
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <div className="flex items-center space-x-4">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                  {track.imageUrl ? (
                    <Image
                      src={track.imageUrl}
                      alt={track.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#9B5DE5] to-[#00F5D4] flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {track.title.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <p className="text-white font-medium">{track.title}</p>
                  <p className="text-gray-400 text-sm">{track.artist}</p>
                </div>
                
                {isTrackCached(track.id) ? (
                  <div className="flex items-center space-x-2 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm">Downloaded</span>
                  </div>
                ) : isTrackDownloading(track.id) ? (
                  <div className="flex items-center space-x-2">
                    <Loader className="w-5 h-5 animate-spin text-[#9B5DE5]" />
                    <div className="w-24">
                      <Progress 
                        value={getDownloadProgress(track.id)?.progress || 0} 
                        className="h-2"
                      />
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleDownloadTrack(track)}
                    className="bg-[#9B5DE5] hover:bg-[#00F5D4] text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Cache Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
              <div className="flex items-center space-x-2 mb-2">
                <HardDrive className="w-5 h-5 text-[#9B5DE5]" />
                <span className="text-gray-400 text-sm">Cached Tracks</span>
              </div>
              <p className="text-2xl font-bold text-white">{cacheStats.count}</p>
            </div>
            
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
              <div className="flex items-center space-x-2 mb-2">
                <Download className="w-5 h-5 text-[#00F5D4]" />
                <span className="text-gray-400 text-sm">Storage Used</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatFileSize(cacheStats.totalSize)}</p>
            </div>
            
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
              <div className="flex items-center space-x-2 mb-2">
                <RotateCcw className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-400 text-sm">Active Downloads</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {Array.from(downloadProgress.values()).filter(p => p.status === 'downloading').length}
              </p>
            </div>
          </div>

          {/* Active Downloads */}
          {downloadProgress.size > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Active Downloads</h3>
              </div>
              
              {Array.from(downloadProgress.entries()).map(([trackId, progress]) => {
                const track = cachedTracks.find(t => t.id === trackId)?.track;
                if (!track) return null;
                
                return (
                  <div key={trackId} className="flex items-center space-x-4 p-3 bg-gray-900/30 rounded-lg">
                    <div className="relative w-10 h-10 rounded bg-gray-800 flex-shrink-0">
                      {track.imageUrl ? (
                        <Image
                          src={track.imageUrl}
                          alt={track.title}
                          fill
                          className="object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#9B5DE5] to-[#00F5D4] flex items-center justify-center rounded">
                          <span className="text-white text-xs font-bold">
                            {track.title.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm truncate">{track.title}</p>
                      <p className="text-gray-400 text-xs truncate">{track.artist}</p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {progress.status === 'downloading' && (
                        <>
                          <div className="w-24">
                            <Progress value={progress.progress} className="h-2" />
                          </div>
                          <span className="text-xs text-gray-400 font-mono">
                            {progress.progress.toFixed(0)}%
                          </span>
                        </>
                      )}
                      
                      {progress.status === 'error' && (
                        <div className="flex items-center space-x-2 text-red-400">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-xs">Error</span>
                        </div>
                      )}
                      
                      {progress.status === 'completed' && (
                        <div className="flex items-center space-x-2 text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs">Complete</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Downloaded Tracks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Downloaded Tracks</h3>
              {cachedTracks.length > 0 && (
                <Button
                  onClick={handleClearCache}
                  variant="outline"
                  size="sm"
                  className="text-red-400 border-red-400 hover:bg-red-400/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
            
            <ScrollArea className="max-h-96">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-6 h-6 animate-spin text-[#9B5DE5]" />
                </div>
              ) : cachedTracks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Download className="w-12 h-12 mb-4 opacity-50" />
                  <p className="text-center">No tracks downloaded for offline use</p>
                  <p className="text-xs text-center mt-1">
                    Download tracks to listen without internet connection
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cachedTracks.map((cachedTrack) => {
                    const isCurrentTrack = currentTrack?.id === cachedTrack.track.id;
                    
                    return (
                      <div
                        key={cachedTrack.id}
                        className={cn(
                          "flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-800/50 transition-colors duration-200 group cursor-pointer",
                          isCurrentTrack && "bg-[#9B5DE5]/10 border border-[#9B5DE5]/20"
                        )}
                        onClick={() => handlePlayOfflineTrack(cachedTrack)}
                      >
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                          {cachedTrack.track.imageUrl ? (
                            <Image
                              src={cachedTrack.track.imageUrl}
                              alt={cachedTrack.track.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#9B5DE5] to-[#00F5D4] flex items-center justify-center">
                              <span className="text-white text-sm font-bold">
                                {cachedTrack.track.title.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          
                          {/* Play indicator */}
                          {isCurrentTrack && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              {isPlaying ? (
                                <Pause className="w-5 h-5 text-[#9B5DE5]" />
                              ) : (
                                <Play className="w-5 h-5 text-[#9B5DE5]" />
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "font-medium truncate",
                            isCurrentTrack ? "text-[#9B5DE5]" : "text-white"
                          )}>
                            {cachedTrack.track.title}
                          </p>
                          <p className="text-gray-400 text-sm truncate">
                            {cachedTrack.track.artist}
                            {cachedTrack.track.albumTitle && ` • ${cachedTrack.track.albumTitle}`}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-gray-500">
                              Downloaded {formatDate(cachedTrack.downloadDate)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatFileSize(cachedTrack.size)}
                            </span>
                          </div>
                        </div>
                        
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveTrack(cachedTrack.id);
                          }}
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 text-gray-400 hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Standalone download button for individual tracks
export function TrackDownloadButton({ track }: { track: Track }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCached, setIsCached] = useState(false);

  useEffect(() => {
    // Check if track is already cached
    offlineCache.isTrackCached(track.id).then(setIsCached);
    
    // Subscribe to download progress
    const unsubscribe = offlineCache.onProgressUpdate((progressMap) => {
      const progress = progressMap.get(track.id);
      if (progress) {
        setIsDownloading(progress.status === 'downloading');
        
        if (progress.status === 'completed') {
          setIsCached(true);
          setIsDownloading(false);
        }
      }
    });

    return unsubscribe;
  }, [track.id]);

  const handleDownload = async () => {
    if (isCached || isDownloading) return;
    
    try {
      await offlineCache.downloadTrack(track);
    } catch (error) {
      console.error('Failed to download track:', error);
    }
  };

  if (isCached) {
    return (
      <Button variant="ghost" size="sm" className="text-green-400 cursor-default">
        <CheckCircle className="w-4 h-4" />
      </Button>
    );
  }

  if (isDownloading) {
    return (
      <Button variant="ghost" size="sm" className="text-[#9B5DE5] cursor-default">
        <Loader className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      onClick={handleDownload}
      variant="ghost"
      size="sm"
      className="text-gray-400 hover:text-[#9B5DE5] transition-colors duration-200"
    >
      <Download className="w-4 h-4" />
    </Button>
  );
}

