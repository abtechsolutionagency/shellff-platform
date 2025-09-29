import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { RoleType } from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

import { LoginDto } from './dto/login.dto';
import { AuthSession } from './dto/session.dto';
import { SignupDto } from './dto/signup.dto';
import { hashPassword, verifyPassword } from './password.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
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

    return this.buildSession({
      ...createdUser,
      roles: [
        {
          role: { name: RoleType.LISTENER },
        },
      ],
      creatorProfile: null,
    });
  }

  async login(dto: LoginDto): Promise<AuthSession> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        roles: {
          include: { role: true },
        },
        creatorProfile: true,
      },
    });

    if (!user || !verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.auditService.recordEvent({
      actorUserId: user.id,
      actorType: 'user',
      event: 'auth.login',
      target: user.id,
    });

    return this.buildSession(user);
  }

  private buildSession(user: {
    id: string;
    email: string;
    displayName: string;
    phone: string | null;
    primaryRole: RoleType;
    passwordHash?: string;
    status: string;
    roles: Array<{ role: { name: RoleType } }>;
    creatorProfile: { creatorCode: string } | null;
  }): AuthSession {
    const uniqueRoles = Array.from(
      new Set(user.roles.map((assignment) => assignment.role.name)),
    );

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
    };
  }
}
