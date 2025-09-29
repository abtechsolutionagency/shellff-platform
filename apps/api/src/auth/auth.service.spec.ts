import { describe, expect, it, vi } from 'vitest';

import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

import { AuthService } from './auth.service';
import { hashPassword } from './password.util';

function createMocks() {
  const prisma = {
    user: {
      findUnique: vi.fn(),
    },
    role: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  } as unknown as PrismaService;

  const audit = {
    recordEvent: vi.fn(),
  } as unknown as AuditService;

  return { prisma, audit };
}

describe('AuthService', () => {
  it('registers a listener and records an audit event', async () => {
    const { prisma, audit } = createMocks();
    const createdUser = {
      id: 'user-1',
      email: 'listener@example.com',
      displayName: 'Listener One',
      phone: null,
      passwordHash: 'hash',
      primaryRole: 'LISTENER',
      status: 'active',
    };

    const tx = {
      user: {
        create: vi.fn().mockResolvedValue(createdUser),
      },
      userRole: {
        create: vi.fn(),
      },
    };

    prisma.user.findUnique = vi.fn().mockResolvedValue(null);
    prisma.role.findUnique = vi.fn().mockResolvedValue({ id: 1, name: 'LISTENER' });
    prisma.$transaction = vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) =>
      callback(tx),
    ) as unknown as PrismaService['$transaction'];

    const service = new AuthService(prisma, audit);
    const result = await service.register({
      email: 'listener@example.com',
      password: 'password123',
      displayName: 'Listener One',
    });

    expect(tx.user.create).toHaveBeenCalled();
    const createArgs = tx.user.create.mock.calls[0][0];
    expect(createArgs.data.passwordHash).toMatch(/^[a-f0-9]+:[a-f0-9]+$/);
    expect(result.user.roles).toContain('LISTENER');
    expect(audit.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'auth.signup', target: 'user-1' }),
    );
  });

  it('validates credentials during login', async () => {
    const { prisma, audit } = createMocks();
    const passwordHash = hashPassword('correct-password');

    prisma.user.findUnique = vi
      .fn()
      .mockResolvedValue({
        id: 'user-2',
        email: 'listener@example.com',
        displayName: 'Listener Two',
        phone: null,
        primaryRole: 'LISTENER',
        status: 'active',
        passwordHash,
        roles: [{ role: { name: 'LISTENER' } }],
        creatorProfile: null,
      });

    const service = new AuthService(prisma, audit);
    const session = await service.login({
      email: 'listener@example.com',
      password: 'correct-password',
    });

    expect(session.user.email).toBe('listener@example.com');
    expect(audit.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'auth.login', target: 'user-2' }),
    );
  });
});
