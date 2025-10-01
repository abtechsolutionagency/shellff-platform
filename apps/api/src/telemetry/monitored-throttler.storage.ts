import { Injectable } from '@nestjs/common';
import { ThrottlerStorageService } from '@nestjs/throttler';

import { RateLimitMonitorService } from './rate-limit-monitor.service';

@Injectable()
export class MonitoredThrottlerStorageService extends ThrottlerStorageService {
  constructor(private readonly monitor: RateLimitMonitorService) {
    super();
  }

  override increment(key: string, limit: number, ttl: number) {
    const result = super.increment(key, limit, ttl);
    this.monitor.record(key, limit, result.totalHits, result.expiresAt, result.allowed);
    return result;
  }

  override reset(key?: string): void {
    super.reset(key);
  }
}
