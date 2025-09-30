import {
  FeatureFlagEnvironment,
  FeatureFlagRolloutType,
} from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import type { EnvConfig } from '../config/env.validation';

import { FeatureFlagsService } from './feature-flags.service';

function createPrismaMock() {
  return {
    featureFlag: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    featureFlagOverride: {
      upsert: vi.fn(),
    },
  } as unknown as PrismaService;
}

const baseConfig: EnvConfig = {
  NODE_ENV: 'test',
  APP_PORT: 3000,
  DATABASE_URL: 'postgres://localhost:5432/shellff',
  REDIS_URL: 'redis://localhost:6379',
  MINIO_ENDPOINT: 'http://localhost:9000',
  MINIO_ACCESS_KEY: 'shellff',
  MINIO_SECRET_KEY: 'shellffsecret',
  FEATURE_FLAG_CACHE_TTL_SECONDS: 60,
  JWT_ACCESS_TOKEN_SECRET: 'access',
  JWT_ACCESS_TOKEN_TTL_SECONDS: 3600,
  JWT_REFRESH_TOKEN_SECRET: 'refresh',
  JWT_REFRESH_TOKEN_TTL_SECONDS: 86400,
};

function createConfigService(overrides: Partial<EnvConfig> = {}) {
  return new ConfigService<EnvConfig, true>({ ...baseConfig, ...overrides });
}

describe('FeatureFlagsService', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('evaluates with user overrides first', async () => {
    const prisma = createPrismaMock();
    const audit = { recordEvent: vi.fn() } as unknown as AuditService;
    const config = createConfigService();

    prisma.featureFlag.findUnique = vi.fn().mockResolvedValue({
      key: 'auth.signup',
      enabled: false,
      rolloutType: FeatureFlagRolloutType.STATIC,
      description: 'signup',
      overrides: [
        {
          environment: FeatureFlagEnvironment.LOCAL,
          userId: 'user-1',
          value: true,
        },
      ],
    });

    const service = new FeatureFlagsService(prisma, audit, config);
    const result = await service.evaluate('auth.signup', {
      userId: 'user-1',
      environment: FeatureFlagEnvironment.LOCAL,
    });

    expect(result.value).toBe(true);
    expect(result.source).toBe('user-override');
  });

  it('memoises flag lookups between evaluations', async () => {
    const prisma = createPrismaMock();
    const audit = { recordEvent: vi.fn() } as unknown as AuditService;
    const config = createConfigService();

    prisma.featureFlag.findUnique = vi.fn().mockResolvedValue({
      key: 'auth.signup',
      enabled: true,
      rolloutType: FeatureFlagRolloutType.STATIC,
      description: 'signup',
      overrides: [],
    });

    const service = new FeatureFlagsService(prisma, audit, config);
    await service.evaluate('auth.signup', {});
    await service.evaluate('auth.signup', {});

    expect(prisma.featureFlag.findUnique).toHaveBeenCalledTimes(1);
  });

  it('expires cached flags after configured TTL', async () => {
    vi.useFakeTimers();
    const prisma = createPrismaMock();
    const audit = { recordEvent: vi.fn() } as unknown as AuditService;
    const config = createConfigService({ FEATURE_FLAG_CACHE_TTL_SECONDS: 1 });

    const flag = {
      key: 'auth.signup',
      enabled: true,
      rolloutType: FeatureFlagRolloutType.STATIC,
      description: 'signup',
      overrides: [],
    };

    prisma.featureFlag.findUnique = vi.fn().mockResolvedValue(flag);

    const service = new FeatureFlagsService(prisma, audit, config);
    await service.evaluate('auth.signup', {});
    vi.advanceTimersByTime(1100);
    await service.evaluate('auth.signup', {});

    expect(prisma.featureFlag.findUnique).toHaveBeenCalledTimes(2);
  });

  it('updates flag values and records audit', async () => {
    const prisma = createPrismaMock();
    const audit = { recordEvent: vi.fn() } as unknown as AuditService;
    const config = createConfigService();

    prisma.featureFlag.findUnique = vi
      .fn()
      .mockResolvedValueOnce({
        key: 'auth.signup',
        enabled: false,
        rolloutType: FeatureFlagRolloutType.STATIC,
        description: 'signup',
        overrides: [],
      })
      .mockResolvedValueOnce({
        key: 'auth.signup',
        enabled: true,
        rolloutType: FeatureFlagRolloutType.STATIC,
        description: 'signup',
        overrides: [],
      });

    prisma.featureFlag.update = vi.fn().mockResolvedValue({
      key: 'auth.signup',
      enabled: true,
      rolloutType: FeatureFlagRolloutType.STATIC,
      description: 'signup',
    });

    const service = new FeatureFlagsService(prisma, audit, config);
    await service.evaluate('auth.signup', {});
    await service.updateFlag('auth.signup', {
      enabled: true,
      actorType: 'admin',
    });
    const result = await service.evaluate('auth.signup', {});

    expect(prisma.featureFlag.update).toHaveBeenCalled();
    expect(prisma.featureFlag.findUnique).toHaveBeenCalledTimes(2);
    expect(audit.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'feature-flags.update' }),
    );
    expect(result.value).toBe(true);
  });

  it('creates overrides and logs audit', async () => {
    const prisma = createPrismaMock();
    const audit = { recordEvent: vi.fn() } as unknown as AuditService;
    const config = createConfigService();

    prisma.featureFlag.findUnique = vi
      .fn()
      .mockResolvedValueOnce({
        key: 'auth.signup',
        enabled: false,
        rolloutType: FeatureFlagRolloutType.STATIC,
        description: 'signup',
        overrides: [],
      })
      .mockResolvedValueOnce({ id: 'flag-1', key: 'auth.signup' })
      .mockResolvedValueOnce({
        key: 'auth.signup',
        enabled: false,
        rolloutType: FeatureFlagRolloutType.STATIC,
        description: 'signup',
        overrides: [
          {
            environment: FeatureFlagEnvironment.LOCAL,
            userId: null,
            value: true,
          },
        ],
      });
    prisma.featureFlagOverride.upsert = vi.fn().mockResolvedValue({
      environment: FeatureFlagEnvironment.LOCAL,
      userId: null,
      value: true,
    });

    const service = new FeatureFlagsService(prisma, audit, config);
    await service.evaluate('auth.signup', {});
    await service.upsertOverride('auth.signup', {
      value: true,
      notes: 'enable locally',
      actorType: 'admin',
    });
    const result = await service.evaluate('auth.signup', {
      environment: FeatureFlagEnvironment.LOCAL,
    });

    expect(prisma.featureFlagOverride.upsert).toHaveBeenCalled();
    expect(prisma.featureFlag.findUnique).toHaveBeenCalledTimes(3);
    expect(audit.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'feature-flags.override' }),
    );
    expect(result.value).toBe(true);
    expect(result.source).toBe('environment-override');
  });
});
