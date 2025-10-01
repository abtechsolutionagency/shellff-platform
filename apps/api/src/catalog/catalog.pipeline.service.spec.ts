import { describe, expect, it, vi, beforeEach } from 'vitest';

import { CatalogPipelineService } from './catalog.pipeline.service';
import type { AnalyticsService } from '../analytics/analytics.service';
import type { AuditService } from '../audit/audit.service';
import type { PrismaService } from '../prisma/prisma.service';

function createPipeline({
  releaseSignals = [],
  trackSignals = [],
  listenerProfile = null as unknown,
}: {
  releaseSignals?: Array<{ release_id: string; play_count: number; editorial_weight: number; genres?: string[]; trending_regions?: string[] }>;
  trackSignals?: Array<{ track_id: string; play_count: number; editorial_weight: number; genres?: string[] }>;
  listenerProfile?: unknown;
}) {
  const releaseRows = releaseSignals;
  const trackRows = trackSignals;
  const profileRows = listenerProfile ? [listenerProfile] : [];

  const prisma = {
    release: {
      findMany: vi.fn(),
    },
    releaseTrack: {
      findMany: vi.fn(),
    },
    $queryRaw: vi.fn().mockImplementation((query: { sql?: string }) => {
      if (query?.sql?.includes('listener_personalization_profiles')) {
        return profileRows;
      }
      return [];
    }),
    $queryRawUnsafe: vi.fn().mockImplementation((query: string) => {
      if (query.includes('catalog_release_signals')) {
        return releaseRows;
      }
      if (query.includes('catalog_track_signals')) {
        return trackRows;
      }
      if (query.includes('listener_personalization_profiles')) {
        return profileRows;
      }
      return [];
    }),
  } as unknown as PrismaService;

  const audit = { recordEvent: vi.fn() } as unknown as AuditService;
  const analytics = { track: vi.fn() } as unknown as AnalyticsService;

  const service = new CatalogPipelineService(prisma, audit, analytics);

  return { prisma, audit, analytics, service };
}

describe('CatalogPipelineService', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('computes blended scores using popularity, recency, and editorial weight', async () => {
    const now = new Date('2025-02-20T00:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const { prisma, service } = createPipeline({
      releaseSignals: [
        { release_id: 'new-release', play_count: 5000, editorial_weight: 2, genres: ['ambient'], trending_regions: ['us'] },
        { release_id: 'older-release', play_count: 120, editorial_weight: 4, genres: ['ambient'], trending_regions: [] },
      ],
      trackSignals: [
        { track_id: 'track-a', play_count: 2000, editorial_weight: 1, genres: ['ambient'] },
        { track_id: 'track-b', play_count: 100, editorial_weight: 3, genres: ['ambient'] },
      ],
    });

    (prisma.release.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 'new-release',
        title: 'New Horizons',
        description: null,
        coverArt: null,
        releaseType: 'DIGITAL',
        creatorId: 'creator-1',
        creator: { id: 'creator-1', displayName: 'Creator One', publicId: 'USR-CRE-001' },
        createdAt: new Date('2025-02-01T00:00:00.000Z'),
        updatedAt: new Date('2025-02-10T00:00:00.000Z'),
      },
      {
        id: 'older-release',
        title: 'Legacy Echoes',
        description: null,
        coverArt: null,
        releaseType: 'DIGITAL',
        creatorId: 'creator-2',
        creator: { id: 'creator-2', displayName: 'Creator Two', publicId: 'USR-CRE-002' },
        createdAt: new Date('2024-02-01T00:00:00.000Z'),
        updatedAt: new Date('2024-02-05T00:00:00.000Z'),
      },
    ]);

    (prisma.releaseTrack.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 'track-a',
        title: 'Aurora',
        duration: 180,
        position: 1,
        releaseId: 'new-release',
        release: { id: 'new-release', title: 'New Horizons', coverArt: null, creatorId: 'creator-1', createdAt: new Date('2025-02-01T00:00:00.000Z') },
      },
      {
        id: 'track-b',
        title: 'Echo',
        duration: 200,
        position: 2,
        releaseId: 'older-release',
        release: { id: 'older-release', title: 'Legacy Echoes', coverArt: null, creatorId: 'creator-2', createdAt: new Date('2024-02-01T00:00:00.000Z') },
      },
    ]);

    const results = await service.searchCatalog({
      query: 'echo',
      releaseTake: 5,
      trackTake: 5,
      region: 'global',
      personalized: false,
      userId: null,
    });

    expect(results.releases[0]?.id).toBe('new-release');
    expect(results.releases[0]?.score).toBeGreaterThan(results.releases[1]?.score ?? 0);
    expect(results.tracks[0]?.id).toBe('track-a');
    vi.useRealTimers();
  });

  it('applies personalization boosts when listener profile matches', async () => {
    const now = new Date('2025-02-20T00:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const { prisma, service, analytics } = createPipeline({
      releaseSignals: [
        { release_id: 'release-a', play_count: 100, editorial_weight: 1, genres: ['jazz'] },
        { release_id: 'release-b', play_count: 110, editorial_weight: 1, genres: ['afrobeat'] },
      ],
      trackSignals: [],
      listenerProfile: {
        user_id: 'listener-1',
        favorite_genres: ['afrobeat'],
        followed_creators: ['creator-b'],
      },
    });

    (prisma.release.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 'release-a',
        title: 'Blue Notes',
        description: null,
        coverArt: null,
        releaseType: 'DIGITAL',
        creatorId: 'creator-a',
        creator: { id: 'creator-a', displayName: 'Creator A', publicId: 'USR-CRE-010' },
        createdAt: new Date('2025-02-10T00:00:00.000Z'),
        updatedAt: new Date('2025-02-11T00:00:00.000Z'),
      },
      {
        id: 'release-b',
        title: 'Afro Sunrise',
        description: null,
        coverArt: null,
        releaseType: 'DIGITAL',
        creatorId: 'creator-b',
        creator: { id: 'creator-b', displayName: 'Creator B', publicId: 'USR-CRE-011' },
        createdAt: new Date('2025-02-12T00:00:00.000Z'),
        updatedAt: new Date('2025-02-12T00:00:00.000Z'),
      },
    ]);

    (prisma.releaseTrack.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const results = await service.searchCatalog({
      query: 'afro',
      releaseTake: 5,
      trackTake: 5,
      region: 'global',
      personalized: true,
      userId: 'listener-1',
    });

    expect(results.meta.personalization.applied).toBe(true);
    expect(results.meta.personalization.matchedSignals.followedCreators).toBe(1);
    expect(results.releases[0]?.id).toBe('release-b');
    expect(results.releases[0]?.personalization?.reasons).toContain('followed-creator');
    expect(results.releases[0]?.personalization?.reasons).toContain('favored-genre');
    vi.useRealTimers();
  });

  it('gracefully falls back when listener profile cannot be loaded', async () => {
    const { prisma, service } = createPipeline({});

    (prisma.$queryRawUnsafe as unknown as ReturnType<typeof vi.fn>).mockImplementation((query: string) => {
      if (query.includes('listener_personalization_profiles')) {
        throw new Error('profile table missing');
      }
      return [];
    });

    (prisma.release.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 'release-a',
        title: 'Fallback',
        description: null,
        coverArt: null,
        releaseType: 'DIGITAL',
        creatorId: 'creator-a',
        creator: { id: 'creator-a', displayName: 'Creator A', publicId: 'USR-CRE-010' },
        createdAt: new Date('2025-02-10T00:00:00.000Z'),
        updatedAt: new Date('2025-02-11T00:00:00.000Z'),
      },
    ]);

    (prisma.releaseTrack.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const results = await service.searchCatalog({
      query: 'fallback',
      releaseTake: 5,
      trackTake: 5,
      region: 'global',
      personalized: true,
      userId: 'listener-2',
    });

    expect(results.meta.personalization.applied).toBe(false);
    expect(results.meta.personalization.profileUnavailable).toBe(true);
  });

  it('queues and processes scheduled refreshes', async () => {
    const { service, analytics } = createPipeline({});

    service.scheduleRegionalRefresh({ releaseId: 'rel-1', reason: 'release-mutated' });
    service.scheduleRegionalRefresh({ releaseId: 'rel-1', regions: ['us'], reason: 'track-mutated' });

    const tasks = await service.processScheduledRefreshes();

    expect(tasks).toHaveLength(2);
    expect(analytics.track).toHaveBeenCalledWith(
      'catalog.pipeline.refresh.dispatched',
      { count: 2 },
      { userId: null },
    );
  });
});
