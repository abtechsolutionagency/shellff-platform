import { createHash } from 'node:crypto';

import { RoleType, SessionStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuditService } from '../audit/audit.service';
import { AnalyticsService } from '../analytics/analytics.service';
import type { AnalyticsService as AnalyticsServiceType } from '../analytics/analytics.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { EnvConfig } from '../config/env.validation';
import { createInMemoryPrisma } from '../../test/utils/in-memory-prisma.service';
import { hashPassword, verifyPassword } from './password.util';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { OtpService } from './otp.service';

function createMocks() {
  const prisma = {
    user: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
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
    userSession: {
      create: vi.fn(),
      update: vi.fn(),
    },
    userDevice: {
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    userRole: {
      create: vi.fn(),
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

  const otpService = {
    issue: vi.fn(),
    verify: vi.fn(),
  } as unknown as OtpService;

  const analyticsService = {
    track: vi.fn(),
  } as unknown as AnalyticsServiceType;

  return { prisma, audit, tokenService, otpService, analyticsService };
}

function createEnvConfig(): EnvConfig {
  return {
    NODE_ENV: 'test',
    APP_PORT: 3000,
    DATABASE_URL: 'postgresql://test:test@localhost:5432/testdb',
    REDIS_URL: 'redis://localhost:6379',
    MINIO_ENDPOINT: 'http://localhost:9000',
    MINIO_ACCESS_KEY: 'test-access',
    MINIO_SECRET_KEY: 'test-secret',
    FEATURE_FLAG_CACHE_TTL_SECONDS: 60,
    JWT_ACCESS_TOKEN_SECRET: 'access-secret',
    JWT_ACCESS_TOKEN_TTL_SECONDS: 900,
    JWT_REFRESH_TOKEN_SECRET: 'refresh-secret',
    JWT_REFRESH_TOKEN_TTL_SECONDS: 60 * 60 * 24,
  } satisfies EnvConfig;
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
  let otpService: OtpService;
  let analyticsService: AnalyticsServiceType;
  let service: AuthService;

  beforeEach(() => {
    const mocks = createMocks();
    prisma = mocks.prisma;
    audit = mocks.audit;
    tokenService = mocks.tokenService;
    otpService = mocks.otpService;
    analyticsService = mocks.analyticsService;
    service = new AuthService(prisma, audit, analyticsService, tokenService, otpService);

    vi.mocked(tokenService.signAccessToken).mockReturnValue(accessTokenResponse);
    vi.mocked(tokenService.signRefreshToken).mockReturnValue(refreshTokenResponse);
    vi.mocked(tokenService.verifyRefreshToken).mockImplementation(() => {
      throw new Error('verifyRefreshToken not mocked');
    });
    vi.mocked(prisma.refreshToken.updateMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.refreshToken.create).mockResolvedValue({} as any);
    vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(null as any);
    vi.mocked(prisma.refreshToken.update).mockResolvedValue({} as any);
    vi.mocked(prisma.userSession.create).mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      sessionTokenHash: 'hash',
      status: 'ACTIVE',
      ipAddress: null,
      userAgent: null,
      location: null,
      expiresAt: refreshTokenResponse.expiresAt,
      lastSeenAt: refreshTokenResponse.issuedAt,
      signedOutAt: null,
      deviceId: null,
      createdAt: refreshTokenResponse.issuedAt,
      updatedAt: refreshTokenResponse.issuedAt,
    } as any);
    vi.mocked(prisma.userSession.update).mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      sessionTokenHash: 'hash',
      status: 'ACTIVE',
      ipAddress: null,
      userAgent: null,
      location: null,
      expiresAt: refreshTokenResponse.expiresAt,
      lastSeenAt: refreshTokenResponse.issuedAt,
      signedOutAt: null,
      deviceId: null,
      createdAt: refreshTokenResponse.issuedAt,
      updatedAt: refreshTokenResponse.issuedAt,
    } as any);
    vi.mocked(prisma.userDevice.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.userDevice.create).mockResolvedValue({ id: 'device-1' } as any);

    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) =>
      callback({
        user: prisma.user,
        userRole: prisma.userRole,
        refreshToken: prisma.refreshToken,
        userSession: prisma.userSession,
        userDevice: prisma.userDevice,
      }),
    );
  });

  it('registers a listener, issues tokens, and records audit events', async () => {
    const createdUser = {
      id: 'user-1',
      email: 'listener@example.com',
      displayName: 'Listener One',
      phone: null,
      primaryRole: 'LISTENER',
      status: 'active',
      publicId: 'USR-LISTEN-0001',
    };

    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValue(null);
    vi.mocked(prisma.role.findUnique).mockResolvedValue({ id: 1, name: RoleType.LISTENER } as any);
    vi.mocked(prisma.user.create).mockResolvedValue(createdUser as any);
    vi.mocked(prisma.userRole.create).mockResolvedValue({} as any);
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
    expect(session.user.publicId).toBe('USR-LISTEN-0001');
    expect(session.session.id).toBe('session-1');
    expect(prisma.refreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tokenHash: expect.not.stringContaining(refreshTokenResponse.token),
          sessionId: 'session-1',
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
      publicId: 'USR-LISTEN-0001',
      passwordHash,
      roles: [{ role: { name: RoleType.LISTENER } }],
      creatorProfile: null,
    } as any);

    const session = await service.login({
      email: 'listener@example.com',
      password: 'correct-password',
    });

    expect(session.tokens.accessToken).toBe(accessTokenResponse.token);
    expect(session.tokens.sessionId).toBe('session-1');
    expect(session.user.publicId).toBe('USR-LISTEN-0001');
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
      sessionId: 'session-1',
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
      publicId: 'USR-LISTEN-0001',
      roles: [{ role: { name: RoleType.LISTENER } }],
      creatorProfile: null,
    } as any);

    const session = await service.refresh(refreshToken);

    expect(session.tokens.accessToken).toBe(accessTokenResponse.token);
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1', sessionId: 'session-1', revokedAt: null },
      }),
    );
    expect(session.session.id).toBe('session-1');
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
      sessionId: 'session-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await service.logout(refreshToken);

    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 'refresh-id' },
      data: { revokedAt: expect.any(Date) },
    });
    expect(prisma.userSession.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: expect.objectContaining({
        status: 'TERMINATED',
        signedOutAt: expect.any(Date),
      }),
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

describe('AuthService session persistence with in-memory Prisma', () => {
  const loginDto = {
    email: 'listener@example.com',
    password: 'StrongPassword!1',
  } as const;

  function buildTokenService(): TokenService {
    const config = createEnvConfig();
    const configService = new ConfigService<EnvConfig, true>(config);
    return new TokenService(configService);
  }

  async function seedUser(prisma: PrismaService) {
    const role = await prisma.role.create({ data: { name: RoleType.LISTENER } });
    const user = await prisma.user.create({
      data: {
        email: loginDto.email,
        displayName: 'Listener One',
        passwordHash: hashPassword(loginDto.password),
      },
    });
    await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
    return user;
  }

  function deviceMetadata(fingerprint: string, overrides: Partial<{ ip: string; userAgent: string }> = {}) {
    return {
      ipAddress: overrides.ip ?? '203.0.113.10',
      userAgent: overrides.userAgent ?? 'Mozilla/5.0 (Macintosh)',
      device: {
        fingerprint,
        name: 'MacBook Pro',
        type: 'desktop',
        platform: 'macOS',
        osVersion: '14.3',
        appVersion: '1.0.0',
        trusted: true,
      },
    };
  }

  it('creates device rows, persists sessions, and updates them on refresh', async () => {
    const prisma = createInMemoryPrisma();
    const auditService = new AuditService(prisma);
    const tokenService = buildTokenService();
    const otpService = new OtpService(prisma);
    const analyticsService = new AnalyticsService(auditService);
    const authService = new AuthService(
      prisma,
      auditService,
      analyticsService,
      tokenService,
      otpService,
    );
    const user = await seedUser(prisma);

    const metadata = deviceMetadata('fp-1');
    const session = await authService.login(loginDto, metadata);

    const devices = await prisma.userDevice.findMany({ where: { userId: user.id } });
    expect(devices).toHaveLength(1);
    expect(devices[0]).toEqual(
      expect.objectContaining({
        fingerprint: 'fp-1',
        deviceName: 'MacBook Pro',
        trusted: true,
      }),
    );

    const sessions = await prisma.userSession.findMany({ where: { userId: user.id } });
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toEqual(
      expect.objectContaining({
        deviceId: devices[0].id,
        status: SessionStatus.ACTIVE,
      }),
    );

    const refreshed = await authService.refresh(session.tokens.refreshToken, {
      ...metadata,
      ipAddress: '203.0.113.11',
    });

    const refreshRecords = await prisma.refreshToken.findMany({ where: { userId: user.id } });
    expect(refreshRecords).toHaveLength(2);
    const originalRecord = refreshRecords.find((entry) => entry.id === session.tokens.refreshTokenId);
    const replacementRecord = refreshRecords.find((entry) => entry.id === refreshed.tokens.refreshTokenId);
    expect(originalRecord?.revokedAt).toBeInstanceOf(Date);
    expect(originalRecord?.replacedByTokenId).toBe(refreshed.tokens.refreshTokenId);
    expect(replacementRecord?.revokedAt).toBeNull();

    const persistedSession = await prisma.userSession.findUnique({ where: { id: session.session.id } });
    expect(persistedSession).toEqual(
      expect.objectContaining({
        id: session.session.id,
        deviceId: devices[0].id,
        ipAddress: '203.0.113.11',
        status: SessionStatus.ACTIVE,
      }),
    );
  });

  it('revokes only the targeted device session on logout', async () => {
    const prisma = createInMemoryPrisma();
    const auditService = new AuditService(prisma);
    const tokenService = buildTokenService();
    const otpService = new OtpService(prisma);
    const analyticsService = new AnalyticsService(auditService);
    const authService = new AuthService(
      prisma,
      auditService,
      analyticsService,
      tokenService,
      otpService,
    );
    const user = await seedUser(prisma);

    const sessionA = await authService.login(loginDto, deviceMetadata('fp-1', { ip: '198.51.100.2' }));
    const sessionB = await authService.login(loginDto, deviceMetadata('fp-2', { ip: '198.51.100.3', userAgent: 'Mozilla/5.0 (iPhone)' }));

    let sessions = await prisma.userSession.findMany({ where: { userId: user.id } });
    expect(sessions).toHaveLength(2);

    await authService.logout(sessionA.tokens.refreshToken, deviceMetadata('fp-1', { ip: '198.51.100.4' }));

    const terminatedSession = await prisma.userSession.findUnique({ where: { id: sessionA.session.id } });
    expect(terminatedSession).toEqual(
      expect.objectContaining({
        status: SessionStatus.TERMINATED,
        signedOutAt: expect.any(Date),
      }),
    );

    const activeSession = await prisma.userSession.findUnique({ where: { id: sessionB.session.id } });
    expect(activeSession?.status).toBe(SessionStatus.ACTIVE);

    const refreshA = await prisma.refreshToken.findUnique({ where: { id: sessionA.tokens.refreshTokenId } });
    const refreshB = await prisma.refreshToken.findUnique({ where: { id: sessionB.tokens.refreshTokenId } });
    expect(refreshA?.revokedAt).toBeInstanceOf(Date);
    expect(refreshA?.sessionId).toBe(sessionA.session.id);
    expect(refreshB?.revokedAt).toBeNull();

    sessions = await prisma.userSession.findMany({ where: { userId: user.id } });
    const activeCount = sessions.filter((entry) => entry.status === SessionStatus.ACTIVE).length;
    const terminatedCount = sessions.filter((entry) => entry.status === SessionStatus.TERMINATED).length;
    expect(activeCount).toBe(1);
    expect(terminatedCount).toBe(1);
  });
});

describe('AuthService OTP and password reset flows', () => {
  const loginDto = {
    email: 'listener@example.com',
    password: 'StrongPassword!1',
  } as const;

  function buildTokenService(): TokenService {
    const config = createEnvConfig();
    const configService = new ConfigService<EnvConfig, true>(config);
    return new TokenService(configService);
  }

  async function seedUser(prisma: PrismaService) {
    const role = await prisma.role.create({ data: { name: RoleType.LISTENER } });
    const user = await prisma.user.create({
      data: {
        email: loginDto.email,
        displayName: 'Listener One',
        passwordHash: hashPassword(loginDto.password),
      },
    });
    await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
    return user;
  }

  function metadata(fingerprint: string) {
    return {
      ipAddress: '203.0.113.20',
      userAgent: 'Vitest Agent',
      device: {
        fingerprint,
        name: 'QA Device',
        type: 'desktop',
        platform: 'Linux',
        osVersion: '6.8',
        trusted: true,
      },
    };
  }

  it('issues, verifies, and consumes login OTP codes', async () => {
    const prisma = createInMemoryPrisma();
    const auditService = new AuditService(prisma);
    const tokenService = buildTokenService();
    const otpService = new OtpService(prisma);
    const analyticsService = new AnalyticsService(auditService);
    const authService = new AuthService(
      prisma,
      auditService,
      analyticsService,
      tokenService,
      otpService,
    );
    const user = await seedUser(prisma);

    const request = await authService.requestLoginOtp(loginDto.email, metadata('fp-otp'));
    expect(request.delivered).toBe(true);
    expect(request.testCode).toMatch(/\d{6}/);

    const otpRecords = await prisma.otpCode.findMany({ where: { userId: user.id } });
    expect(otpRecords).toHaveLength(1);
    expect(otpRecords[0]).toEqual(
      expect.objectContaining({
        type: 'LOGIN',
        consumedAt: null,
      }),
    );

    const session = await authService.verifyLoginOtp(
      loginDto.email,
      request.testCode!,
      metadata('fp-otp'),
    );
    expect(session.user.id).toBe(user.id);

    const consumed = await prisma.otpCode.findFirst({ where: { userId: user.id } });
    expect(consumed?.consumedAt).toBeInstanceOf(Date);

    const analyticsLogs = await prisma.auditLog.findMany({
      where: { event: 'analytics.auth.otp.login.verified' },
    });
    expect(analyticsLogs.length).toBeGreaterThan(0);
  });

  it('resets passwords and revokes sessions through OTP verification', async () => {
    const prisma = createInMemoryPrisma();
    const auditService = new AuditService(prisma);
    const tokenService = buildTokenService();
    const otpService = new OtpService(prisma);
    const analyticsService = new AnalyticsService(auditService);
    const authService = new AuthService(
      prisma,
      auditService,
      analyticsService,
      tokenService,
      otpService,
    );
    const user = await seedUser(prisma);

    await authService.login(loginDto, metadata('fp-reset'));

    const request = await authService.requestPasswordReset(loginDto.email, metadata('fp-reset'));
    expect(request.delivered).toBe(true);
    const code = request.testCode!;

    await authService.confirmPasswordReset(
      loginDto.email,
      code,
      'NewPassword!2',
      metadata('fp-reset'),
    );

    const updatedUser = await prisma.user.findUniqueOrThrow({ where: { email: loginDto.email } });
    expect(verifyPassword('NewPassword!2', updatedUser.passwordHash)).toBe(true);

    const tokens = await prisma.refreshToken.findMany({ where: { userId: user.id } });
    expect(tokens.every((entry) => entry.revokedAt)).toBe(true);

    const sessions = await prisma.userSession.findMany({ where: { userId: user.id } });
    expect(sessions.every((entry) => entry.status !== SessionStatus.ACTIVE)).toBe(true);

    await expect(
      authService.confirmPasswordReset(
        loginDto.email,
        code,
        'AnotherPassword!3',
        metadata('fp-reset'),
      ),
    ).rejects.toThrow('Invalid reset request');

    const analyticsLogs = await prisma.auditLog.findMany({
      where: { event: 'analytics.auth.password.reset.completed' },
    });
    expect(analyticsLogs.length).toBeGreaterThan(0);
  });
});
