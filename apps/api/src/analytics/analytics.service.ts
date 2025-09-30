import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { AuditService } from '../audit/audit.service';

export interface AnalyticsContext {
  userId?: string | null;
  target?: string | null;
  requestId?: string | null;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly auditService: AuditService) {}

  async track(
    event: string,
    metadata?: Prisma.JsonValue,
    context: AnalyticsContext = {},
  ): Promise<void> {
    await this.auditService.recordEvent({
      actorUserId: context.userId ?? null,
      actorType: 'analytics',
      event: `analytics.${event}`,
      target: context.target ?? null,
      metadata,
      requestId: context.requestId ?? null,
    });
  }
}
