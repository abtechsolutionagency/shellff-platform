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

  it('updates flag values and records audit', async () => {
    const prisma = createPrismaMock();
    const audit = { recordEvent: vi.fn() } as unknown as AuditService;

    prisma.featureFlag.update = vi.fn().mockResolvedValue({
      key: 'auth.signup',
      enabled: true,
      rolloutType: FeatureFlagRolloutType.STATIC,
      description: 'signup',
    });

    const service = new FeatureFlagsService(prisma, audit);
    await service.updateFlag('auth.signup', {
      enabled: true,
      actorType: 'admin',
    });

    expect(prisma.featureFlag.update).toHaveBeenCalled();
    expect(audit.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'feature-flags.update' }),
    );
  });

  it('creates overrides and logs audit', async () => {
    const prisma = createPrismaMock();
    const audit = { recordEvent: vi.fn() } as unknown as AuditService;

    prisma.featureFlag.findUnique = vi.fn().mockResolvedValue({ id: 'flag-1', key: 'auth.signup' });
    prisma.featureFlagOverride.upsert = vi.fn().mockResolvedValue({
      environment: FeatureFlagEnvironment.LOCAL,
      userId: null,
      value: true,
    });

    const service = new FeatureFlagsService(prisma, audit);
    await service.upsertOverride('auth.signup', {
      value: true,
      notes: 'enable locally',
      actorType: 'admin',
    });

    expect(prisma.featureFlagOverride.upsert).toHaveBeenCalled();
    expect(audit.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'feature-flags.override' }),
    );
  });
});
