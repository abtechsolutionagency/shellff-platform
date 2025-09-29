
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Download, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { offlineCache } from '@/lib/offline-cache';
import { Track } from '@/contexts/MusicPlayerContext';

interface DownloadButtonProps {
  track: Track;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  showText?: boolean;
  className?: string;
}

export function DownloadButton({ 
  track, 
  variant = 'ghost', 
  size = 'sm',
  showText = false,
  className = ''
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Check if track is cached
  const checkCachedStatus = useCallback(async () => {
    const cached = await offlineCache.isTrackCached(track.id);
    setIsCached(cached);
  }, [track.id]);

  // Subscribe to download progress
  useEffect(() => {
    const unsubscribe = offlineCache.onProgressUpdate((progress) => {
      const trackProgress = progress.get(track.id);
      if (trackProgress) {
        setIsDownloading(trackProgress.status === 'downloading');
        setDownloadProgress(trackProgress.progress);
        setError(trackProgress.error || null);
        
        if (trackProgress.status === 'completed') {
          setIsCached(true);
          setIsDownloading(false);
        }
      }
    });

    return unsubscribe;
  }, [track.id]);

  // Check cached status on mount
  useEffect(() => {
    void checkCachedStatus();
  }, [checkCachedStatus]);

  const handleDownload = async () => {
    if (isDownloading || isCached) return;

    setIsDownloading(true);
    setError(null);
    
    try {
      const success = await offlineCache.downloadTrack(track);
      if (success) {
        setIsCached(true);
      }
    } catch (err) {
      console.error('Download failed:', err);
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRemove = async () => {
    if (!isCached) return;

    try {
      await offlineCache.removeCachedTrack(track.id);
      setIsCached(false);
    } catch (err) {
      console.error('Remove failed:', err);
    }
  };

  // Determine button content
  const getButtonContent = () => {
    if (error) {
      return (
        <>
          <AlertCircle className="h-4 w-4" />
          {showText && <span>Error</span>}
        </>
      );
    }

    if (isDownloading) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {showText && <span>{downloadProgress}%</span>}
        </>
      );
    }

    if (isCached) {
      return (
        <>
          <CheckCircle2 className="h-4 w-4" />
          {showText && <span>Downloaded</span>}
        </>
      );
    }

    return (
      <>
        <Download className="h-4 w-4" />
        {showText && <span>Download</span>}
      </>
    );
  };

  // Determine tooltip text
  const getTooltipText = () => {
    if (error) return `Download failed: ${error}`;
    if (isDownloading) return `Downloading... ${downloadProgress}%`;
    if (isCached) return 'Downloaded for offline playback - Click to remove';
    return 'Download for offline playback';
  };

  // Determine button styling
  const getButtonVariant = () => {
    if (error) return 'destructive';
    if (isCached) return 'default';
    return variant;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={getButtonVariant() as any}
            size={size}
            onClick={isCached ? handleRemove : handleDownload}
            disabled={isDownloading}
            className={className}
          >
            {getButtonContent()}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
