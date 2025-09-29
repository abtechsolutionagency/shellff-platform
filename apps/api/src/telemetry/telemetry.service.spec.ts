import { describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../prisma/prisma.service';

import { TelemetryService } from './telemetry.service';

describe('TelemetryService', () => {
  it('reports health status', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValueOnce([{ '?column?': 1 }]),
    } as unknown as PrismaService;

    const service = new TelemetryService(prisma);
    const payload = await service.getHealth();

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(payload.status).toBe('ok');
  });
});
