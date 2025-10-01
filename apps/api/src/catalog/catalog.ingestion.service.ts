import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { CatalogPipelineService, CatalogRefreshReason } from './catalog.pipeline.service';

@Injectable()
export class CatalogIngestionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CatalogIngestionService.name);
  private middlewareRegistered = false;
  private poller?: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService, private readonly pipeline: CatalogPipelineService) {}

  async onModuleInit() {
    if (!this.middlewareRegistered) {
      this.prisma.$use(async (params, next) => {
        const result = await next(params);
        if (params.model === 'Release' || params.model === 'ReleaseTrack') {
          const releaseIds = this.extractReleaseIds(params, result);
          const reason: CatalogRefreshReason = params.model === 'Release' ? 'release-mutated' : 'track-mutated';

          for (const releaseId of releaseIds) {
            if (!releaseId) continue;
            this.logger.debug(`Scheduling index refresh for ${releaseId} after ${params.model} ${params.action}`);
            this.pipeline.scheduleRegionalRefresh({
              releaseId,
              reason,
              triggeredBy: this.extractActor(params),
            });
          }
        }
        return result;
      });
      this.middlewareRegistered = true;
    }

    this.poller = setInterval(() => {
      void this.pipeline.processScheduledRefreshes();
    }, 60_000);
  }

  async onModuleDestroy() {
    if (this.poller) {
      clearInterval(this.poller);
      this.poller = undefined;
    }
  }

  async triggerFullRebuild(regions: string[] = ['global']) {
    const releaseIds = await this.prisma.release.findMany({ select: { id: true } });
    for (const release of releaseIds) {
      this.pipeline.scheduleRegionalRefresh({ releaseId: release.id, regions, reason: 'manual-rebuild' });
    }
  }

  private extractReleaseIds(params: Prisma.MiddlewareParams, result: unknown) {
    if (params.model === 'Release') {
      if (params.args?.where?.id) {
        return [params.args.where.id as string];
      }

      if (params.args?.data?.id) {
        return [params.args.data.id as string];
      }

      if (typeof (result as { id?: string } | null)?.id === 'string') {
        return [(result as { id: string }).id];
      }
    }

    if (params.model === 'ReleaseTrack') {
      if (params.args?.where?.releaseId) {
        return [params.args.where.releaseId as string];
      }

      if (params.args?.data?.releaseId) {
        return [params.args.data.releaseId as string];
      }

      const releaseId = (result as { releaseId?: string } | null)?.releaseId;
      if (releaseId) {
        return [releaseId];
      }

      const dataArray = Array.isArray(result) ? result : [];
      const ids = new Set<string>();
      for (const row of dataArray as Array<{ releaseId?: string }>) {
        if (row.releaseId) {
          ids.add(row.releaseId);
        }
      }
      return Array.from(ids);
    }

    return [] as string[];
  }

  private extractActor(params: Prisma.MiddlewareParams) {
    const userId = params.args?.context?.userId;
    if (typeof userId === 'string') {
      return userId;
    }
    return null;
  }
}
