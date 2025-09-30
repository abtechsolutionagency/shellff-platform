import { createHash } from 'node:crypto';

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
      findUnique: vi.fn(),
      update: vi.fn(),
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
    verifyRefreshToken: vi.fn(),
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
    vi.mocked(tokenService.verifyRefreshToken).mockImplementation(() => {
      throw new Error('verifyRefreshToken not mocked');
    });
    vi.mocked(prisma.refreshToken.updateMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.refreshToken.create).mockResolvedValue({} as any);
    vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(null as any);
    vi.mocked(prisma.refreshToken.update).mockResolvedValue({} as any);
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

  it('refreshes a session when the refresh token is valid', async () => {
    const refreshToken = 'refresh-token';
    const hashed = createHash('sha256').update(refreshToken).digest('hex');
    vi.mocked(tokenService.verifyRefreshToken).mockReturnValue({
      sub: 'user-1',
      jti: 'refresh-id',
      type: 'refresh',
      iat: 1,
      exp: 2,
    } as any);
    vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue({
      id: 'refresh-id',
      userId: 'user-1',
      tokenHash: hashed,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      replacedByTokenId: null,
      issuedAt: new Date(),
      userAgent: null,
      ipAddress: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue({
      id: 'user-1',
      email: 'listener@example.com',
      displayName: 'Listener One',
      phone: null,
      primaryRole: RoleType.LISTENER,
      status: 'active',
      roles: [{ role: { name: RoleType.LISTENER } }],
      creatorProfile: null,
    } as any);

    const session = await service.refresh(refreshToken);

    expect(session.tokens.accessToken).toBe(accessTokenResponse.token);
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1', revokedAt: null },
      }),
    );
    expect(audit.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'auth.refresh', target: 'user-1' }),
    );
  });

  it('revokes refresh tokens on logout', async () => {
    const refreshToken = 'refresh-token';
    const hashed = createHash('sha256').update(refreshToken).digest('hex');
    vi.mocked(tokenService.verifyRefreshToken).mockReturnValue({
      sub: 'user-1',
      jti: 'refresh-id',
      type: 'refresh',
      iat: 1,
      exp: 2,
    } as any);
    vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue({
      id: 'refresh-id',
      userId: 'user-1',
      tokenHash: hashed,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      replacedByTokenId: null,
      issuedAt: new Date(),
      userAgent: null,
      ipAddress: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await service.logout(refreshToken);

    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 'refresh-id' },
      data: { revokedAt: expect.any(Date) },
    });
    expect(audit.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'auth.logout', target: 'user-1' }),
    );
  });

  it('rejects refresh requests for revoked tokens', async () => {
    const refreshToken = 'refresh-token';
    vi.mocked(tokenService.verifyRefreshToken).mockReturnValue({
      sub: 'user-1',
      jti: 'refresh-id',
      type: 'refresh',
      iat: 1,
      exp: 2,
    } as any);
    vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue({
      id: 'refresh-id',
      userId: 'user-1',
      tokenHash: createHash('sha256').update(refreshToken).digest('hex'),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date(),
      replacedByTokenId: null,
      issuedAt: new Date(),
      userAgent: null,
      ipAddress: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await expect(service.refresh(refreshToken)).rejects.toThrow(
      'Refresh token has been revoked',
    );
    expect(audit.recordEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ event: 'auth.refresh' }),
    );
  });
});
