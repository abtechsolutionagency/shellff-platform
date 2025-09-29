import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RoleType } from '@prisma/client';
import { randomBytes } from 'node:crypto';

import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

import { GrantRoleDto } from './dto/grant-role.dto';
import { UpgradeCreatorDto } from './dto/upgrade-creator.dto';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async grantRole(dto: GrantRoleDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.roles.some((assignment) => assignment.role.name === dto.role)) {
      return {
        userId: user.id,
        roles: user.roles.map((assignment) => assignment.role.name),
      };
    }

    const role = await this.prisma.role.findUnique({
      where: { name: dto.role },
    });

    if (!role) {
      throw new ConflictException(`Role ${dto.role} has not been seeded`);
    }

    await this.prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
      },
    });

    await this.auditService.recordEvent({
      actorUserId: dto.actorUserId ?? null,
      actorType: dto.actorType,
      event: 'roles.grant',
      target: `${user.id}:${dto.role}`,
      metadata: {
        role: dto.role,
        userId: user.id,
      },
    });

    return {
      userId: user.id,
      roles: [...user.roles.map((assignment) => assignment.role.name), dto.role],
    };
  }

  async upgradeToCreator(dto: UpgradeCreatorDto) {
    const assignment = await this.grantRole({
      userId: dto.userId,
      role: RoleType.CREATOR,
      actorType: dto.actorType,
      actorUserId: dto.actorUserId,
    });

    const existingCreator = await this.prisma.creator.findUnique({
      where: { userId: dto.userId },
    });

    if (existingCreator) {
      return {
        userId: dto.userId,
        creatorCode: existingCreator.creatorCode,
        roles: assignment.roles,
      };
    }

    const creator = await this.prisma.$transaction(async (tx) => {
      const created = await this.createCreatorRecord(tx, dto.userId);

      await tx.user.update({
        where: { id: dto.userId },
        data: { primaryRole: RoleType.CREATOR },
      });

      return created;
    });

    await this.auditService.recordEvent({
      actorUserId: dto.actorUserId ?? null,
      actorType: dto.actorType,
      event: 'creators.issued',
      target: creator.creatorCode,
      metadata: {
        userId: dto.userId,
      },
    });

    return {
      userId: dto.userId,
      creatorCode: creator.creatorCode,
      roles: assignment.roles,
    };
  }

  private async createCreatorRecord(
    tx: PrismaService | Prisma.TransactionClient,
    userId: string,
  ) {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const creatorCode = this.generateCreatorCode();
      try {
        return await tx.creator.create({
          data: {
            userId,
            creatorCode,
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          continue;
        }
        throw error;
      }
    }
  }

  private generateCreatorCode(): string {
    const segments = Array.from({ length: 2 }, () =>
      randomBytes(2).toString('hex').toUpperCase(),
    );
    return `SHF-${segments[0]}-${segments[1]}`;
  }
}
