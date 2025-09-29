

'use client';

import { useEffect, useState } from 'react';

interface ServiceWorkerState {
  isRegistered: boolean;
  isSupported: boolean;
  registration: ServiceWorkerRegistration | null;
  error: string | null;
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isRegistered: false,
    isSupported: false,
    registration: null,
    error: null
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      setState(prev => ({
        ...prev,
        isSupported: false,
        error: 'Service Workers not supported in this browser'
      }));
      return;
    }

    setState(prev => ({ ...prev, isSupported: true }));

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        setState(prev => ({
          ...prev,
          isRegistered: true,
          registration,
          error: null
        }));

        console.log('Service Worker registered successfully:', registration);

        // Handle updates
        registration.addEventListener('updatefound', () => {
          console.log('New Service Worker version available');
        });

      } catch (error) {
        console.error('Service Worker registration failed:', error);
        setState(prev => ({
          ...prev,
          isRegistered: false,
          error: error instanceof Error ? error.message : 'Registration failed'
        }));
      }
    };

    registerServiceWorker();

    // Listen for service worker messages
    const handleMessage = (event: MessageEvent) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'TRACK_CHANGED':
          console.log('SW: Track changed', data);
          break;
        case 'PLAYBACK_STATE_CHANGED':
          console.log('SW: Playback state changed', data);
          break;
        case 'NEXT_TRACK_REQUESTED':
          console.log('SW: Next track requested');
          // Emit custom event for music player to handle
          window.dispatchEvent(new CustomEvent('sw-next-track'));
          break;
        case 'PREVIOUS_TRACK_REQUESTED':
          console.log('SW: Previous track requested');
          window.dispatchEvent(new CustomEvent('sw-previous-track'));
          break;
        case 'SEEK_REQUESTED':
          console.log('SW: Seek requested', data);
          window.dispatchEvent(new CustomEvent('sw-seek', { detail: data }));
          break;
        case 'SEEK_BACKWARD_REQUESTED':
          console.log('SW: Seek backward requested', data);
          window.dispatchEvent(new CustomEvent('sw-seek-backward', { detail: data }));
          break;
        case 'SEEK_FORWARD_REQUESTED':
          console.log('SW: Seek forward requested', data);
          window.dispatchEvent(new CustomEvent('sw-seek-forward', { detail: data }));
          break;
        default:
          console.log('SW: Unknown message type', type, data);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  // Send message to service worker
  const sendMessage = (type: string, data?: any) => {
    if (state.registration && state.registration.active) {
      state.registration.active.postMessage({ type, data });
    }
  };

  return {
    ...state,
    sendMessage
  };
}

