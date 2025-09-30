import { describe, expect, it, vi } from 'vitest';

import { CatalogService } from './catalog.service';
import type { AnalyticsService } from '../analytics/analytics.service';
import type { AuditService } from '../audit/audit.service';
import type { PrismaService } from '../prisma/prisma.service';

describe('CatalogService', () => {
  function createService(overrides: Partial<PrismaService> = {}) {
    const prisma = {
      release: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
      releaseTrack: { findMany: vi.fn() },
      $transaction: vi.fn(),
      ...overrides,
    } as unknown as PrismaService;

    const audit = { recordEvent: vi.fn(), latest: vi.fn() } as unknown as AuditService;
    const analytics = { track: vi.fn() } as unknown as AnalyticsService;

    const service = new CatalogService(prisma, audit, analytics);
    return { prisma, audit, analytics, service };
  }

  it('lists releases and records analytics events', async () => {
    const { prisma, service, audit, analytics } = createService();

    (prisma.$transaction as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      async (actions: unknown[]) => Promise.all(actions as Array<Promise<unknown>>),
    );

    (prisma.release.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 'rel-1',
        title: 'Midnight Reflections',
        description: 'demo',
        coverArt: null,
        releaseType: 'DIGITAL',
        creatorId: 'creator-1',
        creator: { id: 'creator-1', displayName: 'Creator', publicId: 'USR-CRE-001' },
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
        tracks: [
          { id: 'track-1', title: 'Aurora Skies', duration: 120, position: 1, audioUrl: 'https://example.com' },
        ],
      },
    ]);

    (prisma.release.count as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const result = await service.listReleases({ search: 'midnight' });

    expect(result.releases).toHaveLength(1);
    expect(audit.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'catalog.releases.listed' }),
    );
    expect(analytics.track).toHaveBeenCalledWith(
      'catalog.releases.listed',
      expect.objectContaining({ resultCount: 1 }),
      expect.objectContaining({ userId: null }),
    );
  });

  it('returns release data and records view analytics', async () => {
    const { prisma, service, audit, analytics } = createService();

    (prisma.release.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'rel-1',
      title: 'Release',
      description: 'Demo',
      coverArt: null,
      releaseType: 'DIGITAL',
      creatorId: 'creator-1',
      creator: { id: 'creator-1', displayName: 'Creator', publicId: 'USR-CRE-001' },
      createdAt: new Date(),
      updatedAt: new Date(),
      tracks: [],
    });

    const release = await service.getRelease('rel-1', { userId: 'user-1' });

    expect(release?.id).toBe('rel-1');
    expect(audit.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'catalog.release.viewed', target: 'rel-1' }),
    );
    expect(analytics.track).toHaveBeenCalledWith(
      'catalog.release.viewed',
      expect.any(Object),
      expect.objectContaining({ userId: 'user-1', target: 'rel-1' }),
    );
  });
});
