
// Offline cache management for audio tracks
import { Track } from '@/contexts/MusicPlayerContext';
import { trackAnalyticsEvent } from './analytics';

interface DownloadBundleResponse {
  bundle: {
    id: string;
    status: string;
    releaseId: string;
    requestedAt: string;
    completedAt?: string;
    expiresAt?: string;
  };
  assets: Array<{
    id: string;
    trackId: string;
    format: string;
    quality?: string;
    sizeBytes?: number;
    downloadUrl?: string;
    status: string;
  }>;
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

interface DownloadProgress {
  trackId: string;
  progress: number; // 0-100
  status: 'downloading' | 'completed' | 'error' | 'paused';
  error?: string;
}

export class OfflineCache {
  private dbName = 'shellff-offline-cache';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private downloadProgress = new Map<string, DownloadProgress>();
  private listeners: Array<(progress: Map<string, DownloadProgress>) => void> = [];

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    if (typeof window === 'undefined') return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create tracks store
        if (!db.objectStoreNames.contains('tracks')) {
          const trackStore = db.createObjectStore('tracks', { keyPath: 'id' });
          trackStore.createIndex('downloadDate', 'downloadDate');
          trackStore.createIndex('lastAccessed', 'lastAccessed');
        }
      };
    });
  }

  // Subscribe to download progress updates
  onProgressUpdate(callback: (progress: Map<string, DownloadProgress>) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(new Map(this.downloadProgress)));
  }

  // Check if track is cached
  async isTrackCached(trackId: string): Promise<boolean> {
    if (!this.db) await this.initDB();
    if (!this.db) return false;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['tracks'], 'readonly');
      const store = transaction.objectStore('tracks');
      const request = store.get(trackId);

      request.onsuccess = () => resolve(!!request.result);
      request.onerror = () => resolve(false);
    });
  }

  // Get cached track
  async getCachedTrack(trackId: string): Promise<CachedTrack | null> {
    if (!this.db) await this.initDB();
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['tracks'], 'readwrite');
      const store = transaction.objectStore('tracks');
      const request = store.get(trackId);

      request.onsuccess = () => {
        const result = request.result as CachedTrack | null;
        if (result) {
          // Update last accessed
          result.lastAccessed = Date.now();
          store.put(result);
        }
        resolve(result);
      };
      request.onerror = () => resolve(null);
    });
  }

  // Download track for offline use
  async downloadTrack(track: Track): Promise<boolean> {
    if (!this.db) await this.initDB();
    if (!this.db) return false;

    // Check if already downloading or cached
    if (this.downloadProgress.has(track.id) || await this.isTrackCached(track.id)) {
      return true;
    }

    // Set initial progress
    this.downloadProgress.set(track.id, {
      trackId: track.id,
      progress: 0,
      status: 'downloading'
    });
    this.notifyListeners();

    try {
      // Download audio
      trackAnalyticsEvent('offline.download.requested', {
        trackId: track.id,
        releaseId: track.albumId ?? track.albumTitle ?? null,
      });

      const { asset, bundle } = await this.requestDownloadAsset(track);

      trackAnalyticsEvent('offline.download.started', {
        trackId: track.id,
        bundleId: bundle.id,
        format: asset.format,
      });

      const audioResponse = await fetch(asset.downloadUrl);

      if (!audioResponse.ok) throw new Error('Failed to download audio');

      const audioBlob = await audioResponse.blob();
      
      // Update progress
      this.downloadProgress.set(track.id, {
        trackId: track.id,
        progress: 75,
        status: 'downloading'
      });
      this.notifyListeners();

      // Download image if available
      let imageBlob: Blob | undefined;
      if (track.imageUrl) {
        try {
          const imageResponse = await fetch(track.imageUrl);
          if (imageResponse.ok) {
            imageBlob = await imageResponse.blob();
          }
        } catch (error) {
          console.warn('Failed to download track image:', error);
        }
      }

      // Store in IndexedDB
      const cachedTrack: CachedTrack = {
        id: track.id,
        track,
        audioBlob,
        imageBlob,
        downloadDate: Date.now(),
        lastAccessed: Date.now(),
        size: audioBlob.size + (imageBlob?.size || 0)
      };

      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction(['tracks'], 'readwrite');
        const store = transaction.objectStore('tracks');
        const request = store.put(cachedTrack);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      // Update progress to completed
      this.downloadProgress.set(track.id, {
        trackId: track.id,
        progress: 100,
        status: 'completed'
      });
      this.notifyListeners();

      // Remove from progress after a delay
      setTimeout(() => {
        this.downloadProgress.delete(track.id);
        this.notifyListeners();
      }, 2000);

      trackAnalyticsEvent('offline.download.completed', {
        trackId: track.id,
        bundleId: bundle.id,
        bytesStored: cachedTrack.size,
      });

      return true;
    } catch (error) {
      console.error('Failed to download track:', error);
      this.downloadProgress.set(track.id, {
        trackId: track.id,
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Download failed'
      });
      this.notifyListeners();
      trackAnalyticsEvent('offline.download.failed', {
        trackId: track.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  private async requestDownloadAsset(track: Track) {
    const response = await fetch('/api/downloads/bundles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trackIds: [track.id] }),
    });

    if (!response.ok) {
      throw new Error('Failed to request download bundle');
    }

    const payload = (await response.json()) as DownloadBundleResponse;
    const asset = payload.assets.find((item) => item.trackId === track.id && item.status === 'READY');

    if (!asset || !asset.downloadUrl) {
      throw new Error('Download asset not ready yet');
    }

    return { asset, bundle: payload.bundle };
  }

  // Remove cached track
  async removeCachedTrack(trackId: string): Promise<boolean> {
    if (!this.db) await this.initDB();
    if (!this.db) return false;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['tracks'], 'readwrite');
      const store = transaction.objectStore('tracks');
      const request = store.delete(trackId);

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  }

  // Get all cached tracks
  async getAllCachedTracks(): Promise<CachedTrack[]> {
    if (!this.db) await this.initDB();
    if (!this.db) return [];

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['tracks'], 'readonly');
      const store = transaction.objectStore('tracks');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }

  // Get cache statistics
  async getCacheStats(): Promise<{ count: number; totalSize: number; oldestDate?: number }> {
    const cachedTracks = await this.getAllCachedTracks();
    const totalSize = cachedTracks.reduce((sum, track) => sum + track.size, 0);
    const oldestDate = cachedTracks.length > 0 
      ? Math.min(...cachedTracks.map(track => track.downloadDate))
      : undefined;

    return {
      count: cachedTracks.length,
      totalSize,
      oldestDate
    };
  }

  // Clear all cached tracks
  async clearCache(): Promise<boolean> {
    if (!this.db) await this.initDB();
    if (!this.db) return false;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['tracks'], 'readwrite');
      const store = transaction.objectStore('tracks');
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  }

  // Create blob URL for cached audio
  createAudioURL(audioBlob: Blob): string {
    return URL.createObjectURL(audioBlob);
  }

  // Create blob URL for cached image
  createImageURL(imageBlob: Blob): string {
    return URL.createObjectURL(imageBlob);
  }

  // Get download progress for a specific track
  getDownloadProgress(trackId: string): DownloadProgress | null {
    return this.downloadProgress.get(trackId) || null;
  }

  // Get all current download progress
  getAllDownloadProgress(): Map<string, DownloadProgress> {
    return new Map(this.downloadProgress);
  }
}

// Global instance
export const offlineCache = new OfflineCache();
