
const CACHE_NAME = 'shellff-v1';
const STATIC_CACHE = 'shellff-static-v1';
const RUNTIME_CACHE = 'shellff-runtime-v1';
const AUDIO_CACHE = 'shellff-audio-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/auth/login',
  '/auth/register',
  '/offline',
  '/manifest.json'
];

// Global variables for audio state
let currentTrack = null;
let isPlaying = false;
let audioElement = null;

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== STATIC_CACHE && name !== RUNTIME_CACHE && name !== AUDIO_CACHE)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Message handler for audio control
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'PLAY_TRACK':
      handlePlayTrack(data);
      break;
    case 'PAUSE_TRACK':
      handlePauseTrack();
      break;
    case 'RESUME_TRACK':
      handleResumeTrack();
      break;
    case 'STOP_TRACK':
      handleStopTrack();
      break;
    case 'NEXT_TRACK':
      handleNextTrack();
      break;
    case 'PREVIOUS_TRACK':
      handlePreviousTrack();
      break;
    case 'SEEK_TO':
      handleSeekTo(data.time);
      break;
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Audio control handlers
function handlePlayTrack(track) {
  currentTrack = track;
  isPlaying = true;
  updateMediaSession(track);
  notifyClients('TRACK_CHANGED', track);
  console.log('[SW] Playing track:', track.title);
}

function handlePauseTrack() {
  isPlaying = false;
  updateMediaSessionPlaybackState('paused');
  notifyClients('PLAYBACK_STATE_CHANGED', { isPlaying: false });
  console.log('[SW] Track paused');
}

function handleResumeTrack() {
  isPlaying = true;
  updateMediaSessionPlaybackState('playing');
  notifyClients('PLAYBACK_STATE_CHANGED', { isPlaying: true });
  console.log('[SW] Track resumed');
}

function handleStopTrack() {
  currentTrack = null;
  isPlaying = false;
  updateMediaSessionPlaybackState('none');
  notifyClients('PLAYBACK_STATE_CHANGED', { isPlaying: false });
  console.log('[SW] Track stopped');
}

function handleNextTrack() {
  notifyClients('NEXT_TRACK_REQUESTED');
  console.log('[SW] Next track requested');
}

function handlePreviousTrack() {
  notifyClients('PREVIOUS_TRACK_REQUESTED');
  console.log('[SW] Previous track requested');
}

function handleSeekTo(time) {
  notifyClients('SEEK_REQUESTED', { time });
  console.log('[SW] Seek requested:', time);
}

// Update Media Session API
function updateMediaSession(track) {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.albumTitle || 'Unknown Album',
      artwork: track.imageUrl ? [
        { src: track.imageUrl, sizes: '96x96', type: 'image/png' },
        { src: track.imageUrl, sizes: '128x128', type: 'image/png' },
        { src: track.imageUrl, sizes: '192x192', type: 'image/png' },
        { src: track.imageUrl, sizes: '256x256', type: 'image/png' },
        { src: track.imageUrl, sizes: '384x384', type: 'image/png' },
        { src: track.imageUrl, sizes: '512x512', type: 'image/png' },
      ] : []
    });

    // Set up action handlers
    navigator.mediaSession.setActionHandler('play', () => {
      handleResumeTrack();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      handlePauseTrack();
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      handlePreviousTrack();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      handleNextTrack();
    });

    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      const time = Math.max(0, (details.seekTime || 10));
      notifyClients('SEEK_BACKWARD_REQUESTED', { time });
    });

    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      const time = details.seekTime || 10;
      notifyClients('SEEK_FORWARD_REQUESTED', { time });
    });

    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime) {
        handleSeekTo(details.seekTime);
      }
    });

    // Set initial playback state
    updateMediaSessionPlaybackState('playing');
  }
}

function updateMediaSessionPlaybackState(state) {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = state;
  }
}

// Notify all clients
function notifyClients(type, data = null) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type, data });
    });
  });
}

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-audio-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

function handleBackgroundSync() {
  console.log('[SW] Background sync for audio');
  // Handle any pending audio operations
  return Promise.resolve();
}

// Push notifications for audio controls (optional)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    if (data.type === 'audio_control') {
      // Handle audio control via push notification
      console.log('[SW] Audio control via push:', data);
    }
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'play') {
    handleResumeTrack();
  } else if (event.action === 'pause') {
    handlePauseTrack();
  } else if (event.action === 'next') {
    handleNextTrack();
  } else if (event.action === 'previous') {
    handlePreviousTrack();
  } else {
    // Default action - open the app
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        if (clients.length > 0) {
          clients[0].focus();
        } else {
          self.clients.openWindow('/');
        }
      })
    );
  }
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and external URLs
  if (request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return;
  }

  // Handle audio streaming requests with special caching strategy
  if (url.pathname.includes('/api/tracks/') && url.pathname.includes('/stream')) {
    event.respondWith(
      caches.open(AUDIO_CACHE)
        .then((cache) => {
          return cache.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                console.log('[SW] Serving audio from cache');
                return cachedResponse;
              }
              
              return fetch(request)
                .then((response) => {
                  if (response.status === 200 && response.headers.get('content-type')?.includes('audio')) {
                    // Cache audio responses
                    const responseClone = response.clone();
                    cache.put(request, responseClone);
                  }
                  return response;
                });
            });
        })
    );
    return;
  }

  // Handle navigation requests (pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request)
            .then((response) => {
              // Cache successful responses
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(RUNTIME_CACHE)
                  .then((cache) => cache.put(request, responseClone));
              }
              return response;
            })
            .catch(() => {
              // Serve offline fallback for navigation requests
              return caches.match('/offline');
            });
        })
    );
    return;
  }

  // Handle API requests with cache-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // Serve from cache, update cache in background
            fetch(request)
              .then((response) => {
                if (response.status === 200) {
                  const responseClone = response.clone();
                  caches.open(RUNTIME_CACHE)
                    .then((cache) => cache.put(request, responseClone));
                }
              })
              .catch(() => {}); // Ignore background fetch errors
            
            return cachedResponse;
          }
          
          // Not in cache, fetch from network
          return fetch(request)
            .then((response) => {
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(RUNTIME_CACHE)
                  .then((cache) => cache.put(request, responseClone));
              }
              return response;
            })
            .catch(() => {
              // Return a basic error response for failed API calls
              return new Response(
                JSON.stringify({ error: 'Offline - This feature requires internet connection' }),
                {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
        })
    );
    return;
  }

  // Handle static assets (images, CSS, JS)
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(request)
          .then((response) => {
            // Only cache successful responses
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(RUNTIME_CACHE)
                .then((cache) => cache.put(request, responseClone));
            }
            return response;
          });
      })
  );
});
