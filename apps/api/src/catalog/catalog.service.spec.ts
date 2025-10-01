import { describe, expect, it, vi } from 'vitest';

import { CatalogService } from './catalog.service';
import type { AnalyticsService } from '../analytics/analytics.service';
import type { AuditService } from '../audit/audit.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { CatalogPipelineService, CatalogSearchResults } from './catalog.pipeline.service';

describe('CatalogService', () => {
  function createService({
    prisma: prismaOverrides = {},
    pipeline: pipelineOverrides = {},
  }: {
    prisma?: Partial<PrismaService>;
    pipeline?: Partial<CatalogPipelineService>;
  } = {}) {
    const prisma = {
      release: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
      releaseTrack: { findMany: vi.fn() },
      $transaction: vi.fn(),
      ...prismaOverrides,
    } as unknown as PrismaService;

    const audit = { recordEvent: vi.fn(), latest: vi.fn() } as unknown as AuditService;
    const analytics = { track: vi.fn() } as unknown as AnalyticsService;
    const pipeline = {
      searchCatalog: vi.fn(),
      ...pipelineOverrides,
    } as unknown as CatalogPipelineService;

    const service = new CatalogService(prisma, audit, analytics, pipeline);
    return { prisma, audit, analytics, pipeline, service };
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
  it('searches via the pipeline and records analytics metadata', async () => {
    const pipelineResults: CatalogSearchResults = {
      releases: [
        {
          id: 'rel-1',
          title: 'Release',
          description: null,
          coverArt: null,
          releaseType: 'DIGITAL',
          creator: { id: 'creator-1', displayName: 'Creator One', publicId: 'USR-CRE-001' },
          createdAt: new Date(),
          updatedAt: new Date(),
          score: 0.9,
          signals: { popularity: 0.9, recency: 0.8, editorialBoost: 0.5, listenerAffinity: 1.1 },
          personalization: null,
        },
      ],
      tracks: [
        {
          id: 'track-1',
          title: 'Track',
          duration: 120,
          position: 1,
          release: { id: 'rel-1', title: 'Release', coverArt: null, creatorId: 'creator-1', createdAt: new Date() },
          score: 0.8,
          signals: { popularity: 0.7, recency: 0.6, editorialBoost: 0.4, listenerAffinity: 1 },
          personalization: null,
        },
      ],
      meta: {
        query: 'ambient',
        region: 'global',
        personalization: {
          requested: false,
          applied: false,
          profileUnavailable: false,
          matchedSignals: { followedCreators: 0, favoredGenres: 0 },
        },
      },
    };

    const { service, analytics, pipeline, audit } = createService({
      pipeline: { searchCatalog: vi.fn().mockResolvedValue(pipelineResults) },
    });

    const result = await service.search({ query: 'ambient' }, { userId: 'listener-1', requestId: 'req-1' });

    expect(pipeline.searchCatalog).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'ambient', region: 'global', personalized: false }),
    );
    expect(result).toEqual(pipelineResults);
    expect(audit.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'catalog.search',
        metadata: expect.objectContaining({ releaseCount: 1, trackCount: 1, region: 'global' }),
      }),
    );
    expect(analytics.track).toHaveBeenCalledWith(
      'catalog.search.performed',
      expect.objectContaining({ releaseCount: 1, trackCount: 1, region: 'global' }),
      expect.objectContaining({ userId: 'listener-1', requestId: 'req-1' }),
    );
  });

  it('emits personalization analytics when personalization is applied', async () => {
    const pipelineResults: CatalogSearchResults = {
      releases: [],
      tracks: [],
      meta: {
        query: 'jazz',
        region: 'eu-west',
        personalization: {
          requested: true,
          applied: true,
          profileUnavailable: false,
          matchedSignals: { followedCreators: 1, favoredGenres: 2 },
        },
      },
    };

    const { service, analytics } = createService({
      pipeline: { searchCatalog: vi.fn().mockResolvedValue(pipelineResults) },
    });

    await service.search({ query: 'jazz', region: 'eu-west', personalized: true });

    expect(analytics.track).toHaveBeenCalledWith(
      'catalog.search.personalized',
      expect.objectContaining({ region: 'eu-west', matchedSignals: { followedCreators: 1, favoredGenres: 2 } }),
      expect.objectContaining({ userId: null }),
    );
  });

  it('records personalization unavailability when profile data is missing', async () => {
    const pipelineResults: CatalogSearchResults = {
      releases: [],
      tracks: [],
      meta: {
        query: 'house',
        region: 'na',
        personalization: {
          requested: true,
          applied: false,
          profileUnavailable: true,
          matchedSignals: { followedCreators: 0, favoredGenres: 0 },
        },
      },
    };

    const { service, analytics } = createService({
      pipeline: { searchCatalog: vi.fn().mockResolvedValue(pipelineResults) },
    });

    await service.search({ query: 'house', region: 'na', personalized: true });

    expect(analytics.track).toHaveBeenCalledWith(
      'catalog.search.personalization_unavailable',
      expect.objectContaining({ query: 'house', region: 'na' }),
      expect.objectContaining({ userId: null }),
    );
  });
});
