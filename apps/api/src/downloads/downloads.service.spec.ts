import { describe, expect, it, vi } from 'vitest';

import { DownloadsService } from './downloads.service';
import type { AnalyticsService } from '../analytics/analytics.service';
import type { AuditService } from '../audit/audit.service';
import type { PrismaService } from '../prisma/prisma.service';

describe('DownloadsService', () => {
  function createService() {
    const prisma = {
      releaseAccess: { findFirst: vi.fn() },
      releaseTrack: { findMany: vi.fn() },
      downloadBundle: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
      downloadAsset: { create: vi.fn(), update: vi.fn() },
      $transaction: vi.fn(),
    } as unknown as PrismaService;

    const audit = { recordEvent: vi.fn(), latest: vi.fn() } as unknown as AuditService;
    const analytics = { track: vi.fn() } as unknown as AnalyticsService;

    const service = new DownloadsService(prisma, audit, analytics);

    return { prisma, audit, analytics, service };
  }

  it('creates bundles and records analytics events', async () => {
    const { prisma, service, audit, analytics } = createService();

    (prisma.releaseTrack.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 'track-1',
        releaseId: 'release-1',
        duration: 180,
        position: 1,
        audioUrl: 'https://cdn.shellff.dev/audio/track-1.mp3',
      },
    ]);

    (prisma.releaseAccess.findFirst as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'access-1' });

    const tx = {
      downloadBundle: {
        create: vi.fn().mockResolvedValue({ id: 'bundle-1', releaseId: 'release-1' }),
        update: vi.fn().mockResolvedValue({
          id: 'bundle-1',
          releaseId: 'release-1',
          status: 'READY',
          requestedAt: new Date(),
          completedAt: new Date(),
          expiresAt: new Date(),
          assets: [
            {
              id: 'asset-1',
              trackId: 'track-1',
              format: 'MP3',
              quality: '320kbps',
              sizeBytes: 1000,
              downloadUrl: 'https://cdn.shellff.dev/audio/track-1.mp3',
              status: 'READY',
            },
          ],
        }),
      },
      downloadAsset: {
        create: vi.fn().mockResolvedValue({ id: 'asset-1', trackId: 'track-1' }),
        update: vi.fn().mockResolvedValue({ id: 'asset-1', trackId: 'track-1' }),
      },
    };

    (prisma.$transaction as unknown as ReturnType<typeof vi.fn>).mockImplementation(async (callback) =>
      callback(tx as unknown as PrismaService),
    );

    const result = await service.requestBundle('user-1', { trackIds: ['track-1'] });

    expect(result.bundle.id).toBe('bundle-1');
    expect(audit.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'downloads.bundle.ready', target: 'bundle-1' }),
    );
    expect(analytics.track).toHaveBeenCalledWith(
      'downloads.bundle.requested',
      expect.objectContaining({ trackIds: ['track-1'] }),
      expect.objectContaining({ userId: 'user-1' }),
    );
    expect(analytics.track).toHaveBeenCalledWith(
      'downloads.bundle.ready',
      expect.objectContaining({ trackIds: ['track-1'] }),
      expect.objectContaining({ userId: 'user-1', target: 'bundle-1' }),
    );
  });
});
