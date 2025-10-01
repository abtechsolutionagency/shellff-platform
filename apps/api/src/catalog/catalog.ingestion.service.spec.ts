import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { Prisma } from '@prisma/client';

import { CatalogIngestionService } from './catalog.ingestion.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { CatalogPipelineService } from './catalog.pipeline.service';

function createIngestion() {
  const middlewares: Prisma.Middleware[] = [];
  const prisma = {
    $use: vi.fn((middleware: Prisma.Middleware) => {
      middlewares.push(middleware);
    }),
    release: {
      findMany: vi.fn().mockResolvedValue([{ id: 'rel-1' }, { id: 'rel-2' }]),
    },
  } as unknown as PrismaService;

  const pipeline = {
    scheduleRegionalRefresh: vi.fn(),
    processScheduledRefreshes: vi.fn().mockResolvedValue([]),
  } as unknown as CatalogPipelineService;

  const service = new CatalogIngestionService(prisma, pipeline);

  return { prisma, pipeline, service, middlewares };
}

describe('CatalogIngestionService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('registers Prisma middleware and schedules refreshes on release mutations', async () => {
    const { service, middlewares, pipeline } = createIngestion();

    await service.onModuleInit();

    expect(middlewares).toHaveLength(1);

    const handler = middlewares[0]!;
    await handler(
      {
        model: 'Release',
        action: 'create',
        args: { data: { id: 'rel-3' }, context: { userId: 'creator-1' } },
      } as Prisma.MiddlewareParams,
      async () => ({ id: 'rel-3' }),
    );

    expect(pipeline.scheduleRegionalRefresh).toHaveBeenCalledWith(
      expect.objectContaining({ releaseId: 'rel-3', reason: 'release-mutated', triggeredBy: 'creator-1' }),
    );
  });

  it('captures release IDs from track mutations and schedules refresh', async () => {
    const { service, middlewares, pipeline } = createIngestion();

    await service.onModuleInit();
    const handler = middlewares[0]!;

    await handler(
      {
        model: 'ReleaseTrack',
        action: 'update',
        args: { data: { releaseId: 'rel-5' } },
      } as Prisma.MiddlewareParams,
      async () => ({ releaseId: 'rel-5' }),
    );

    expect(pipeline.scheduleRegionalRefresh).toHaveBeenCalledWith(
      expect.objectContaining({ releaseId: 'rel-5', reason: 'track-mutated' }),
    );
  });

  it('triggers full rebuild across all releases', async () => {
    const { service, pipeline } = createIngestion();

    await service.triggerFullRebuild(['us', 'ng']);

    expect(pipeline.scheduleRegionalRefresh).toHaveBeenCalledTimes(2);
    expect(pipeline.scheduleRegionalRefresh).toHaveBeenCalledWith(
      expect.objectContaining({ releaseId: 'rel-1', regions: ['us', 'ng'], reason: 'manual-rebuild' }),
    );
  });

  it('processes scheduled refreshes on interval', async () => {
    const { service, pipeline } = createIngestion();

    await service.onModuleInit();
    expect(pipeline.processScheduledRefreshes).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(60_000);

    expect(pipeline.processScheduledRefreshes).toHaveBeenCalled();

    await service.onModuleDestroy();
  });
});
