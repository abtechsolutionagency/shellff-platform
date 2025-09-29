import { RoleType } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

import { RolesService } from './roles.service';

function createPrismaMock() {
  return {
    user: {
      findUnique: vi.fn(),
    },
    role: {
      findUnique: vi.fn(),
    },
    userRole: {
      create: vi.fn(),
    },
    creator: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  } as unknown as PrismaService;
}

describe('RolesService', () => {
  it('grants a new role and logs audit event', async () => {
    const prisma = createPrismaMock();
    const audit = { recordEvent: vi.fn() } as unknown as AuditService;

    prisma.user.findUnique = vi.fn().mockResolvedValue({
      id: 'user-1',
      roles: [{ role: { name: RoleType.LISTENER } }],
    });
    prisma.role.findUnique = vi.fn().mockResolvedValue({ id: 2, name: RoleType.CREATOR });

    const service = new RolesService(prisma, audit);
    const result = await service.grantRole({
      userId: 'user-1',
      role: RoleType.CREATOR,
      actorType: 'admin',
      actorUserId: 'admin-1',
    });

    expect(prisma.userRole.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ roleId: 2 }) }),
    );
    expect(result.roles).toContain(RoleType.CREATOR);
    expect(audit.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'roles.grant' }),
    );
  });

  it('issues a creator code when upgrading a listener', async () => {
    const prisma = createPrismaMock();
    const audit = { recordEvent: vi.fn() } as unknown as AuditService;

    prisma.user.findUnique = vi.fn().mockResolvedValue({
      id: 'user-2',
      roles: [{ role: { name: RoleType.LISTENER } }],
    });
    prisma.role.findUnique = vi.fn().mockResolvedValue({ id: 2, name: RoleType.CREATOR });
    prisma.creator.findUnique = vi.fn().mockResolvedValue(null);

    const creatorCreate = vi.fn().mockResolvedValue({ creatorCode: 'SHF-ABCD-EF12' });
    const userUpdate = vi.fn();
    prisma.$transaction = vi
      .fn()
      .mockImplementation(async (callback: (client: any) => Promise<unknown>) =>
        callback({
          creator: { create: creatorCreate },
          user: { update: userUpdate },
        }),
      );

    const service = new RolesService(prisma, audit);
    const result = await service.upgradeToCreator({
      userId: 'user-2',
      actorType: 'admin',
      actorUserId: 'admin-1',
    });

    expect(creatorCreate).toHaveBeenCalled();
    expect(result.creatorCode).toMatch(/^SHF-/);
    expect(audit.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'creators.issued' }),
    );
    expect(userUpdate).toHaveBeenCalled();
  });
});
