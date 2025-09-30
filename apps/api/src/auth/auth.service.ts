import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma, RoleType } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';

import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

import { LoginDto } from './dto/login.dto';
import { AuthSession } from './dto/session.dto';
import { SignupDto } from './dto/signup.dto';
import { hashPassword, verifyPassword } from './password.util';
import { TokenService } from './token.service';

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

  async register(dto: SignupDto): Promise<AuthSession> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
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
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          displayName: dto.displayName,
          phone: dto.phone,
          passwordHash,
          primaryRole: RoleType.LISTENER,
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
    return this.issueSession(hydrated);
  }

  async login(dto: LoginDto): Promise<AuthSession> {
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

    const session = await this.issueSession(user);

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

  private async issueSession(user: UserWithRelations): Promise<AuthSession> {
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

    await this.revokeActiveRefreshTokens(user.id, refreshTokenId);

    await this.prisma.refreshToken.create({
      data: {
        id: refreshTokenId,
        userId: user.id,
        tokenHash: this.hashToken(refreshToken.token),
        expiresAt: refreshToken.expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        phone: user.phone,
        primaryRole: user.primaryRole,
        roles: uniqueRoles,
        creatorId: user.creatorProfile?.creatorCode ?? null,
        status: user.status,
      },
      tokens: {
        accessToken: accessToken.token,
        accessTokenExpiresAt: accessToken.expiresAt.toISOString(),
        refreshToken: refreshToken.token,
        refreshTokenExpiresAt: refreshToken.expiresAt.toISOString(),
        tokenType: 'Bearer',
      },
    };
  }

  private async revokeActiveRefreshTokens(
    userId: string,
    replacementId: string,
  ): Promise<void> {
    const now = new Date();
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: now,
        replacedByTokenId: replacementId,
      },
    });
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
}
