import {
  FeatureFlagEnvironment,
  FeatureFlagRolloutType,
} from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

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

describe('FeatureFlagsService', () => {
  it('evaluates with user overrides first', async () => {
    const prisma = createPrismaMock();
    const audit = { recordEvent: vi.fn() } as unknown as AuditService;

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

    const service = new FeatureFlagsService(prisma, audit);
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

    prisma.featureFlag.findUnique = vi.fn().mockResolvedValue({
      key: 'auth.signup',
      enabled: true,
      rolloutType: FeatureFlagRolloutType.STATIC,
      description: 'signup',
      overrides: [],
    });

    const service = new FeatureFlagsService(prisma, audit);
    await service.evaluate('auth.signup', {});
    await service.evaluate('auth.signup', {});

    expect(prisma.featureFlag.findUnique).toHaveBeenCalledTimes(1);
  });

  it('updates flag values and records audit', async () => {
    const prisma = createPrismaMock();
    const audit = { recordEvent: vi.fn() } as unknown as AuditService;

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

    const service = new FeatureFlagsService(prisma, audit);
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

    const service = new FeatureFlagsService(prisma, audit);
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
