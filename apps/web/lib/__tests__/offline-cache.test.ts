import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { OfflineCache } from '../offline-cache';
import { subscribeToAnalytics } from '../analytics';
import type { Track } from '@/contexts/MusicPlayerContext';

describe('OfflineCache analytics integration', () => {
  const track: Track = {
    id: 'track-1',
    title: 'Aurora Skies',
    artist: 'Demo Artist',
    duration: 180,
    audioUrl: undefined,
  };

  let cache: OfflineCache;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (typeof input === 'string' && input === '/api/downloads/bundles') {
        const payload = {
          bundle: {
            id: 'bundle-1',
            status: 'READY',
            releaseId: 'release-1',
            requestedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 1000).toISOString(),
          },
          assets: [
            {
              id: 'asset-1',
              trackId: track.id,
              format: 'MP3',
              quality: '320kbps',
              sizeBytes: 1024,
              downloadUrl: 'https://cdn.shellff.dev/audio/demo.mp3',
              status: 'READY',
            },
          ],
        };
        return new Response(JSON.stringify(payload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response('audio-data', { status: 200 });
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    cache = new OfflineCache();

    const store = {
      put: vi.fn().mockImplementation(() => {
        const request = {
          onsuccess: undefined as undefined | (() => void),
          onerror: undefined as undefined | (() => void),
        };

        queueMicrotask(() => {
          request.onsuccess?.();
        });

        return request;
      }),
      get: vi.fn().mockImplementation(() => {
        const request = {
          onsuccess: undefined as undefined | (() => void),
          onerror: undefined as undefined | (() => void),
          result: undefined as unknown,
        };

        queueMicrotask(() => {
          request.onsuccess?.();
        });

        return request;
      }),
    };

    const transaction = {
      objectStore: vi.fn().mockReturnValue(store),
    };

    Object.assign(cache as unknown as { db: unknown }, {
      db: {
        transaction: vi.fn().mockReturnValue(transaction),
      },
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('emits analytics events for request, start, and completion', async () => {
    const events: Array<{ event: string; payload: Record<string, unknown> | undefined }> = [];
    const unsubscribe = subscribeToAnalytics((event, payload) => {
      events.push({ event, payload: payload as Record<string, unknown> | undefined });
    });

    const result = await cache.downloadTrack(track);

    unsubscribe();

    expect(result).toBe(true);
    expect(events.map((entry) => entry.event)).toEqual(
      expect.arrayContaining([
        'offline.download.requested',
        'offline.download.started',
        'offline.download.completed',
      ]),
    );
    expect(fetchMock).toHaveBeenCalledWith('/api/downloads/bundles', expect.anything());
  });
});
