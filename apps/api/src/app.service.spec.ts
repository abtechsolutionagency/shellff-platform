import { describe, expect, it, vi } from 'vitest';

import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppService', () => {
  it('returns health payload', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValueOnce([{ '?column?': 1 }]),
    } as unknown as PrismaService;

    const service = new AppService(prisma);
    const payload = await service.getHealth();

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(payload.status).toBe('ok');
  });
});
