import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

export async function checkRateLimit(
  identifier: string,
  type: string
): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
  return RateLimiter.checkRateLimit(identifier, type);
}

export function getClientIP(request: Request): string {
  // Fallback: return a default IP for now
  return '127.0.0.1';
}

export class RateLimiter {
  private static configs: Map<string, RateLimitConfig> = new Map([
    ['login', { maxAttempts: 5, windowMs: 15 * 60 * 1000 }], // 5 attempts per 15 minutes
    ['password-reset', { maxAttempts: 3, windowMs: 60 * 60 * 1000 }], // 3 attempts per hour
    ['otp-verification', { maxAttempts: 3, windowMs: 5 * 60 * 1000 }], // 3 attempts per 5 minutes
  ]);

  static async checkRateLimit(
    identifier: string,
    type: string
  ): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
    const config = this.configs.get(type);
    if (!config) {
      return { allowed: true, remaining: Infinity, resetTime: new Date() };
    }

    // Fallback: always allow for now (commented out complex logic due to missing models)
    return {
      allowed: true,
      remaining: config.maxAttempts,
      resetTime: new Date(Date.now() + config.windowMs)
    };
  }

  static async recordAttempt(
    identifier: string,
    type: string,
    success: boolean
  ): Promise<void> {
    // Fallback: do nothing for now (commented out complex logic due to missing models)
    return;
  }

  static async resetRateLimit(
    identifier: string,
    type: string
  ): Promise<void> {
    // Fallback: do nothing for now (commented out complex logic due to missing models)
    return;
  }
}