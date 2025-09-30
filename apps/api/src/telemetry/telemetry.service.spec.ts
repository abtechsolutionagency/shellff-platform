import { describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../prisma/prisma.service';

import { TelemetryService } from './telemetry.service';

describe('TelemetryService', () => {
  const version = '1.2.3-test';

  beforeEach(() => {
    process.env.npm_package_version = version;
  });

  it('reports health status', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValueOnce([{ '?column?': 1 }]),
    } as unknown as PrismaService;

    const service = new TelemetryService(prisma);
    const payload = await service.getHealth();

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(payload.status).toBe('ok');
  });

  it('returns package version string', () => {
    const prisma = {
      $queryRaw: vi.fn(),
    } as unknown as PrismaService;

    const service = new TelemetryService(prisma);

    expect(service.getVersion()).toBe(version);
  });

  it('aggregates status payload with health and metrics', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    } as unknown as PrismaService;

    const service = new TelemetryService(prisma);
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
