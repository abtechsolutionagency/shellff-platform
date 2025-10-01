import { randomUUID } from 'node:crypto';

import { RoleType, SessionStatus } from '@prisma/client';

import type { PrismaService } from '../../src/prisma/prisma.service';

type UserRecord = {
  id: string;
  email: string;
  phone: string | null;
  publicId: string | null;
  passwordHash: string;
  displayName: string;
  primaryRole: RoleType;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

type RoleRecord = {
  id: number;
  name: RoleType;
  createdAt: Date;
  updatedAt: Date;
};

type UserRoleRecord = {
  userId: string;
  roleId: number;
  assignedAt: Date;
};

type CreatorRecord = {
  id: string;
  userId: string;
  creatorCode: string;
  createdAt: Date;
};

type AuditLogRecord = {
  id: string;
  actorUserId: string | null;
  actorType: string;
  event: string;
  target: string | null;
  metadata: any;
  requestId: string | null;
  createdAt: Date;
};

type RefreshTokenRecord = {
  id: string;
  userId: string;
  sessionId: string | null;
  tokenHash: string;
  issuedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByTokenId: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type PasswordResetTokenRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdByIp: string | null;
  consumedByIp: string | null;
  userAgent: string | null;
};

type OtpCodeRecord = {
  id: string;
  userId: string;
  codeHash: string;
  type: string;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdByIp: string | null;
  consumedByIp: string | null;
  userAgent: string | null;
};

type UserDeviceRecord = {
  id: string;
  userId: string;
  fingerprint: string | null;
  deviceName: string | null;
  deviceType: string | null;
  platform: string | null;
  osVersion: string | null;
  appVersion: string | null;
  pushToken: string | null;
  userAgent: string | null;
  trusted: boolean;
  firstSeenAt: Date;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type UserSessionRecord = {
  id: string;
  userId: string;
  deviceId: string | null;
  sessionTokenHash: string;
  status: SessionStatus;
  ipAddress: string | null;
  userAgent: string | null;
  location: any;
  expiresAt: Date;
  lastSeenAt: Date | null;
  signedOutAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type Order = 'asc' | 'desc';

export function createInMemoryPrisma(): PrismaService {
  const users: UserRecord[] = [];
  const roles: RoleRecord[] = [];
  const userRoles: UserRoleRecord[] = [];
  const creators: CreatorRecord[] = [];
  const auditLogs: AuditLogRecord[] = [];
  const refreshTokens: RefreshTokenRecord[] = [];
  const passwordResetTokens: PasswordResetTokenRecord[] = [];
  const otpCodes: OtpCodeRecord[] = [];
  const userDevices: UserDeviceRecord[] = [];
  const userSessions: UserSessionRecord[] = [];

  let roleSequence = 1;

  function clone<T>(value: T): T {
    return structuredClone(value);
  }

  function now(): Date {
    return new Date();
  }

  function findRoleIdByName(name: RoleType): number | null {
    const role = roles.find((entry) => entry.name === name);
    return role ? role.id : null;
  }

  const prisma = {
    async $connect() {
      return;
    },
    async $disconnect() {
      return;
    },
    async $transaction<T>(callback: (tx: PrismaService) => Promise<T>): Promise<T> {
      return callback(prisma as unknown as PrismaService);
    },
    async $queryRaw() {
      return 1;
    },
    user: {
      async findUnique(params: any) {
        const where = params?.where ?? {};
        let user: UserRecord | undefined;
        if (where.id) {
          user = users.find((entry) => entry.id === where.id);
        } else if (where.email) {
          const email = where.email.toLowerCase();
          user = users.find((entry) => entry.email === email);
        }
        if (!user) {
          return null;
        }
        return clone(includeUser(user, params?.include));
      },
      async findUniqueOrThrow(params: any) {
        const result = await prisma.user.findUnique(params);
        if (!result) {
          throw Object.assign(new Error('Record not found'), {
            code: 'P2025',
          });
        }
        return result;
      },
      async create(params: any) {
        const data = params.data;
        const timestamp = now();
        const record: UserRecord = {
          id: data.id ?? randomUUID(),
          email: data.email.toLowerCase(),
          phone: data.phone ?? null,
          publicId: data.publicId ?? null,
          passwordHash: data.passwordHash,
          displayName: data.displayName,
          primaryRole: data.primaryRole ?? RoleType.LISTENER,
          status: data.status ?? 'active',
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        users.push(record);

        if (data.roles?.create) {
          const creations = Array.isArray(data.roles.create)
            ? data.roles.create
            : [data.roles.create];
          for (const creation of creations) {
            const roleName = creation.role?.connect?.name as RoleType | undefined;
            if (!roleName) {
              continue;
            }
            const roleId = findRoleIdByName(roleName);
            if (roleId == null) {
              throw new Error(`Role ${roleName} not found`);
            }
            userRoles.push({
              userId: record.id,
              roleId,
              assignedAt: now(),
            });
          }
        }

        if (data.creatorProfile?.create) {
          const creatorData = data.creatorProfile.create;
          creators.push({
            id: creatorData.id ?? randomUUID(),
            userId: record.id,
            creatorCode: creatorData.creatorCode ?? randomUUID(),
            createdAt: now(),
          });
        }

        return clone(includeUser(record, params?.include));
      },
      async update(params: any) {
        const where = params.where;
        const data = params.data;
        const user = users.find((entry) => entry.id === where.id);
        if (!user) {
          throw new Error('User not found');
        }
        if (data.displayName !== undefined) {
          user.displayName = data.displayName;
        }
        if (data.primaryRole !== undefined) {
          user.primaryRole = data.primaryRole;
        }
        if (data.status !== undefined) {
          user.status = data.status;
        }
        if (data.publicId !== undefined) {
          user.publicId = data.publicId;
        }
        if (data.passwordHash !== undefined) {
          user.passwordHash = data.passwordHash;
        }
        user.updatedAt = now();
        return clone(includeUser(user, params?.include));
      },
      async upsert(params: any) {
        const existing = await prisma.user.findUnique({ where: params.where });
        if (existing) {
          return prisma.user.update({ where: params.where, data: params.update });
        }
        return prisma.user.create({ data: { ...params.create, id: params.where.id } });
      },
    },
    role: {
      async findUnique(params: any) {
        const where = params?.where ?? {};
        if (where.name) {
          const role = roles.find((entry) => entry.name === where.name);
          return role ? clone(role) : null;
        }
        if (where.id) {
          const role = roles.find((entry) => entry.id === where.id);
          return role ? clone(role) : null;
        }
        return null;
      },
      async findMany(params: any) {
        if (!params?.where?.name?.in) {
          return roles.map(clone);
        }
        const allowed = params.where.name.in as RoleType[];
        return roles.filter((entry) => allowed.includes(entry.name)).map(clone);
      },
      async create(params: any) {
        const data = params.data;
        const timestamp = now();
        const record: RoleRecord = {
          id: roleSequence++,
          name: data.name,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        roles.push(record);
        return clone(record);
      },
      async upsert(params: any) {
        const existing = await prisma.role.findUnique({ where: params.where });
        if (existing) {
          return existing;
        }
        return prisma.role.create({ data: { ...params.create, id: params.where.id } });
      },
      async createMany(params: any) {
        const data = params.data as Array<{ name: RoleType }>;
        for (const entry of data) {
          if (roles.some((role) => role.name === entry.name)) {
            if (!params.skipDuplicates) {
              throw new Error('Duplicate role');
            }
            continue;
          }
          await prisma.role.create({ data: entry });
        }
        return { count: data.length };
      },
    },
    userRole: {
      async create(params: any) {
        const data = params.data;
        userRoles.push({
          userId: data.userId,
          roleId: data.roleId,
          assignedAt: data.assignedAt ? new Date(data.assignedAt) : now(),
        });
        return clone(userRoles[userRoles.length - 1]);
      },
      async upsert(params: any) {
        const where = params.where.userId_roleId;
        const existing = userRoles.find(
          (entry) => entry.userId === where.userId && entry.roleId === where.roleId,
        );
        if (existing) {
          return clone(existing);
        }
        return prisma.userRole.create({
          data: {
            userId: where.userId,
            roleId: where.roleId,
          },
        });
      },
    },
    creator: {
      async findUnique(params: any) {
        const where = params.where;
        if (where.userId) {
          const record = creators.find((entry) => entry.userId === where.userId);
          return record ? clone(record) : null;
        }
        if (where.creatorCode) {
          const record = creators.find((entry) => entry.creatorCode === where.creatorCode);
          return record ? clone(record) : null;
        }
        return null;
      },
      async create(params: any) {
        const data = params.data;
        const record: CreatorRecord = {
          id: data.id ?? randomUUID(),
          userId: data.userId,
          creatorCode: data.creatorCode ?? randomUUID(),
          createdAt: now(),
        };
        if (creators.some((entry) => entry.creatorCode === record.creatorCode)) {
          const error = new Error('Unique constraint') as any;
          error.code = 'P2002';
          throw error;
        }
        creators.push(record);
        return clone(record);
      },
      async upsert(params: any) {
        const existing = await prisma.creator.findUnique({ where: params.where });
        if (existing) {
          return existing;
        }
        return prisma.creator.create({ data: { ...params.create, userId: params.where.userId } });
      },
    },
    refreshToken: {
      async create(params: any) {
        const data = params.data;
        const nowDate = now();
        const record: RefreshTokenRecord = {
          id: data.id ?? randomUUID(),
          userId: data.userId,
          sessionId: data.sessionId ?? null,
          tokenHash: data.tokenHash,
          issuedAt: data.issuedAt ? new Date(data.issuedAt) : nowDate,
          expiresAt: new Date(data.expiresAt),
          revokedAt: data.revokedAt ? new Date(data.revokedAt) : null,
          replacedByTokenId: data.replacedByTokenId ?? null,
          userAgent: data.userAgent ?? null,
          ipAddress: data.ipAddress ?? null,
          createdAt: nowDate,
          updatedAt: nowDate,
        };
        refreshTokens.push(record);
        return clone(record);
      },
      async findMany(params: any = {}) {
        let results = [...refreshTokens];
        if (params.where?.userId) {
          results = results.filter((entry) => entry.userId === params.where.userId);
        }
        if (params.orderBy?.createdAt) {
          const order = params.orderBy.createdAt as Order;
          results.sort((a, b) =>
            order === 'asc'
              ? a.createdAt.getTime() - b.createdAt.getTime()
              : b.createdAt.getTime() - a.createdAt.getTime(),
          );
        }
        return results.map(clone);
      },
      async findUnique(params: any) {
        const id = params.where?.id;
        if (!id) {
          return null;
        }
        const record = refreshTokens.find((entry) => entry.id === id);
        return record ? clone(record) : null;
      },
      async update(params: any) {
        const id = params.where?.id;
        if (!id) {
          throw new Error('RefreshToken.update requires an id');
        }
        const record = refreshTokens.find((entry) => entry.id === id);
        if (!record) {
          throw new Error('Refresh token not found');
        }

        const data = params.data ?? {};
        if (data.tokenHash !== undefined) {
          record.tokenHash = data.tokenHash;
        }
        if (data.expiresAt !== undefined) {
          record.expiresAt = new Date(data.expiresAt);
        }
        if (data.sessionId !== undefined) {
          record.sessionId = data.sessionId ?? null;
        }
        if (data.revokedAt !== undefined) {
          record.revokedAt = data.revokedAt ? new Date(data.revokedAt) : null;
        }
        if (data.replacedByTokenId !== undefined) {
          record.replacedByTokenId = data.replacedByTokenId ?? null;
        }
        if (data.userAgent !== undefined) {
          record.userAgent = data.userAgent ?? null;
        }
        if (data.ipAddress !== undefined) {
          record.ipAddress = data.ipAddress ?? null;
        }
        record.updatedAt = now();
        return clone(record);
      },
      async updateMany(params: any) {
        const where = params.where ?? {};
        let count = 0;
        for (const token of refreshTokens) {
          if (where.userId && token.userId !== where.userId) {
            continue;
          }
          if (where.revokedAt === null && token.revokedAt !== null) {
            continue;
          }
          token.revokedAt = params.data.revokedAt ?? token.revokedAt;
          token.replacedByTokenId = params.data.replacedByTokenId ?? token.replacedByTokenId;
          token.updatedAt = now();
          count += 1;
        }
        return { count };
      },
    },
    passwordResetToken: {
      async create(params: any) {
        const data = params.data;
        const nowDate = now();
        const record: PasswordResetTokenRecord = {
          id: data.id ?? randomUUID(),
          userId: data.userId,
          tokenHash: data.tokenHash,
          expiresAt: new Date(data.expiresAt),
          consumedAt: data.consumedAt ? new Date(data.consumedAt) : null,
          createdAt: nowDate,
          updatedAt: nowDate,
          createdByIp: data.createdByIp ?? null,
          consumedByIp: data.consumedByIp ?? null,
          userAgent: data.userAgent ?? null,
        };
        passwordResetTokens.push(record);
        return clone(record);
      },
      async findFirst(params: any) {
        const where = params?.where ?? {};
        const record = passwordResetTokens.find((entry) => {
          if (where.userId && entry.userId !== where.userId) {
            return false;
          }
          if (where.tokenHash && entry.tokenHash !== where.tokenHash) {
            return false;
          }
          if (where.consumedAt === null && entry.consumedAt !== null) {
            return false;
          }
          return true;
        });
        return record ? clone(record) : null;
      },
      async findMany(params: any = {}) {
        const where = params.where ?? {};
        let results = [...passwordResetTokens];
        if (where.userId) {
          results = results.filter((entry) => entry.userId === where.userId);
        }
        if (where.consumedAt === null) {
          results = results.filter((entry) => entry.consumedAt === null);
        }
        return results.map(clone);
      },
      async update(params: any) {
        const where = params.where ?? {};
        const record = passwordResetTokens.find((entry) => entry.id === where.id);
        if (!record) {
          throw new Error('Password reset token not found');
        }
        const data = params.data ?? {};
        if (data.consumedAt !== undefined) {
          record.consumedAt = data.consumedAt ? new Date(data.consumedAt) : null;
        }
        if (data.consumedByIp !== undefined) {
          record.consumedByIp = data.consumedByIp ?? null;
        }
        if (data.userAgent !== undefined) {
          record.userAgent = data.userAgent ?? null;
        }
        record.updatedAt = now();
        return clone(record);
      },
      async updateMany(params: any) {
        const where = params.where ?? {};
        const data = params.data ?? {};
        let count = 0;
        for (const record of passwordResetTokens) {
          if (where.userId && record.userId !== where.userId) {
            continue;
          }
          if (where.consumedAt === null && record.consumedAt !== null) {
            continue;
          }
          if (data.consumedAt !== undefined) {
            record.consumedAt = data.consumedAt ? new Date(data.consumedAt) : null;
          }
          if (data.consumedByIp !== undefined) {
            record.consumedByIp = data.consumedByIp ?? null;
          }
          if (data.userAgent !== undefined) {
            record.userAgent = data.userAgent ?? null;
          }
          record.updatedAt = now();
          count += 1;
        }
        return { count };
      },
    },
    otpCode: {
      async create(params: any) {
        const data = params.data;
        const nowDate = now();
        const record: OtpCodeRecord = {
          id: data.id ?? randomUUID(),
          userId: data.userId,
          codeHash: data.codeHash,
          type: data.type,
          expiresAt: new Date(data.expiresAt),
          consumedAt: data.consumedAt ? new Date(data.consumedAt) : null,
          createdAt: nowDate,
          updatedAt: nowDate,
          createdByIp: data.createdByIp ?? null,
          consumedByIp: data.consumedByIp ?? null,
          userAgent: data.userAgent ?? null,
        };
        otpCodes.push(record);
        return clone(record);
      },
      async findFirst(params: any) {
        const where = params?.where ?? {};
        const record = otpCodes.find((entry) => {
          if (where.userId && entry.userId !== where.userId) {
            return false;
          }
          if (where.type && entry.type !== where.type) {
            return false;
          }
          if (where.consumedAt === null && entry.consumedAt !== null) {
            return false;
          }
          return true;
        });
        return record ? clone(record) : null;
      },
      async findMany(params: any = {}) {
        const where = params.where ?? {};
        let results = [...otpCodes];
        if (where.userId) {
          results = results.filter((entry) => entry.userId === where.userId);
        }
        if (where.type) {
          results = results.filter((entry) => entry.type === where.type);
        }
        if (where.consumedAt === null) {
          results = results.filter((entry) => entry.consumedAt === null);
        }
        return results.map(clone);
      },
      async update(params: any) {
        const where = params.where ?? {};
        const record = otpCodes.find((entry) => entry.id === where.id);
        if (!record) {
          throw new Error('OTP code not found');
        }
        const data = params.data ?? {};
        if (data.consumedAt !== undefined) {
          record.consumedAt = data.consumedAt ? new Date(data.consumedAt) : null;
        }
        if (data.consumedByIp !== undefined) {
          record.consumedByIp = data.consumedByIp ?? null;
        }
        if (data.userAgent !== undefined) {
          record.userAgent = data.userAgent ?? null;
        }
        record.updatedAt = now();
        return clone(record);
      },
      async updateMany(params: any) {
        const where = params.where ?? {};
        const data = params.data ?? {};
        let count = 0;
        for (const record of otpCodes) {
          if (where.userId && record.userId !== where.userId) {
            continue;
          }
          if (where.type && record.type !== where.type) {
            continue;
          }
          if (where.consumedAt === null && record.consumedAt !== null) {
            continue;
          }
          if (data.consumedAt !== undefined) {
            record.consumedAt = data.consumedAt ? new Date(data.consumedAt) : null;
          }
          if (data.consumedByIp !== undefined) {
            record.consumedByIp = data.consumedByIp ?? null;
          }
          if (data.userAgent !== undefined) {
            record.userAgent = data.userAgent ?? null;
          }
          record.updatedAt = now();
          count += 1;
        }
        return { count };
      },
      async deleteMany(params: any) {
        const where = params?.where ?? {};
        const remaining: OtpCodeRecord[] = [];
        let count = 0;
        for (const record of otpCodes) {
          let match = true;
          if (where.userId && record.userId !== where.userId) {
            match = false;
          }
          if (where.type && record.type !== where.type) {
            match = false;
          }
          if (where.consumedAt === null && record.consumedAt !== null) {
            match = false;
          }
          if (match) {
            count += 1;
          } else {
            remaining.push(record);
          }
        }
        otpCodes.length = 0;
        otpCodes.push(...remaining);
        return { count };
      },
    },
    userDevice: {
      async findFirst(params: any) {
        const where = params?.where ?? {};
        const record = userDevices.find((entry) => {
          if (where.userId && entry.userId !== where.userId) {
            return false;
          }
          if (where.fingerprint && entry.fingerprint !== where.fingerprint) {
            return false;
          }
          if (where.userAgent && entry.userAgent !== where.userAgent) {
            return false;
          }
          return true;
        });
        return record ? clone(record) : null;
      },
      async findMany(params: any = {}) {
        const where = params.where ?? {};
        let results = [...userDevices];
        if (where.userId) {
          results = results.filter((entry) => entry.userId === where.userId);
        }
        if (where.id) {
          results = results.filter((entry) => entry.id === where.id);
        }
        if (where.deviceId) {
          results = results.filter((entry) => entry.id === where.deviceId);
        }
        return results.map(clone);
      },
      async update(params: any) {
        const id = params.where?.id;
        if (!id) {
          throw new Error('UserDevice.update requires an id');
        }
        const record = userDevices.find((entry) => entry.id === id);
        if (!record) {
          throw new Error('User device not found');
        }
        const data = params.data ?? {};
        if (data.deviceName !== undefined) {
          record.deviceName = data.deviceName ?? null;
        }
        if (data.deviceType !== undefined) {
          record.deviceType = data.deviceType ?? null;
        }
        if (data.platform !== undefined) {
          record.platform = data.platform ?? null;
        }
        if (data.osVersion !== undefined) {
          record.osVersion = data.osVersion ?? null;
        }
        if (data.appVersion !== undefined) {
          record.appVersion = data.appVersion ?? null;
        }
        if (data.pushToken !== undefined) {
          record.pushToken = data.pushToken ?? null;
        }
        if (data.trusted !== undefined) {
          record.trusted = Boolean(data.trusted);
        }
        if (data.userAgent !== undefined) {
          record.userAgent = data.userAgent ?? null;
        }
        if (data.lastSeenAt !== undefined) {
          record.lastSeenAt = data.lastSeenAt ? new Date(data.lastSeenAt) : null;
        }
        record.updatedAt = now();
        return clone(record);
      },
      async create(params: any) {
        const data = params.data;
        const timestamp = now();
        const record: UserDeviceRecord = {
          id: data.id ?? randomUUID(),
          userId: data.userId,
          fingerprint: data.fingerprint ?? null,
          deviceName: data.deviceName ?? null,
          deviceType: data.deviceType ?? null,
          platform: data.platform ?? null,
          osVersion: data.osVersion ?? null,
          appVersion: data.appVersion ?? null,
          pushToken: data.pushToken ?? null,
          userAgent: data.userAgent ?? null,
          trusted: data.trusted ?? true,
          firstSeenAt: data.firstSeenAt ? new Date(data.firstSeenAt) : timestamp,
          lastSeenAt: data.lastSeenAt ? new Date(data.lastSeenAt) : null,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        userDevices.push(record);
        return clone(record);
      },
    },
    userSession: {
      async create(params: any) {
        const data = params.data;
        const timestamp = now();
        const record: UserSessionRecord = {
          id: data.id ?? randomUUID(),
          userId: data.userId,
          deviceId: data.deviceId ?? null,
          sessionTokenHash: data.sessionTokenHash,
          status: data.status ?? SessionStatus.ACTIVE,
          ipAddress: data.ipAddress ?? null,
          userAgent: data.userAgent ?? null,
          location: data.location ?? null,
          expiresAt: new Date(data.expiresAt),
          lastSeenAt: data.lastSeenAt ? new Date(data.lastSeenAt) : null,
          signedOutAt: data.signedOutAt ? new Date(data.signedOutAt) : null,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        userSessions.push(record);
        return clone(record);
      },
      async update(params: any) {
        const where = params.where ?? {};
        if (!where.id) {
          throw new Error('UserSession.update requires an id');
        }
        const record = userSessions.find((entry) => entry.id === where.id);
        if (!record) {
          throw new Error('User session not found');
        }
        const data = params.data ?? {};
        if (data.sessionTokenHash !== undefined) {
          record.sessionTokenHash = data.sessionTokenHash;
        }
        if (data.status !== undefined) {
          record.status = data.status;
        }
        if (data.ipAddress !== undefined) {
          record.ipAddress = data.ipAddress ?? null;
        }
        if (data.userAgent !== undefined) {
          record.userAgent = data.userAgent ?? null;
        }
        if (data.location !== undefined) {
          record.location = data.location ?? null;
        }
        if (data.expiresAt !== undefined) {
          record.expiresAt = new Date(data.expiresAt);
        }
        if (data.lastSeenAt !== undefined) {
          record.lastSeenAt = data.lastSeenAt ? new Date(data.lastSeenAt) : null;
        }
        if (data.signedOutAt !== undefined) {
          record.signedOutAt = data.signedOutAt ? new Date(data.signedOutAt) : null;
        }
        if (data.deviceId !== undefined) {
          record.deviceId = data.deviceId ?? null;
        }
        record.updatedAt = now();
        return clone(record);
      },
      async findMany(params: any = {}) {
        const where = params.where ?? {};
        let results = [...userSessions];
        if (where.userId) {
          results = results.filter((entry) => entry.userId === where.userId);
        }
        if (where.deviceId) {
          results = results.filter((entry) => entry.deviceId === where.deviceId);
        }
        if (where.status) {
          results = results.filter((entry) => entry.status === where.status);
        }
        return results.map(clone);
      },
      async findUnique(params: any) {
        const id = params?.where?.id;
        if (!id) {
          return null;
        }
        const record = userSessions.find((entry) => entry.id === id);
        return record ? clone(record) : null;
      },
      async updateMany(params: any) {
        const where = params.where ?? {};
        const data = params.data ?? {};
        let count = 0;
        for (const record of userSessions) {
          if (where.userId && record.userId !== where.userId) {
            continue;
          }
          if (where.status && record.status !== where.status) {
            continue;
          }
          if (data.status !== undefined) {
            record.status = data.status;
          }
          if (data.signedOutAt !== undefined) {
            record.signedOutAt = data.signedOutAt ? new Date(data.signedOutAt) : null;
          }
          if (data.lastSeenAt !== undefined) {
            record.lastSeenAt = data.lastSeenAt ? new Date(data.lastSeenAt) : null;
          }
          if (data.updatedAt !== undefined) {
            record.updatedAt = new Date(data.updatedAt);
          } else {
            record.updatedAt = now();
          }
          count += 1;
        }
        return { count };
      },
    },
    auditLog: {
      async create(params: any) {
        const data = params.data;
        const record: AuditLogRecord = {
          id: data.id ?? randomUUID(),
          actorUserId: data.actorUserId ?? null,
          actorType: data.actorType,
          event: data.event,
          target: data.target ?? null,
          metadata: data.metadata ?? null,
          requestId: data.requestId ?? null,
          createdAt: now(),
        };
        auditLogs.push(record);
        return clone(record);
      },
      async findMany(params: any = {}) {
        let results = [...auditLogs];
        const eventFilter = params.where?.event;
        if (eventFilter) {
          if (typeof eventFilter === 'string') {
            results = results.filter((entry) => entry.event === eventFilter);
          } else if (typeof eventFilter === 'object' && eventFilter !== null) {
            if (typeof eventFilter.contains === 'string') {
              const needle = eventFilter.contains;
              results = results.filter((entry) => entry.event.includes(needle));
            }
          }
        }
        if (params.orderBy?.createdAt) {
          const order = params.orderBy.createdAt as Order;
          results.sort((a, b) =>
            order === 'asc'
              ? a.createdAt.getTime() - b.createdAt.getTime()
              : b.createdAt.getTime() - a.createdAt.getTime(),
          );
        }
        if (params.take) {
          results = results.slice(0, params.take);
        }
        return results.map(clone);
      },
    },
    featureFlag: {
      async upsert() {
        return null;
      },
    },
    featureFlagOverride: {
      async upsert() {
        return null;
      },
    },
  };

  function includeUser(user: UserRecord, include?: any) {
    const result: any = { ...user };
    if (include?.roles) {
      const includeRole = include.roles.include?.role;
      const assignments = userRoles.filter((entry) => entry.userId === user.id);
      result.roles = assignments.map((assignment) => ({
        roleId: assignment.roleId,
        role: includeRole ? clone(roles.find((role) => role.id === assignment.roleId)) : undefined,
      }));
    }
    if (include?.creatorProfile) {
      const creator = creators.find((entry) => entry.userId === user.id);
      result.creatorProfile = creator ? clone(creator) : null;
    }
    return result;
  }

  return prisma as unknown as PrismaService;
}

export function resetInMemoryPrisma(prisma: PrismaService) {
  Object.assign(prisma, createInMemoryPrisma());
}
