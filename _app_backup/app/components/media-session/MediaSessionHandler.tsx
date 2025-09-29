
'use client';

import { useEffect, useRef } from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';

interface MediaSessionHandler {}

export function MediaSessionHandler(): null {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    nextTrack,
    previousTrack,
    togglePlay,
    seekTo,
    volume
  } = useMusicPlayer();

  const serviceWorkerRef = useRef<ServiceWorker | null>(null);

  // Initialize service worker communication
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        serviceWorkerRef.current = registration.active;
        
        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
        
        return () => {
          navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
        };
      });
    }
  }, []);

  // Handle messages from service worker
  const handleServiceWorkerMessage = (event: MessageEvent) => {
    const { type, data } = event.data;
    
    switch (type) {
      case 'NEXT_TRACK_REQUESTED':
        nextTrack();
        break;
      case 'PREVIOUS_TRACK_REQUESTED':
        previousTrack();
        break;
      case 'PLAYBACK_STATE_CHANGED':
        // Service worker is informing us of state change
        break;
      case 'SEEK_REQUESTED':
        if (data?.time !== undefined) {
          seekTo(data.time);
        }
        break;
      case 'SEEK_BACKWARD_REQUESTED':
        if (data?.time !== undefined) {
          seekTo(Math.max(0, currentTime - data.time));
        }
        break;
      case 'SEEK_FORWARD_REQUESTED':
        if (data?.time !== undefined) {
          seekTo(Math.min(duration, currentTime + data.time));
        }
        break;
      default:
        console.log('[MediaSession] Unknown message from SW:', type);
    }
  };

  // Send message to service worker
  const sendToServiceWorker = (type: string, data?: any) => {
    if (serviceWorkerRef.current) {
      serviceWorkerRef.current.postMessage({ type, data });
    }
  };

  // Update service worker when track changes
  useEffect(() => {
    if (currentTrack) {
      sendToServiceWorker('PLAY_TRACK', currentTrack);
      updateNativeMediaSession();
    } else {
      sendToServiceWorker('STOP_TRACK');
      clearNativeMediaSession();
    }
  }, [currentTrack]);

  // Update service worker when playback state changes
  useEffect(() => {
    if (currentTrack) {
      if (isPlaying) {
        sendToServiceWorker('RESUME_TRACK');
      } else {
        sendToServiceWorker('PAUSE_TRACK');
      }
      updateNativeMediaSessionPlaybackState();
    }
  }, [isPlaying, currentTrack]);

  // Update native Media Session API (fallback for when service worker is not available)
  const updateNativeMediaSession = () => {
    if (!currentTrack || !('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: currentTrack.albumTitle || 'Unknown Album',
      artwork: currentTrack.imageUrl ? [
        { src: currentTrack.imageUrl, sizes: '96x96', type: 'image/png' },
        { src: currentTrack.imageUrl, sizes: '128x128', type: 'image/png' },
        { src: currentTrack.imageUrl, sizes: '192x192', type: 'image/png' },
        { src: currentTrack.imageUrl, sizes: '256x256', type: 'image/png' },
        { src: currentTrack.imageUrl, sizes: '384x384', type: 'image/png' },
        { src: currentTrack.imageUrl, sizes: '512x512', type: 'image/png' },
      ] : []
    });

    // Set up action handlers for media keys and lock screen controls
    navigator.mediaSession.setActionHandler('play', async () => {
      await togglePlay();
    });

    navigator.mediaSession.setActionHandler('pause', async () => {
      await togglePlay();
    });

    navigator.mediaSession.setActionHandler('previoustrack', async () => {
      await previousTrack();
    });

    navigator.mediaSession.setActionHandler('nexttrack', async () => {
      await nextTrack();
    });

    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      const skipTime = details.seekTime || 10;
      seekTo(Math.max(0, currentTime - skipTime));
    });

    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      const skipTime = details.seekTime || 10;
      seekTo(Math.min(duration, currentTime + skipTime));
    });

    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        seekTo(details.seekTime);
      }
    });

    // Update position state for lock screen scrubber
    updateMediaSessionPositionState();
  };

  const updateNativeMediaSessionPlaybackState = () => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  };

  const updateMediaSessionPositionState = () => {
    if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration || 0,
          playbackRate: 1,
          position: currentTime || 0,
        });
      } catch (error) {
        console.warn('[MediaSession] Failed to set position state:', error);
      }
    }
  };

  const clearNativeMediaSession = () => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
      
      // Clear action handlers
      const actions = ['play', 'pause', 'previoustrack', 'nexttrack', 'seekbackward', 'seekforward', 'seekto'];
      actions.forEach(action => {
        try {
          navigator.mediaSession.setActionHandler(action as any, null);
        } catch (error) {
          console.warn(`[MediaSession] Failed to clear ${action} handler:`, error);
        }
      });
    }
  };

  // Update position state periodically when playing
  useEffect(() => {
    if (isPlaying && currentTrack && duration > 0) {
      const interval = setInterval(() => {
        updateMediaSessionPositionState();
      }, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }
  }, [isPlaying, currentTrack, duration, currentTime]);

  // Register for background sync when app goes offline
  useEffect(() => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        // Register for background sync when playing
        if (isPlaying && currentTrack && (registration as any).sync) {
          (registration as any).sync.register('background-audio-sync').catch((error: any) => {
            console.warn('[MediaSession] Failed to register background sync:', error);
          });
        }
      });
    }
  }, [isPlaying, currentTrack]);

  // Handle visibility change to maintain playback
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App went to background, ensure service worker knows about current state
        if (currentTrack && isPlaying) {
          sendToServiceWorker('PLAY_TRACK', currentTrack);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentTrack, isPlaying]);

  // Wake lock for preventing screen sleep during playback (optional)
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && isPlaying) {
          wakeLock = await navigator.wakeLock.request('screen');
          console.log('[MediaSession] Screen wake lock acquired');
        }
      } catch (error) {
        console.warn('[MediaSession] Failed to acquire wake lock:', error);
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLock) {
        await wakeLock.release();
        wakeLock = null;
        console.log('[MediaSession] Screen wake lock released');
      }
    };

    if (isPlaying && currentTrack) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    return () => {
      releaseWakeLock();
    };
  }, [isPlaying, currentTrack]);

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentTrack && isPlaying) {
        sendToServiceWorker('PAUSE_TRACK');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentTrack, isPlaying]);

  return null; // This is a headless component
}
