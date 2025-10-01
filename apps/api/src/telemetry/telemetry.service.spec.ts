import { describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../prisma/prisma.service';

import { TelemetryService } from './telemetry.service';
import type { RateLimitMonitorService } from './rate-limit-monitor.service';

describe('TelemetryService', () => {
  const version = '1.2.3-test';

  beforeEach(() => {
    process.env.npm_package_version = version;
  });

  it('reports health status', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValueOnce([{ '?column?': 1 }]),
    } as unknown as PrismaService;

    const monitor = { snapshot: vi.fn().mockReturnValue([]) } as unknown as RateLimitMonitorService;
    const service = new TelemetryService(prisma, monitor);
    const payload = await service.getHealth();

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(payload.status).toBe('ok');
  });

  it('returns package version string', () => {
    const prisma = {
      $queryRaw: vi.fn(),
    } as unknown as PrismaService;

    const monitor = { snapshot: vi.fn().mockReturnValue([]) } as unknown as RateLimitMonitorService;
    const service = new TelemetryService(prisma, monitor);

    expect(service.getVersion()).toBe(version);
  });

  it('aggregates status payload with health and metrics', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    } as unknown as PrismaService;

    const monitor = { snapshot: vi.fn().mockReturnValue([]) } as unknown as RateLimitMonitorService;
    const service = new TelemetryService(prisma, monitor);
    const status = await service.getStatus();

    expect(status.status).toBe('ok');
    expect(status.version).toBe(version);
    expect(status.metrics).toEqual(
      expect.objectContaining({
        uptimeSeconds: expect.any(Number),
        loadAverage: expect.any(Array),
      }),
    );
  });
});
