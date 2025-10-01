import 'reflect-metadata';
import './utils/test-env';
import { AddressInfo } from 'node:net';
import { INestApplication } from '@nestjs/common';
import { ThrottlerStorageService } from '@nestjs/throttler';
import { Test } from '@nestjs/testing';
import { RoleType } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { createInMemoryPrisma, resetInMemoryPrisma } from './utils/in-memory-prisma.service';

async function httpRequest(
  app: INestApplication,
  method: string,
  path: string,
  body?: Record<string, unknown>,
  headers: Record<string, string> = {},
) {
  const address = app.getHttpServer().address() as AddressInfo;
  const url = new URL(path, `http://127.0.0.1:${address.port}`);
  const response = await fetch(url, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    data = text;
  }

  return { status: response.status, body: data };
}

function deviceHeaders(fingerprint: string, overrides: Record<string, string> = {}) {
  return {
    'x-device-fingerprint': fingerprint,
    'x-device-name': overrides['x-device-name'] ?? `Device-${fingerprint}`,
    'x-device-type': overrides['x-device-type'] ?? 'desktop',
    'x-device-platform': overrides['x-device-platform'] ?? 'test-os',
    'x-device-os-version': overrides['x-device-os-version'] ?? '1.0',
    'x-app-version': overrides['x-app-version'] ?? '1.0.0-test',
    'x-device-trusted': overrides['x-device-trusted'] ?? 'true',
    'x-forwarded-for': overrides['x-forwarded-for'] ?? '203.0.113.5',
    ...overrides,
  };
}

describe('Cross-channel auth journeys', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let throttlerStorage: ThrottlerStorageService;
  const prismaStub = createInMemoryPrisma();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaStub)
      .compile();

    app = moduleRef.createNestApplication();
    prisma = app.get(PrismaService);
    throttlerStorage = app.get(ThrottlerStorageService);
    await app.init();
    const server = app.getHttpServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));
  });

  beforeEach(async () => {
    resetInMemoryPrisma(prismaStub);
    throttlerStorage.reset();
    prisma = app.get(PrismaService);
    await prisma.role.createMany({
      data: [
        { name: RoleType.LISTENER },
        { name: RoleType.CREATOR },
        { name: RoleType.ADMIN },
        { name: RoleType.MODERATOR },
      ],
      skipDuplicates: true,
    });
  });

  afterAll(async () => {
    const server = app.getHttpServer();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await app.close();
  });

  it('maintains session continuity across password, OTP, and reset flows', async () => {
    const email = 'journey@example.com';
    const password = 'Password123!';

    const signup = await httpRequest(
      app,
      'POST',
      '/auth/signup',
      {
        email,
        password,
        displayName: 'Journey User',
      },
      deviceHeaders('fp-signup'),
    );
    expect(signup.status, JSON.stringify(signup.body)).toBe(201);
    const userId = signup.body.user.id as string;
    const signupSessionId = signup.body.session.id as string;

    const login = await httpRequest(
      app,
      'POST',
      '/auth/login',
      { email, password },
      deviceHeaders('fp-desktop'),
    );
    expect(login.status, JSON.stringify(login.body)).toBe(201);
    const firstSessionId = login.body.session.id as string;
    const firstRefreshToken = login.body.tokens.refreshToken as string;

    const otpRequest = await httpRequest(
      app,
      'POST',
      '/auth/otp/request',
      { email },
      deviceHeaders('fp-mobile', { 'x-forwarded-for': '198.51.100.7' }),
    );
    expect(otpRequest.status, JSON.stringify(otpRequest.body)).toBe(201);
    expect(otpRequest.body.testCode).toMatch(/\d{6}/);

    const otpVerify = await httpRequest(
      app,
      'POST',
      '/auth/otp/verify',
      { email, code: otpRequest.body.testCode },
      deviceHeaders('fp-mobile'),
    );
    expect(otpVerify.status, JSON.stringify(otpVerify.body)).toBe(201);
    const secondSessionId = otpVerify.body.session.id as string;

    const sessions = await prisma.userSession.findMany({ where: { userId } });
    expect(sessions).toHaveLength(3);
    const deviceIds = new Set(sessions.map((session) => session.deviceId));
    expect(deviceIds.size).toBe(3);

    const passwordResetRequest = await httpRequest(
      app,
      'POST',
      '/auth/password-reset/request',
      { email },
      deviceHeaders('fp-mobile'),
    );
    expect(passwordResetRequest.status, JSON.stringify(passwordResetRequest.body)).toBe(201);

    const passwordResetConfirm = await httpRequest(
      app,
      'POST',
      '/auth/password-reset/confirm',
      {
        email,
        code: passwordResetRequest.body.testCode,
        newPassword: 'Password456!',
      },
      deviceHeaders('fp-mobile'),
    );
    expect(passwordResetConfirm.status, JSON.stringify(passwordResetConfirm.body)).toBe(200);
    expect(passwordResetConfirm.body).toEqual({ success: true });

    const activeSessions = await prisma.userSession.findMany({ where: { userId, status: 'ACTIVE' } });
    expect(activeSessions).toHaveLength(0);

    const refreshAfterReset = await httpRequest(
      app,
      'POST',
      '/auth/refresh',
      { refreshToken: firstRefreshToken },
      deviceHeaders('fp-desktop'),
    );
    expect(refreshAfterReset.status, JSON.stringify(refreshAfterReset.body)).toBe(401);

    const loginAfterReset = await httpRequest(
      app,
      'POST',
      '/auth/login',
      { email, password: 'Password456!' },
      deviceHeaders('fp-mobile'),
    );
    expect(loginAfterReset.status, JSON.stringify(loginAfterReset.body)).toBe(201);
    const postResetSessionId = loginAfterReset.body.session.id as string;

    const analyticsEvents = await prisma.auditLog.findMany({
      where: { event: { contains: 'analytics.auth' } },
    });
    const trackedEvents = analyticsEvents.map((entry) => entry.event);
    expect(trackedEvents).toEqual(
      expect.arrayContaining([
        'analytics.auth.login.success',
        'analytics.auth.otp.login.verified',
        'analytics.auth.password.reset.completed',
      ]),
    );

    const logout = await httpRequest(
      app,
      'POST',
      '/auth/logout',
      { refreshToken: loginAfterReset.body.tokens.refreshToken },
      deviceHeaders('fp-mobile'),
    );
    expect(logout.status, JSON.stringify(logout.body)).toBe(204);

    const finalSessions = await prisma.userSession.findMany({ where: { userId } });
    const terminatedSessions = finalSessions.filter((session) => session.status !== 'ACTIVE');
    expect(terminatedSessions.length).toBe(finalSessions.length);
    expect(terminatedSessions.map((session) => session.id)).toEqual(
      expect.arrayContaining([
        signupSessionId,
        firstSessionId,
        secondSessionId,
        postResetSessionId,
      ]),
    );
  });
});
