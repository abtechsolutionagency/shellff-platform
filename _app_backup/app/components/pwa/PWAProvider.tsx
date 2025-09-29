
"use client";

import { useEffect } from "react";

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          });
          
          console.log('Service Worker registered successfully:', registration);

          // Handle service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, inform user
                  console.log('New content available, please refresh.');
                  
                  // You could show a toast notification here
                  if (window.confirm('New version available! Refresh to update?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });

          // Handle service worker messages
          navigator.serviceWorker.addEventListener('message', (event) => {
            console.log('Message from service worker:', event.data);
          });

        } catch (error) {
          console.log('Service Worker registration failed:', error);
        }
      });
    }

    // Handle online/offline status
    const handleOnline = () => {
      console.log('App is online');
      document.body.classList.remove('offline');
      document.body.classList.add('online');
    };

    const handleOffline = () => {
      console.log('App is offline');
      document.body.classList.remove('online');
      document.body.classList.add('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial status
    if (navigator.onLine) {
      handleOnline();
    } else {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return <>{children}</>;
}
