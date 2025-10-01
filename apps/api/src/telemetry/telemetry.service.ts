import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import * as os from 'node:os';

import { PrismaService } from '../prisma/prisma.service';
import { RateLimitMonitorService } from './rate-limit-monitor.service';

@Injectable()
export class TelemetryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rateLimitMonitor: RateLimitMonitorService,
  ) {}

  async getHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      throw new ServiceUnavailableException('Database connectivity check failed', {
        cause: error,
      });
    }

    return {
      status: 'ok',
      service: 'shellff-api',
      version: process.env.npm_package_version ?? '0.0.1',
      timestamp: new Date().toISOString(),
    };
  }

  getVersion() {
    return process.env.npm_package_version ?? '0.0.1';
  }

  async getStatus() {
    const [health, metrics] = await Promise.all([
      this.getHealth(),
      this.getMetrics(),
    ]);

    return {
      ...health,
      metrics,
    };
  }

  async getMetrics() {
    const memory = process.memoryUsage();

    return {
      uptimeSeconds: process.uptime(),
      loadAverage: os.loadavg(),
      rss: memory.rss,
      heapUsed: memory.heapUsed,
      external: memory.external,
      rateLimit: this.rateLimitMonitor.snapshot(),
    };
  }
}
