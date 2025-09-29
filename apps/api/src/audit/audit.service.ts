import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export type AuditEventPayload = {
  actorUserId?: string | null;
  actorType: string;
  event: string;
  target?: string | null;
  metadata?: Prisma.JsonValue;
  requestId?: string | null;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async recordEvent(payload: AuditEventPayload): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorUserId: payload.actorUserId ?? null,
        actorType: payload.actorType,
        event: payload.event,
        target: payload.target ?? null,
        metadata: payload.metadata,
        requestId: payload.requestId ?? null,
      },
    });
  }

  async latest(limit = 20) {
    return this.prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}
