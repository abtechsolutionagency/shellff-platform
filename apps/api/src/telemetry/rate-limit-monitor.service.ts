import { Injectable, Logger } from '@nestjs/common';

type RateLimitSnapshot = {
  key: string;
  limit: number;
  lastTotalHits: number;
  blockedCount: number;
  lastBlockedAt: string | null;
  windowResetAt: string | null;
};

@Injectable()
export class RateLimitMonitorService {
  private readonly logger = new Logger(RateLimitMonitorService.name);
  private readonly stats = new Map<string, RateLimitSnapshot>();

  record(
    key: string,
    limit: number,
    totalHits: number,
    expiresAt: number,
    allowed: boolean,
  ) {
    const existing = this.stats.get(key) ?? {
      key,
      limit,
      lastTotalHits: 0,
      blockedCount: 0,
      lastBlockedAt: null,
      windowResetAt: null,
    };

    existing.limit = limit;
    existing.lastTotalHits = totalHits;
    existing.windowResetAt = Number.isFinite(expiresAt)
      ? new Date(expiresAt).toISOString()
      : null;

    if (!allowed) {
      existing.blockedCount += 1;
      existing.lastBlockedAt = new Date().toISOString();
      this.logger.warn(`Rate limit exceeded for ${key}: ${totalHits}/${limit}`);
    }

    this.stats.set(key, existing);
  }

  snapshot(): RateLimitSnapshot[] {
    return Array.from(this.stats.values());
  }

  reset() {
    this.stats.clear();
  }
}
