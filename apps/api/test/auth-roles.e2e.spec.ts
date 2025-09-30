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
    await app.init();
    const server = app.getHttpServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));
  });

  beforeEach(async () => {
    resetInMemoryPrisma(prismaStub);
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
    const signup = await httpRequest(app, 'POST', '/auth/signup', {
      email: 'listener-only@example.com',
      password: 'Password123!',
      displayName: 'Listener Only',
    });

    const targetUser = await prisma.user.create({
      data: {
        email: 'target2@example.com',
        displayName: 'Target User',
        passwordHash: hashPassword('Password123!'),
        primaryRole: RoleType.LISTENER,
        roles: {
          create: { role: { connect: { name: RoleType.LISTENER } } },
        },
      },
    });

    const roleAttempt = await httpRequest(
      app,
      'POST',
      '/roles/grant',
      {
        userId: targetUser.id,
        role: RoleType.CREATOR,
        actorType: 'user',
        actorUserId: signup.body.user.id,
      },
      { Authorization: `Bearer ${signup.body.tokens.accessToken}` },
    );

    expect(roleAttempt.status, JSON.stringify(roleAttempt.body)).toBe(403);

    const flagAttempt = await httpRequest(
      app,
      'PATCH',
      '/feature-flags/demo-flag',
      {
        enabled: true,
      },
      { Authorization: `Bearer ${signup.body.tokens.accessToken}` },
    );
    expect(flagAttempt.status, JSON.stringify(flagAttempt.body)).toBe(403);

    const auditAttempt = await httpRequest(
      app,
      'GET',
      '/audit/logs',
      undefined,
      { Authorization: `Bearer ${signup.body.tokens.accessToken}` },
    );
    expect(auditAttempt.status, JSON.stringify(auditAttempt.body)).toBe(403);
  });

  it('issues new access tokens on login and revokes previous refresh grants', async () => {
    const password = 'Password123!';
    const listener = await prisma.user.create({
      data: {
        email: 'listener@example.com',
        displayName: 'Listener',
        passwordHash: hashPassword(password),
        primaryRole: RoleType.LISTENER,
        roles: {
          create: { role: { connect: { name: RoleType.LISTENER } } },
        },
      },
      include: {
        roles: { include: { role: true } },
        creatorProfile: true,
      },
    });

    await prisma.refreshToken.create({
      data: {
        id: 'old-token',
        userId: listener.id,
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    const login = await httpRequest(app, 'POST', '/auth/login', {
      email: listener.email,
      password,
    });

    expect(login.status, JSON.stringify(login.body)).toBe(201);
    expect(login.body.tokens.refreshToken).toBeTruthy();

    const storedTokens = await prisma.refreshToken.findMany({
      where: { userId: listener.id },
      orderBy: { createdAt: 'asc' },
    });

    expect(storedTokens).toHaveLength(2);
    const [previous, current] = storedTokens;
    expect(previous.revokedAt).not.toBeNull();
    expect(previous.replacedByTokenId).toBe(current.id);
  });

  it('rotates refresh tokens through the refresh endpoint', async () => {
    const password = 'Password123!';
    const listener = await prisma.user.create({
      data: {
        email: 'refresh@example.com',
        displayName: 'Refresh User',
        passwordHash: hashPassword(password),
        primaryRole: RoleType.LISTENER,
        roles: {
          create: { role: { connect: { name: RoleType.LISTENER } } },
        },
      },
    });

    const login = await httpRequest(app, 'POST', '/auth/login', {
      email: listener.email,
      password,
    });

    expect(login.status, JSON.stringify(login.body)).toBe(201);

    const refresh = await httpRequest(app, 'POST', '/auth/refresh', {
      refreshToken: login.body.tokens.refreshToken,
    });

    expect(refresh.status, JSON.stringify(refresh.body)).toBe(200);
    expect(refresh.body.tokens.refreshToken).not.toEqual(
      login.body.tokens.refreshToken,
    );

    const tokens = await prisma.refreshToken.findMany({
      where: { userId: listener.id },
      orderBy: { createdAt: 'asc' },
    });

    expect(tokens).toHaveLength(2);
    expect(tokens[0].revokedAt).not.toBeNull();
    expect(tokens[0].replacedByTokenId).toBe(tokens[1].id);
  });

  it('revokes refresh tokens on logout', async () => {
    const signup = await httpRequest(app, 'POST', '/auth/signup', {
      email: 'logout@example.com',
      password: 'Password123!',
      displayName: 'Logout User',
    });

    const logout = await httpRequest(app, 'POST', '/auth/logout', {
      refreshToken: signup.body.tokens.refreshToken,
    });

    expect(logout.status, JSON.stringify(logout.body)).toBe(204);

    const tokens = await prisma.refreshToken.findMany({
      where: { userId: signup.body.user.id },
    });

    expect(tokens).toHaveLength(1);
    expect(tokens[0].revokedAt).not.toBeNull();

    const refresh = await httpRequest(app, 'POST', '/auth/refresh', {
      refreshToken: signup.body.tokens.refreshToken,
    });

    expect(refresh.status, JSON.stringify(refresh.body)).toBe(401);
  });

  it('allows authenticated role grants and audits failures', async () => {
    const signup = await httpRequest(app, 'POST', '/auth/signup', {
      email: 'actor@example.com',
      password: 'Password123!',
      displayName: 'Actor User',
    });

    const adminRole = await prisma.role.findUnique({
      where: { name: RoleType.ADMIN },
    });
    if (!adminRole) {
      throw new Error('Admin role missing in test setup');
    }
    await prisma.userRole.create({
      data: {
        userId: signup.body.user.id,
        roleId: adminRole.id,
      },
    });
    await prisma.user.update({
      where: { id: signup.body.user.id },
      data: { primaryRole: RoleType.ADMIN },
    });

    const adminLogin = await httpRequest(app, 'POST', '/auth/login', {
      email: 'actor@example.com',
      password: 'Password123!',
    });

    expect(adminLogin.status, JSON.stringify(adminLogin.body)).toBe(201);

    const accessToken = adminLogin.body.tokens.accessToken as string;
    const targetUser = await prisma.user.create({
      data: {
        email: 'target@example.com',
        displayName: 'Target User',
        passwordHash: hashPassword('Password123!'),
        primaryRole: RoleType.LISTENER,
        roles: {
          create: { role: { connect: { name: RoleType.LISTENER } } },
        },
      },
    });

    const failure = await httpRequest(
      app,
      'POST',
      '/roles/grant',
      {
        userId: targetUser.id,
        role: 'NON_EXISTENT' as unknown as RoleType,
        actorType: 'user',
        actorUserId: adminLogin.body.user.id,
      },
      { Authorization: `Bearer ${accessToken}` },
    );
    expect(failure.status, JSON.stringify(failure.body)).toBe(409);

    const success = await httpRequest(
      app,
      'POST',
      '/roles/grant',
      {
        userId: targetUser.id,
        role: RoleType.CREATOR,
        actorType: 'user',
        actorUserId: adminLogin.body.user.id,
      },
      { Authorization: `Bearer ${accessToken}` },
    );
    expect(success.status, JSON.stringify(success.body)).toBe(201);
    expect(success.body.roles).toContain(RoleType.CREATOR);

    const auditEntries = await prisma.auditLog.findMany({
      where: { event: 'roles.grant.denied' },
    });
    expect(
      auditEntries.some((entry) => {
        const metadata = entry.metadata as Record<string, unknown> | null;
        return metadata?.reason === 'role_not_seeded';
      }),
    ).toBe(true);
  });

  it('records audit entries when login fails', async () => {
    const response = await httpRequest(app, 'POST', '/auth/login', {
      email: 'nobody@example.com',
      password: 'invalid',
    });

    expect(response.status, JSON.stringify(response.body)).toBe(401);

    const auditEntries = await prisma.auditLog.findMany({
      where: { event: 'auth.login.denied' },
    });

    expect(auditEntries).toHaveLength(1);
    const metadata = auditEntries[0].metadata as Record<string, unknown> | null;
    expect(metadata).toMatchObject({ reason: 'invalid_credentials' });
  });
});
