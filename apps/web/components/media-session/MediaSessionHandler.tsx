'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';

export function MediaSessionHandler(): null {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    nextTrack,
    previousTrack,
    togglePlay,
    seekTo
  } = useMusicPlayer();

  const serviceWorkerRef = useRef<ServiceWorker | null>(null);

  const updateMediaSessionPositionState = useCallback(() => {
    if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration || 0,
          playbackRate: 1,
          position: currentTime || 0
        });
      } catch (error) {
        console.warn('[MediaSession] Failed to set position state:', error);
      }
    }
  }, [currentTime, duration]);

  const clearNativeMediaSession = useCallback(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';

      const actions = [
        'play',
        'pause',
        'previoustrack',
        'nexttrack',
        'seekbackward',
        'seekforward',
        'seekto'
      ];

      actions.forEach((action) => {
        try {
          navigator.mediaSession.setActionHandler(action as any, null);
        } catch (error) {
          console.warn('[MediaSession] Failed to clear handler:', action, error);
        }
      });
    }
  }, []);

  const sendToServiceWorker = useCallback((type: string, data?: unknown) => {
    if (serviceWorkerRef.current) {
      serviceWorkerRef.current.postMessage({ type, data });
    }
  }, []);

  const handleServiceWorkerMessage = useCallback(
    (event: MessageEvent) => {
      const payload = (event.data ?? {}) as { type?: string; data?: { time?: number } };
      const { type, data } = payload;

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
    },
    [currentTime, duration, nextTrack, previousTrack, seekTo]
  );

  const updateNativeMediaSession = useCallback(() => {
    if (!currentTrack || !('mediaSession' in navigator)) {
      return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: currentTrack.albumTitle || 'Unknown Album',
      artwork: currentTrack.imageUrl
        ? [
            { src: currentTrack.imageUrl, sizes: '96x96', type: 'image/png' },
            { src: currentTrack.imageUrl, sizes: '128x128', type: 'image/png' },
            { src: currentTrack.imageUrl, sizes: '192x192', type: 'image/png' },
            { src: currentTrack.imageUrl, sizes: '256x256', type: 'image/png' },
            { src: currentTrack.imageUrl, sizes: '384x384', type: 'image/png' },
            { src: currentTrack.imageUrl, sizes: '512x512', type: 'image/png' }
          ]
        : []
    });

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

    updateMediaSessionPositionState();
  }, [currentTime, currentTrack, duration, nextTrack, previousTrack, seekTo, togglePlay, updateMediaSessionPositionState]);

  const updateNativeMediaSessionPlaybackState = useCallback(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  useEffect(() => {
    let isActive = true;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          if (!isActive) {
            return;
          }

          serviceWorkerRef.current = registration.active;
          navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
        })
        .catch((error) => {
          console.warn('[MediaSession] Service worker not ready:', error);
        });
    }

    return () => {
      isActive = false;
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [handleServiceWorkerMessage]);

  useEffect(() => {
    if (currentTrack) {
      sendToServiceWorker('PLAY_TRACK', currentTrack);
      updateNativeMediaSession();
    } else {
      sendToServiceWorker('STOP_TRACK');
      clearNativeMediaSession();
    }
  }, [clearNativeMediaSession, currentTrack, sendToServiceWorker, updateNativeMediaSession]);

  useEffect(() => {
    if (!currentTrack) {
      return;
    }

    if (isPlaying) {
      sendToServiceWorker('RESUME_TRACK');
    } else {
      sendToServiceWorker('PAUSE_TRACK');
    }

    updateNativeMediaSessionPlaybackState();
  }, [currentTrack, isPlaying, sendToServiceWorker, updateNativeMediaSessionPlaybackState]);

  useEffect(() => {
    if (isPlaying && currentTrack && duration > 0) {
      const interval = setInterval(() => {
        updateMediaSessionPositionState();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [currentTrack, duration, isPlaying, updateMediaSessionPositionState]);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        if (isPlaying && currentTrack && (registration as any).sync) {
          (registration as any).sync.register('background-audio-sync').catch((error: unknown) => {
            console.warn('[MediaSession] Failed to register background sync:', error);
          });
        }
      });
    }
  }, [currentTrack, isPlaying, sendToServiceWorker]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && currentTrack && isPlaying) {
        sendToServiceWorker('PLAY_TRACK', currentTrack);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentTrack, isPlaying, sendToServiceWorker]);

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
      void releaseWakeLock();
    };
  }, [currentTrack, isPlaying]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentTrack && isPlaying) {
        sendToServiceWorker('PAUSE_TRACK');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentTrack, isPlaying, sendToServiceWorker]);

  return null;
}







