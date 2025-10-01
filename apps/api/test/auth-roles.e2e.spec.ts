import 'reflect-metadata';
import './utils/test-env';
import { AddressInfo } from 'node:net';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { RoleType } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module';
import { hashPassword } from '../src/auth/password.util';
import { PrismaService } from '../src/prisma/prisma.service';
import { createInMemoryPrisma, resetInMemoryPrisma } from './utils/in-memory-prisma.service';
import { MonitoredThrottlerStorageService } from '../src/telemetry/monitored-throttler.storage';

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

describe('Auth & Management e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let throttlerStorage: MonitoredThrottlerStorageService;
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
    throttlerStorage = app.get(MonitoredThrottlerStorageService);
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

  it('signs up a listener and stores a hashed refresh token', async () => {
    const response = await httpRequest(app, 'POST', '/auth/signup', {
      email: 'new@example.com',
      password: 'Password123!',
      displayName: 'New User',
    });

    expect(response.status, JSON.stringify(response.body)).toBe(201);
    expect(response.body.tokens.accessToken).toBeTruthy();

    const tokens = await prisma.refreshToken.findMany({
      where: { userId: response.body.user.id },
    });
    expect(tokens).toHaveLength(1);
    expect(tokens[0].tokenHash).not.toEqual(response.body.tokens.refreshToken);
  });

  it('enforces rate limits on repeated login attempts and surfaces metrics', async () => {
    const password = 'Password123!';
    await prisma.user.create({
      data: {
        email: 'throttle@example.com',
        displayName: 'Throttle Target',
        passwordHash: hashPassword(password),
        primaryRole: RoleType.LISTENER,
        roles: {
          create: { role: { connect: { name: RoleType.LISTENER } } },
        },
      },
    });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const attemptResponse = await httpRequest(app, 'POST', '/auth/login', {
        email: 'throttle@example.com',
        password: 'WrongPassword!',
      });
      expect(attemptResponse.status, JSON.stringify(attemptResponse.body)).toBe(401);
    }

    const blocked = await httpRequest(app, 'POST', '/auth/login', {
      email: 'throttle@example.com',
      password: 'WrongPassword!',
    });
    expect(blocked.status, JSON.stringify(blocked.body)).toBe(429);
    expect(blocked.body).toMatchObject({
      statusCode: 429,
      message: 'Too Many Requests',
    });

    const metrics = await httpRequest(app, 'GET', '/telemetry/metrics');
    expect(metrics.status, JSON.stringify(metrics.body)).toBe(200);
    expect(metrics.body.rateLimit).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: expect.stringContaining('AuthController:login'),
          blockedCount: expect.any(Number),
        }),
      ]),
    );

  });

  it('rejects unauthenticated access to management endpoints', async () => {
    const roles = await httpRequest(app, 'POST', '/roles/grant', {
      userId: 'user-1',
      role: RoleType.ADMIN,
      actorType: 'system',
    });
    expect(roles.status, JSON.stringify(roles.body)).toBe(401);

    const flags = await httpRequest(app, 'PATCH', '/feature-flags/sample', {
      enabled: true,
    });
    expect(flags.status, JSON.stringify(flags.body)).toBe(401);

    const auditLogs = await httpRequest(app, 'GET', '/audit/logs');
    expect(auditLogs.status, JSON.stringify(auditLogs.body)).toBe(401);
  });

  it('returns 403 when authenticated callers lack admin or moderator roles', async () => {
    await httpRequest(app, 'POST', '/auth/signup', {
      email: 'listener-only@example.com',
      password: 'Password123!',
      displayName: 'Listener Only',
    });

    const login = await httpRequest(
      app,
      'POST',
      '/auth/login',
      {
        email: 'listener-only@example.com',
        password: 'Password123!',
      },
      { 'x-forwarded-for': '198.51.100.50' },
    );
    expect(login.status, JSON.stringify(login.body)).toBe(201);

    const accessToken = login.body.tokens.accessToken as string;
    const unauthorizedAttempt = await httpRequest(
      app,
      'POST',
      '/roles/grant',
      {
        userId: login.body.user.id,
        role: RoleType.ADMIN,
        actorType: 'listener',
      },
      {
        Authorization: `Bearer ${accessToken}`,
      },
    );

    expect(unauthorizedAttempt.status, JSON.stringify(unauthorizedAttempt.body)).toBe(403);
  });
});
