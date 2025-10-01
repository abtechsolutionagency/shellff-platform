import { Injectable } from '@nestjs/common';
import { OtpCodeType } from '@prisma/client';
import { createHash, randomInt } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service';
import type { SessionMetadata } from './session-metadata';

const OTP_TTL_MINUTES = 10;

export type IssuedOtp = {
  code: string;
  expiresAt: Date;
};

@Injectable()
export class OtpService {
  constructor(private readonly prisma: PrismaService) {}

  async issue(
    userId: string,
    type: OtpCodeType,
    metadata: SessionMetadata = {},
  ): Promise<IssuedOtp> {
    const code = this.generateCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + OTP_TTL_MINUTES * 60_000);
    const codeHash = this.hash(code);

    await this.prisma.otpCode.updateMany({
      where: { userId, type, consumedAt: null },
      data: { consumedAt: now },
    });

    await this.prisma.otpCode.create({
      data: {
        userId,
        type,
        codeHash,
        expiresAt,
        createdByIp: metadata.ipAddress ?? null,
        userAgent: metadata.userAgent ?? null,
      },
    });

    return { code, expiresAt };
  }

  async verify(
    userId: string,
    type: OtpCodeType,
    code: string,
    metadata: SessionMetadata = {},
  ): Promise<boolean> {
    const record = await this.prisma.otpCode.findFirst({
      where: { userId, type, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return false;
    }

    if (record.expiresAt.getTime() <= Date.now()) {
      await this.prisma.otpCode.update({
        where: { id: record.id },
        data: { consumedAt: new Date(), consumedByIp: metadata.ipAddress ?? null, userAgent: metadata.userAgent ?? null },
      });
      return false;
    }

    if (record.codeHash !== this.hash(code)) {
      return false;
    }

    await this.prisma.otpCode.update({
      where: { id: record.id },
      data: {
        consumedAt: new Date(),
        consumedByIp: metadata.ipAddress ?? null,
        userAgent: metadata.userAgent ?? null,
      },
    });

    return true;
  }

  private generateCode(): string {
    const value = randomInt(0, 1_000_000);
    return value.toString().padStart(6, '0');
  }

  private hash(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }
}
