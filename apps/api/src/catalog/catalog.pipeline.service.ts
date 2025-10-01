import { Injectable, Logger } from '@nestjs/common';

import { AnalyticsService } from '../analytics/analytics.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

export type CatalogRefreshReason = 'release-mutated' | 'track-mutated' | 'manual-rebuild';

export interface CatalogIndexRefreshTask {
  releaseId: string;
  regions: string[];
  reason: CatalogRefreshReason;
  scheduledAt: Date;
  triggeredBy?: string | null;
}

export interface CatalogSearchParams {
  query: string;
  releaseTake: number;
  trackTake: number;
  region: string;
  personalized: boolean;
  userId?: string | null;
}

export interface CatalogSearchResultMeta {
  query: string;
  region: string;
  personalization: {
    requested: boolean;
    applied: boolean;
    profileUnavailable: boolean;
    matchedSignals: {
      followedCreators: number;
      favoredGenres: number;
    };
  };
}

export interface CatalogReleaseSearchResultSignals {
  popularity: number;
  recency: number;
  editorialBoost: number;
  listenerAffinity: number;
}

export interface CatalogTrackSearchResultSignals {
  popularity: number;
  recency: number;
  editorialBoost: number;
  listenerAffinity: number;
}

export interface CatalogReleaseSearchResult {
  id: string;
  title: string;
  description: string | null;
  coverArt: string | null;
  releaseType: string;
  creator: {
    id: string;
    displayName: string;
    publicId: string;
  };
  createdAt: Date;
  updatedAt: Date;
  score: number;
  signals: CatalogReleaseSearchResultSignals;
  personalization: {
    applied: boolean;
    reasons: string[];
    matchedGenres: string[];
    boostMultiplier: number;
  } | null;
}

export interface CatalogTrackSearchResult {
  id: string;
  title: string;
  duration: number | null;
  position: number;
  release: {
    id: string;
    title: string;
    coverArt: string | null;
    creatorId: string;
    createdAt: Date;
  };
  score: number;
  signals: CatalogTrackSearchResultSignals;
  personalization: {
    applied: boolean;
    reasons: string[];
    matchedGenres: string[];
    boostMultiplier: number;
  } | null;
}

export interface CatalogSearchResults {
  releases: CatalogReleaseSearchResult[];
  tracks: CatalogTrackSearchResult[];
  meta: CatalogSearchResultMeta;
}

interface ReleaseSignalRow {
  release_id: string;
  play_count: number;
  editorial_weight: number;
  genres: string[] | null;
  trending_regions: string[] | null;
}

interface TrackSignalRow {
  track_id: string;
  play_count: number;
  editorial_weight: number;
  genres: string[] | null;
}

interface ListenerProfileRow {
  user_id: string;
  favorite_genres: string[] | null;
  followed_creators: string[] | null;
}

@Injectable()
export class CatalogPipelineService {
  private readonly logger = new Logger(CatalogPipelineService.name);
  private readonly scheduledRefreshes = new Map<string, CatalogIndexRefreshTask>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  scheduleRegionalRefresh(task: {
    releaseId: string;
    regions?: string[];
    reason: CatalogRefreshReason;
    triggeredBy?: string | null;
  }) {
    const regions = task.regions?.length ? Array.from(new Set(task.regions)) : ['global'];
    const key = `${task.releaseId}:${regions.sort().join(',')}:${task.reason}`;
    const refreshTask: CatalogIndexRefreshTask = {
      releaseId: task.releaseId,
      regions,
      reason: task.reason,
      scheduledAt: new Date(),
      triggeredBy: task.triggeredBy ?? null,
    };

    this.scheduledRefreshes.set(key, refreshTask);

    void this.analyticsService.track(
      'catalog.pipeline.refresh.scheduled',
      {
        releaseId: task.releaseId,
        regions,
        reason: task.reason,
      },
      { userId: task.triggeredBy ?? null },
    );

    void this.auditService.recordEvent({
      actorUserId: task.triggeredBy ?? null,
      actorType: 'system',
      event: 'catalog.pipeline.refresh.scheduled',
      target: task.releaseId,
      metadata: { regions, reason: task.reason },
    });
  }

  drainScheduledRefreshes() {
    const tasks = Array.from(this.scheduledRefreshes.values());
    this.scheduledRefreshes.clear();
    return tasks;
  }

  async processScheduledRefreshes() {
    const tasks = this.drainScheduledRefreshes();

    if (!tasks.length) {
      return [] as CatalogIndexRefreshTask[];
    }

    void this.analyticsService.track(
      'catalog.pipeline.refresh.dispatched',
      { count: tasks.length },
      { userId: null },
    );

    return tasks;
  }

  async searchCatalog(params: CatalogSearchParams): Promise<CatalogSearchResults> {
    const { query, releaseTake, trackTake, region, personalized, userId } = params;

    const releases = await this.prisma.release.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: releaseTake,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, displayName: true, publicId: true } },
      },
    });

    const tracks = await this.prisma.releaseTrack.findMany({
      where: { title: { contains: query, mode: 'insensitive' } },
      take: trackTake,
      orderBy: { position: 'asc' },
      include: {
        release: { select: { id: true, title: true, coverArt: true, creatorId: true, createdAt: true } },
      },
    });

    const releaseSignals = await this.fetchReleaseSignals(releases.map((release) => release.id));
    const trackSignals = await this.fetchTrackSignals(tracks.map((track) => track.id));

    let listenerProfile: ListenerProfileRow | null = null;
    let profileUnavailable = false;

    if (personalized && userId) {
      try {
        listenerProfile = await this.fetchListenerProfile(userId);
      } catch (error) {
        profileUnavailable = true;
        this.logger.warn(`Failed to load listener profile for ${userId}: ${String(error)}`);
      }
    }

    const now = Date.now();
    const releaseResults = releases.map((release) => {
      const signals = releaseSignals[release.id] ?? {
        popularity: 0,
        editorialWeight: 0,
        genres: [] as string[],
        trendingRegions: [] as string[],
      };

      const recencyScore = this.computeRecencyScore(now, release.createdAt);
      const popularityScore = this.normalizePopularity(signals.popularity);
      const editorialBoost = Math.max(signals.editorialWeight ?? 0, 0);

      let personalizationBoost = 1;
      const personalizationReasons: string[] = [];
      const matchedGenres: string[] = [];

      if (listenerProfile) {
        const followedCreators = new Set(listenerProfile.followed_creators ?? []);
        if (followedCreators.has(release.creatorId)) {
          personalizationBoost += 0.25;
          personalizationReasons.push('followed-creator');
        }

        const favoriteGenres = new Set(listenerProfile.favorite_genres ?? []);
        for (const genre of signals.genres ?? []) {
          if (favoriteGenres.has(genre)) {
            matchedGenres.push(genre);
          }
        }

        if (matchedGenres.length) {
          personalizationBoost += 0.15;
          personalizationReasons.push('favored-genre');
        }
      }

      const listenerAffinity = personalizationBoost;

      const compositeScore =
        (popularityScore * 0.6 + recencyScore * 0.3 + this.normalizeEditorialBoost(editorialBoost) * 0.1) *
        personalizationBoost;

      return {
        id: release.id,
        title: release.title,
        description: release.description ?? null,
        coverArt: release.coverArt ?? null,
        releaseType: release.releaseType,
        creator: release.creator,
        createdAt: release.createdAt,
        updatedAt: release.updatedAt,
        score: compositeScore,
        signals: {
          popularity: popularityScore,
          recency: recencyScore,
          editorialBoost: this.normalizeEditorialBoost(editorialBoost),
          listenerAffinity,
        },
        personalization:
          listenerProfile && personalizationReasons.length
            ? {
                applied: true,
                reasons: personalizationReasons,
                matchedGenres,
                boostMultiplier: personalizationBoost,
              }
            : listenerProfile
            ? {
                applied: false,
                reasons: [],
                matchedGenres,
                boostMultiplier: personalizationBoost,
              }
            : null,
      } satisfies CatalogReleaseSearchResult;
    });

    const trackResults = tracks.map((track) => {
      const signals = trackSignals[track.id] ?? {
        popularity: 0,
        editorialWeight: 0,
        genres: [] as string[],
      };

      const recencyScore = this.computeRecencyScore(now, track.release.createdAt);
      const popularityScore = this.normalizePopularity(signals.popularity);
      const editorialBoost = Math.max(signals.editorialWeight ?? 0, 0);

      let personalizationBoost = 1;
      const personalizationReasons: string[] = [];
      const matchedGenres: string[] = [];

      if (listenerProfile) {
        const followedCreators = new Set(listenerProfile.followed_creators ?? []);
        if (followedCreators.has(track.release.creatorId)) {
          personalizationBoost += 0.2;
          personalizationReasons.push('followed-creator');
        }

        const favoriteGenres = new Set(listenerProfile.favorite_genres ?? []);
        for (const genre of signals.genres ?? []) {
          if (favoriteGenres.has(genre)) {
            matchedGenres.push(genre);
          }
        }

        if (matchedGenres.length) {
          personalizationBoost += 0.1;
          personalizationReasons.push('favored-genre');
        }
      }

      const listenerAffinity = personalizationBoost;

      const compositeScore =
        (popularityScore * 0.6 + recencyScore * 0.3 + this.normalizeEditorialBoost(editorialBoost) * 0.1) *
        personalizationBoost;

      return {
        id: track.id,
        title: track.title,
        duration: track.duration ?? null,
        position: track.position,
        release: track.release,
        score: compositeScore,
        signals: {
          popularity: popularityScore,
          recency: recencyScore,
          editorialBoost: this.normalizeEditorialBoost(editorialBoost),
          listenerAffinity,
        },
        personalization:
          listenerProfile && personalizationReasons.length
            ? {
                applied: true,
                reasons: personalizationReasons,
                matchedGenres,
                boostMultiplier: personalizationBoost,
              }
            : listenerProfile
            ? {
                applied: false,
                reasons: [],
                matchedGenres,
                boostMultiplier: personalizationBoost,
              }
            : null,
      } satisfies CatalogTrackSearchResult;
    });

    releaseResults.sort((a, b) => b.score - a.score);
    trackResults.sort((a, b) => b.score - a.score);

    const matchedSignals = {
      followedCreators: releaseResults.filter(
        (release) => release.personalization?.reasons.includes('followed-creator') ?? false,
      ).length,
      favoredGenres: releaseResults.filter(
        (release) => release.personalization?.reasons.includes('favored-genre') ?? false,
      ).length,
    };

    const meta: CatalogSearchResultMeta = {
      query,
      region,
      personalization: {
        requested: personalized,
        applied: Boolean(listenerProfile),
        profileUnavailable,
        matchedSignals,
      },
    };

    return {
      releases: releaseResults,
      tracks: trackResults,
      meta,
    };
  }

  private async fetchReleaseSignals(releaseIds: string[]) {
    if (!releaseIds.length) {
      return {} as Record<
        string,
        { popularity: number; editorialWeight: number; genres: string[]; trendingRegions: string[] }
      >;
    }

    const sanitized = releaseIds.map((id) => `'${id.replace(/'/g, "''")}'`).join(', ');
    const rows =
      (await this.prisma.$queryRawUnsafe<ReleaseSignalRow[]>(
        `SELECT release_id, play_count, editorial_weight, genres, trending_regions FROM catalog_release_signals WHERE release_id IN (${sanitized})`,
      )) ?? [];

    return rows.reduce(
      (acc, row) => {
        acc[row.release_id] = {
          popularity: row.play_count ?? 0,
          editorialWeight: row.editorial_weight ?? 0,
          genres: row.genres ?? [],
          trendingRegions: row.trending_regions ?? [],
        };
        return acc;
      },
      {} as Record<string, { popularity: number; editorialWeight: number; genres: string[]; trendingRegions: string[] }>,
    );
  }

  private async fetchTrackSignals(trackIds: string[]) {
    if (!trackIds.length) {
      return {} as Record<string, { popularity: number; editorialWeight: number; genres: string[] }>;
    }

    const sanitized = trackIds.map((id) => `'${id.replace(/'/g, "''")}'`).join(', ');
    const rows =
      (await this.prisma.$queryRawUnsafe<TrackSignalRow[]>(
        `SELECT track_id, play_count, editorial_weight, genres FROM catalog_track_signals WHERE track_id IN (${sanitized})`,
      )) ?? [];

    return rows.reduce(
      (acc, row) => {
        acc[row.track_id] = {
          popularity: row.play_count ?? 0,
          editorialWeight: row.editorial_weight ?? 0,
          genres: row.genres ?? [],
        };
        return acc;
      },
      {} as Record<string, { popularity: number; editorialWeight: number; genres: string[] }>,
    );
  }

  private async fetchListenerProfile(userId: string) {
    const sanitized = userId.replace(/'/g, "''");
    const rows = await this.prisma.$queryRawUnsafe<ListenerProfileRow[]>(
      `SELECT user_id, favorite_genres, followed_creators FROM listener_personalization_profiles WHERE user_id = '${sanitized}' LIMIT 1`,
    );

    return rows?.[0] ?? null;
  }

  private computeRecencyScore(now: number, createdAt: Date) {
    const days = Math.max(0, (now - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const normalized = Math.max(0, 1 - Math.min(days, 365) / 365);
    return Number.isFinite(normalized) ? normalized : 0;
  }

  private normalizePopularity(value: number) {
    if (!Number.isFinite(value) || value <= 0) {
      return 0;
    }

    const normalized = Math.min(1, Math.log10(value + 1) / 6);
    return Number.isFinite(normalized) ? normalized : 0;
  }

  private normalizeEditorialBoost(value: number) {
    if (!Number.isFinite(value) || value <= 0) {
      return 0;
    }

    return Math.min(1, value / 5);
  }

}
