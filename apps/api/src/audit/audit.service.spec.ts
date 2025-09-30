import { describe, expect, it, vi } from 'vitest';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';
type PrismaMock = {
  auditLog: {
    create: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
};
function createPrismaMock(): PrismaService {
  const mock: PrismaMock = {
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  };
  return mock as unknown as PrismaService;
}
describe('AuditService', () => {
  it('returns paginated logs with next cursor when more results exist', async () => {
    const prisma = createPrismaMock();
    const service = new AuditService(prisma);
    const firstLog = {
      id: 'log-1',
      actorUserId: null,
      actorType: 'system',
      event: 'auth.login',
      target: null,
      metadata: null,
      requestId: null,
      createdAt: new Date('2024-01-02T00:00:00.000Z'),
    } as const;
    const secondLog = {
      id: 'log-0',
      actorUserId: null,
      actorType: 'system',
      event: 'auth.login',
      target: null,
      metadata: null,
      requestId: null,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    } as const;
    prisma.auditLog.findMany = vi.fn().mockResolvedValue([firstLog, secondLog]);
    const result = await service.latest(1);
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
      take: 2,
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
    });
    expect(result.logs).toEqual([firstLog]);
    expect(result.nextCursor).toBe(secondLog.id);
  });
  it('applies cursor pagination when provided', async () => {
    const prisma = createPrismaMock();
    const service = new AuditService(prisma);
    prisma.auditLog.findMany = vi.fn().mockResolvedValue([
      {
        id: 'log-2',
        actorUserId: null,
        actorType: 'system',
        event: 'auth.login',
        target: null,
        metadata: null,
        requestId: null,
        createdAt: new Date('2024-01-03T00:00:00.000Z'),
      },
    ]);
    await service.latest(2, 'log-3');
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
      take: 3,
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
      skip: 1,
      cursor: { id: 'log-3' },
    });
  });
});