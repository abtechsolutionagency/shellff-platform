import { Injectable, NotFoundException } from '@nestjs/common';
import {
  FeatureFlagEnvironment,
  FeatureFlagRolloutType,
} from '@prisma/client';
import { ConfigService } from '@nestjs/config';

import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import type { EnvConfig } from '../config/env.validation';

import { EvaluateFlagDto } from './dto/evaluate-flag.dto';
import { UpdateFeatureFlagDto } from './dto/update-flag.dto';
import { UpsertFlagOverrideDto } from './dto/upsert-override.dto';

type CachedFlag = {
  flag: {
    key: string;
    enabled: boolean;
    rolloutType: FeatureFlagRolloutType;
    description: string | null;
    overrides: Array<{
      environment: FeatureFlagEnvironment;
      userId: string | null;
      value: boolean;
    }>;
  };
  expiresAt: number;
};

@Injectable()
export class FeatureFlagsService {
  private readonly cache = new Map<string, CachedFlag>();
  private readonly inFlightFetches = new Map<string, Promise<CachedFlag['flag']>>();
  private readonly cacheTtlMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly configService?: ConfigService<EnvConfig, true>,
  ) {
    const ttlSeconds = this.configService?.get<number>(
      'FEATURE_FLAG_CACHE_TTL_SECONDS',
    );
    const resolvedSeconds =
      typeof ttlSeconds === 'number' && ttlSeconds > 0 ? ttlSeconds : 60;
    this.cacheTtlMs = resolvedSeconds * 1000;
  }

  async evaluate(key: string, query: EvaluateFlagDto) {
    const flag = await this.getFlagWithCaching(key);

    const { value, source } = this.computeFlagValue(flag, query);

    return {
      key: flag.key,
      value,
      source,
      rolloutType: flag.rolloutType,
      description: flag.description,
    };
  }

  async updateFlag(key: string, dto: UpdateFeatureFlagDto) {
    const flag = await this.prisma.featureFlag.update({
      where: { key },
      data: {
        description: dto.description,
        enabled: dto.enabled ?? undefined,
        rolloutType: dto.rolloutType ?? undefined,
      },
    });

    this.invalidateCacheEntry(key);

    await this.auditService.recordEvent({
      actorUserId: dto.actorUserId ?? null,
      actorType: dto.actorType,
      event: 'feature-flags.update',
      target: flag.key,
      metadata: {
        enabled: flag.enabled,
        rolloutType: flag.rolloutType,
      },
    });

    return flag;
  }

  async upsertOverride(key: string, dto: UpsertFlagOverrideDto) {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { key },
    });

    if (!flag) {
      throw new NotFoundException('Feature flag not found');
    }

    const environment = dto.environment ?? FeatureFlagEnvironment.LOCAL;

    const override = await this.prisma.featureFlagOverride.upsert({
      where: {
        flagId_environment_userId: {
          flagId: flag.id,
          environment,
          userId: dto.userId as any,
        },
      },
      update: {
        value: dto.value,
        notes: dto.notes,
      },
      create: {
        flagId: flag.id,
        environment,
        userId: dto.userId,
        value: dto.value,
        notes: dto.notes,
      },
    });

    this.invalidateCacheEntry(key);

    await this.auditService.recordEvent({
      actorUserId: dto.actorUserId ?? null,
      actorType: dto.actorType,
      event: 'feature-flags.override',
      target: `${flag.key}:${override.environment}:${override.userId ?? 'global'}`,
      metadata: {
        userId: override.userId,
        environment: override.environment,
        value: override.value,
      },
    });

    return override;
  }

  private async getFlagWithCaching(key: string) {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      return cached.flag;
    }

    if (cached && cached.expiresAt <= now) {
      this.cache.delete(key);
    }

    const existingFetch = this.inFlightFetches.get(key);
    if (existingFetch) {
      return existingFetch;
    }

    const fetchPromise = this.prisma.featureFlag
      .findUnique({
        where: { key },
        include: { overrides: true },
      })
      .then((flag) => {
        if (!flag) {
          throw new NotFoundException('Feature flag not found');
        }

        const refreshedEntry: CachedFlag = {
          flag,
          expiresAt: Date.now() + this.cacheTtlMs,
        };

        this.cache.set(key, refreshedEntry);
        return refreshedEntry.flag;
      })
      .finally(() => {
        this.inFlightFetches.delete(key);
      });

    this.inFlightFetches.set(key, fetchPromise);
    return fetchPromise;
  }

  private invalidateCacheEntry(key: string) {
    this.cache.delete(key);
    this.inFlightFetches.delete(key);
  }

  private computeFlagValue(
    flag: {
      enabled: boolean;
      overrides: Array<{
        environment: FeatureFlagEnvironment;
        userId: string | null;
        value: boolean;
      }>;
      rolloutType: FeatureFlagRolloutType;
    },
    query: EvaluateFlagDto,
  ) {
    let value = flag.enabled;
    let source: 'default' | 'user-override' | 'environment-override' = 'default';

    if (query.userId) {
      const userOverride = flag.overrides.find(
        (override) => override.userId === query.userId,
      );
      if (userOverride) {
        return { value: userOverride.value, source: 'user-override' as const };
      }
    }

    if (query.environment) {
      const environmentOverride = flag.overrides.find(
        (override) =>
          !override.userId && override.environment === query.environment,
      );
      if (environmentOverride) {
        value = environmentOverride.value;
        source = 'environment-override';
      }
    }

    return { value, source };
  }
}
