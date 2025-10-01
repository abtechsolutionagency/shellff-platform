import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma, RefreshToken, RoleType, SessionStatus } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';

import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

import { LoginDto } from './dto/login.dto';
import { AuthSession } from './dto/session.dto';
import { SignupDto } from './dto/signup.dto';
import { hashPassword, verifyPassword } from './password.util';
import { TokenService } from './token.service';
import type { SessionMetadata } from './session-metadata';

type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    roles: { include: { role: true } };
    creatorProfile: true;
  };
}>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly tokenService: TokenService,
  ) {}

  async register(
    dto: SignupDto,
    metadata: SessionMetadata = {},
  ): Promise<AuthSession> {
    const normalizedEmail = dto.email.toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const listenerRole = await this.prisma.role.findUnique({
      where: { name: RoleType.LISTENER },
    });

    if (!listenerRole) {
      throw new ConflictException('Listener role has not been seeded');
    }

    const passwordHash = hashPassword(dto.password);

    const createdUser = await this.prisma.$transaction(async (tx) => {
      const publicId = await this.generateUniquePublicId(tx, normalizedEmail);
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          displayName: dto.displayName,
          phone: dto.phone,
          passwordHash,
          primaryRole: RoleType.LISTENER,
          publicId,
        },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: listenerRole.id,
        },
      });

      return user;
    });

    await this.auditService.recordEvent({
      actorUserId: createdUser.id,
      actorType: 'user',
      event: 'auth.signup',
      target: createdUser.id,
      metadata: {
        email: createdUser.email,
        roles: [RoleType.LISTENER],
      },
    });

    const hydrated = await this.loadUserProfile(createdUser.id);
    return this.issueSession(hydrated, metadata);
  }

  async login(
    dto: LoginDto,
    metadata: SessionMetadata = {},
  ): Promise<AuthSession> {
    const normalizedEmail = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        roles: {
          include: { role: true },
        },
        creatorProfile: true,
      },
    });

    if (!user || !verifyPassword(dto.password, user.passwordHash)) {
      await this.auditService.recordEvent({
        actorType: 'auth',
        event: 'auth.login.denied',
        target: normalizedEmail,
        metadata: {
          reason: 'invalid_credentials',
          email: normalizedEmail,
        },
      });

      throw new UnauthorizedException('Invalid email or password');
    }

    const session = await this.issueSession(user, metadata);

    await this.auditService.recordEvent({
      actorUserId: user.id,
      actorType: 'user',
      event: 'auth.login',
      target: user.id,
      metadata: {
        email: user.email,
        roles: session.user.roles,
      },
    });

    return session;
  }

  async refresh(
    refreshToken: string,
    metadata: SessionMetadata = {},
  ): Promise<AuthSession> {
    const { payload, record } = await this.validateRefreshGrant(refreshToken);
    const user = await this.loadUserProfile(payload.sub);
    const session = await this.issueSession(user, metadata, {
      sessionId: record.sessionId ?? undefined,
    });

    await this.auditService.recordEvent({
      actorUserId: user.id,
      actorType: 'user',
      event: 'auth.refresh',
      target: user.id,
      metadata: {
        replacedTokenId: payload.jti,
        sessionId: session.session.id,
      },
    });

    return session;
  }

  async logout(
    refreshToken: string,
    metadata: SessionMetadata = {},
  ): Promise<void> {
    const { payload, record } = await this.validateRefreshGrant(refreshToken);
    const now = new Date();

    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: now },
    });

    if (record.sessionId) {
      await this.prisma.userSession.update({
        where: { id: record.sessionId },
        data: {
          status: SessionStatus.TERMINATED,
          signedOutAt: now,
          lastSeenAt: now,
          ipAddress: metadata.ipAddress ?? null,
          userAgent: metadata.userAgent ?? null,
        },
      });
    }

    await this.auditService.recordEvent({
      actorUserId: payload.sub,
      actorType: 'user',
      event: 'auth.logout',
      target: payload.sub,
      metadata: {
        refreshTokenId: record.id,
        sessionId: record.sessionId ?? null,
      },
    });
  }

  private async issueSession(
    user: UserWithRelations,
    metadata: SessionMetadata = {},
    options: { sessionId?: string } = {},
  ): Promise<AuthSession> {
    const uniqueRoles = Array.from(
      new Set(user.roles.map((assignment) => assignment.role.name)),
    );

    const accessToken = this.tokenService.signAccessToken({
      sub: user.id,
      roles: uniqueRoles,
      primaryRole: user.primaryRole,
    });

    const refreshTokenId = randomUUID();
    const refreshToken = this.tokenService.signRefreshToken({
      sub: user.id,
      jti: refreshTokenId,
    });
    const hashedRefreshToken = this.hashToken(refreshToken.token);
    const now = new Date();

    const { sessionRecord, deviceId, publicId } = await this.prisma.$transaction(
      async (tx) => {
        const ensuredPublicId = await this.ensureUserPublicId(tx, user);
        const device = await this.upsertDevice(tx, user.id, metadata);

        const session = options.sessionId
          ? await tx.userSession.update({
              where: { id: options.sessionId },
              data: {
                sessionTokenHash: hashedRefreshToken,
                status: SessionStatus.ACTIVE,
                ipAddress: metadata.ipAddress ?? null,
                userAgent: metadata.userAgent ?? null,
                location: metadata.location ?? undefined,
                expiresAt: refreshToken.expiresAt,
                lastSeenAt: now,
                deviceId: device?.id ?? null,
              },
            })
          : await tx.userSession.create({
              data: {
                userId: user.id,
                sessionTokenHash: hashedRefreshToken,
                status: SessionStatus.ACTIVE,
                ipAddress: metadata.ipAddress ?? null,
                userAgent: metadata.userAgent ?? null,
                location: metadata.location ?? undefined,
                expiresAt: refreshToken.expiresAt,
                lastSeenAt: now,
                deviceId: device?.id ?? null,
              },
            });

        if (options.sessionId) {
          await tx.refreshToken.updateMany({
            where: {
              userId: user.id,
              sessionId: options.sessionId,
              revokedAt: null,
            },
            data: {
              revokedAt: now,
              replacedByTokenId: refreshTokenId,
            },
          });
        }

        await tx.refreshToken.create({
          data: {
            id: refreshTokenId,
            userId: user.id,
            tokenHash: hashedRefreshToken,
            issuedAt: refreshToken.issuedAt,
            expiresAt: refreshToken.expiresAt,
            sessionId: session.id,
            userAgent: metadata.userAgent ?? null,
            ipAddress: metadata.ipAddress ?? null,
          },
        });

        return {
          sessionRecord: session,
          deviceId: device?.id ?? null,
          publicId: ensuredPublicId,
        };
      },
    );

    const resolvedPublicId = publicId ?? user.publicId ?? null;

    return {
      user: {
        id: user.id,
        publicId: resolvedPublicId,
        email: user.email,
        displayName: user.displayName,
        phone: user.phone,
        primaryRole: user.primaryRole,
        roles: uniqueRoles,
        sciId: user.creatorProfile?.creatorCode ?? null,
        status: user.status,
      },
      session: {
        id: sessionRecord.id,
        status: sessionRecord.status,
        deviceId,
        expiresAt: sessionRecord.expiresAt.toISOString(),
        lastSeenAt:
          sessionRecord.lastSeenAt?.toISOString() ?? now.toISOString(),
      },
      tokens: {
        accessToken: accessToken.token,
        accessTokenExpiresAt: accessToken.expiresAt.toISOString(),
        refreshToken: refreshToken.token,
        refreshTokenExpiresAt: refreshToken.expiresAt.toISOString(),
        tokenType: 'Bearer',
        refreshTokenId,
        sessionId: sessionRecord.id,
      },
    };
  }

  private async loadUserProfile(userId: string): Promise<UserWithRelations> {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        roles: {
          include: { role: true },
        },
        creatorProfile: true,
      },
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async validateRefreshGrant(refreshToken: string): Promise<{
    payload: { sub: string; jti: string };
    record: RefreshToken;
  }> {
    const payload = this.tokenService.verifyRefreshToken(refreshToken);
    const record = await this.prisma.refreshToken.findUnique({
      where: { id: payload.jti },
    });

    if (!record || record.userId !== payload.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (record.revokedAt) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (record.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    const expectedHash = this.hashToken(refreshToken);
    if (record.tokenHash !== expectedHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return { payload, record };
  }

  private async ensureUserPublicId(
    tx: Prisma.TransactionClient,
    user: Pick<UserWithRelations, 'id' | 'email' | 'publicId'>,
  ): Promise<string> {
    if (user.publicId) {
      return user.publicId;
    }

    const publicId = await this.generateUniquePublicId(tx, user.email);
    const updated = await tx.user.update({
      where: { id: user.id },
      data: { publicId },
      select: { publicId: true },
    });

    return updated.publicId;
  }

  private async generateUniquePublicId(
    tx: Prisma.TransactionClient,
    seed: string,
  ): Promise<string> {
    const normalizedSeed = seed.toLowerCase();

    for (let attempt = 0; attempt < 6; attempt++) {
      const candidate = this.buildPublicIdCandidate(normalizedSeed, attempt);
      const existing = await tx.user.findUnique({
        where: { publicId: candidate },
        select: { id: true },
      });

      if (!existing) {
        return candidate;
      }
    }

    return `USR-${randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`;
  }

  private buildPublicIdCandidate(seed: string, nonce: number): string {
    const normalized = seed.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const prefix = normalized.slice(0, 6).padEnd(6, 'X');
    const digest = createHash('sha1')
      .update(`${seed}:${nonce}`)
      .digest('hex')
      .toUpperCase();

    return `USR-${prefix}-${digest.slice(0, 4)}`;
  }

  private async upsertDevice(
    tx: Prisma.TransactionClient,
    userId: string,
    metadata: SessionMetadata,
  ): Promise<{ id: string } | null> {
    const details = metadata.device;

    if (!details) {
      return null;
    }

    const fingerprint = details.fingerprint ?? undefined;
    let device = null;

    if (fingerprint) {
      device = await tx.userDevice.findFirst({
        where: { userId, fingerprint },
      });
    }

    if (!device && metadata.userAgent) {
      device = await tx.userDevice.findFirst({
        where: { userId, userAgent: metadata.userAgent },
      });
    }

    const trusted =
      details.trusted === undefined || details.trusted === null
        ? undefined
        : Boolean(details.trusted);

    if (device) {
      return tx.userDevice.update({
        where: { id: device.id },
        data: {
          deviceName: details.name ?? undefined,
          deviceType: details.type ?? undefined,
          platform: details.platform ?? undefined,
          osVersion: details.osVersion ?? undefined,
          appVersion: details.appVersion ?? undefined,
          pushToken: details.pushToken ?? undefined,
          trusted,
          userAgent: metadata.userAgent ?? undefined,
          lastSeenAt: new Date(),
        },
        select: { id: true },
      });
    }

    return tx.userDevice.create({
      data: {
        userId,
        fingerprint: fingerprint ?? null,
        deviceName: details.name ?? null,
        deviceType: details.type ?? null,
        platform: details.platform ?? null,
        osVersion: details.osVersion ?? null,
        appVersion: details.appVersion ?? null,
        pushToken: details.pushToken ?? null,
        trusted: trusted ?? true,
        userAgent: metadata.userAgent ?? null,
        lastSeenAt: new Date(),
      },
      select: { id: true },
    });
  }
}
