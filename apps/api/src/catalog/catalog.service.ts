import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { AnalyticsService } from '../analytics/analytics.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

import { ListReleasesQueryDto } from './dto/list-releases.query';
import { SearchCatalogQueryDto } from './dto/search-catalog.query';

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async listReleases(
    query: ListReleasesQueryDto,
    context: { userId?: string; requestId?: string } = {},
  ) {
    const take = query.take ?? 20;
    const skip = query.skip ?? 0;

    const where: Prisma.ReleaseWhereInput = {};

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.creatorId) {
      where.creatorId = query.creatorId;
    }

    const [releases, total] = await this.prisma.$transaction([
      this.prisma.release.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: { id: true, displayName: true, publicId: true },
          },
          tracks: {
            orderBy: { position: 'asc' },
            select: {
              id: true,
              title: true,
              duration: true,
              position: true,
              audioUrl: true,
            },
          },
        },
      }),
      this.prisma.release.count({ where }),
    ]);

    await this.auditService.recordEvent({
      actorUserId: context.userId ?? null,
      actorType: 'api',
      event: 'catalog.releases.listed',
      metadata: {
        skip,
        take,
        search: query.search ?? null,
        creatorId: query.creatorId ?? null,
        resultCount: releases.length,
      },
      requestId: context.requestId ?? null,
    });

    await this.analyticsService.track(
      'catalog.releases.listed',
      {
        skip,
        take,
        search: query.search ?? null,
        creatorId: query.creatorId ?? null,
        resultCount: releases.length,
      },
      { userId: context.userId ?? null, requestId: context.requestId ?? null },
    );

    return {
      releases: releases.map((release) => ({
        id: release.id,
        title: release.title,
        description: release.description,
        coverArt: release.coverArt,
        releaseType: release.releaseType,
        creator: release.creator,
        createdAt: release.createdAt,
        updatedAt: release.updatedAt,
        tracks: release.tracks,
      })),
      pagination: {
        skip,
        take,
        total,
        hasMore: skip + take < total,
      },
    };
  }

  async getRelease(
    releaseId: string,
    context: { userId?: string; requestId?: string } = {},
  ) {
    const release = await this.prisma.release.findUnique({
      where: { id: releaseId },
      include: {
        creator: {
          select: { id: true, displayName: true, publicId: true },
        },
        tracks: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            title: true,
            duration: true,
            position: true,
            audioUrl: true,
          },
        },
      },
    });

    if (!release) {
      return null;
    }

    await this.auditService.recordEvent({
      actorUserId: context.userId ?? null,
      actorType: 'api',
      event: 'catalog.release.viewed',
      target: release.id,
      metadata: {
        creatorId: release.creatorId,
        trackCount: release.tracks.length,
      },
      requestId: context.requestId ?? null,
    });

    await this.analyticsService.track(
      'catalog.release.viewed',
      {
        creatorId: release.creatorId,
        trackCount: release.tracks.length,
      },
      { userId: context.userId ?? null, requestId: context.requestId ?? null, target: release.id },
    );

    return release;
  }

  async search(
    query: SearchCatalogQueryDto,
    context: { userId?: string; requestId?: string } = {},
  ) {
    const releaseTake = query.take ?? 5;
    const trackTake = query.trackTake ?? 5;

    const [releases, tracks] = await this.prisma.$transaction([
      this.prisma.release.findMany({
        where: {
          OR: [
            { title: { contains: query.query, mode: 'insensitive' } },
            { description: { contains: query.query, mode: 'insensitive' } },
          ],
        },
        take: releaseTake,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: { id: true, displayName: true, publicId: true },
          },
        },
      }),
      this.prisma.releaseTrack.findMany({
        where: {
          title: { contains: query.query, mode: 'insensitive' },
        },
        take: trackTake,
        orderBy: { position: 'asc' },
        include: {
          release: {
            select: { id: true, title: true, coverArt: true, creatorId: true },
          },
        },
      }),
    ]);

    await this.auditService.recordEvent({
      actorUserId: context.userId ?? null,
      actorType: 'api',
      event: 'catalog.search',
      metadata: {
        query: query.query,
        releaseCount: releases.length,
        trackCount: tracks.length,
      },
      requestId: context.requestId ?? null,
    });

    await this.analyticsService.track(
      'catalog.search.performed',
      {
        query: query.query,
        releaseCount: releases.length,
        trackCount: tracks.length,
      },
      { userId: context.userId ?? null, requestId: context.requestId ?? null },
    );

    return {
      releases,
      tracks,
    };
  }
}
