import { RoleType } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuditService } from '../audit/audit.service';
import type { PrismaService } from '../prisma/prisma.service';
import { hashPassword } from './password.util';
import { AuthService } from './auth.service';
import type { TokenService } from './token.service';

function createMocks() {
  const prisma = {
    user: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    role: {
      findUnique: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  } as unknown as PrismaService;

  const audit = {
    recordEvent: vi.fn(),
  } as unknown as AuditService;

  const tokenService = {
    signAccessToken: vi.fn(),
    signRefreshToken: vi.fn(),
  } as unknown as TokenService;

  return { prisma, audit, tokenService };
}

describe('AuthService', () => {
  const accessTokenResponse = {
    token: 'access-token',
    payload: {
      sub: 'user-1',
      roles: ['LISTENER'],
      primaryRole: 'LISTENER',
      type: 'access',
      iat: 1,
      exp: 2,
    },
    issuedAt: new Date(1_000),
    expiresAt: new Date(2_000),
  } as const;

  const refreshTokenResponse = {
    token: 'refresh-token',
    payload: {
      sub: 'user-1',
      jti: 'refresh-id',
      type: 'refresh',
      iat: 1,
      exp: 2,
    },
    issuedAt: new Date(1_000),
    expiresAt: new Date(2_000),
  } as const;

  let prisma: PrismaService;
  let audit: AuditService;
  let tokenService: TokenService;
  let service: AuthService;

  beforeEach(() => {
    const mocks = createMocks();
    prisma = mocks.prisma;
    audit = mocks.audit;
    tokenService = mocks.tokenService;
    service = new AuthService(prisma, audit, tokenService);

    vi.mocked(tokenService.signAccessToken).mockReturnValue(accessTokenResponse);
    vi.mocked(tokenService.signRefreshToken).mockReturnValue(refreshTokenResponse);
    vi.mocked(prisma.refreshToken.updateMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.refreshToken.create).mockResolvedValue({} as any);
  });

  it('registers a listener, issues tokens, and records audit events', async () => {
    const createdUser = {
      id: 'user-1',
      email: 'listener@example.com',
      displayName: 'Listener One',
      phone: null,
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

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.role.findUnique).mockResolvedValue({ id: 1, name: RoleType.LISTENER } as any);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => callback(tx));
    vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue({
      ...createdUser,
      roles: [{ role: { name: RoleType.LISTENER } }],
      creatorProfile: null,
    } as any);

    const session = await service.register({
      email: 'listener@example.com',
      password: 'Password123!',
      displayName: 'Listener One',
    });

    expect(session.tokens.refreshToken).toBe(refreshTokenResponse.token);
    expect(prisma.refreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tokenHash: expect.not.stringContaining(refreshTokenResponse.token),
        }),
      }),
    );
    expect(audit.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'auth.signup', target: 'user-1' }),
    );
  });

  it('issues tokens on successful login', async () => {
    const passwordHash = hashPassword('correct-password');
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      email: 'listener@example.com',
      displayName: 'Listener One',
      phone: null,
      primaryRole: 'LISTENER',
      status: 'active',
      passwordHash,
      roles: [{ role: { name: RoleType.LISTENER } }],
      creatorProfile: null,
    } as any);

    const session = await service.login({
      email: 'listener@example.com',
      password: 'correct-password',
    });

    expect(session.tokens.accessToken).toBe(accessTokenResponse.token);
    expect(audit.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'auth.login', target: 'user-1' }),
    );
  });

  it('records audit events when credentials are invalid', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(
      service.login({ email: 'listener@example.com', password: 'bad-pass' }),
    ).rejects.toThrow('Invalid email or password');

    expect(audit.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'auth.login.denied',
        target: 'listener@example.com',
      }),
    );
  });
});
