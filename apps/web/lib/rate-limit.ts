
/**
 * Rate limiting utilities for authentication endpoints
 */

import { prisma } from './db';
import { NextRequest } from 'next/server';

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number; // Window in milliseconds
  lockoutMs: number; // Lockout duration in milliseconds
}

export const RATE_LIMIT_CONFIGS = {
  LOGIN: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    lockoutMs: 30 * 60 * 1000  // 30 minutes lockout
  },
  OTP_REQUEST: {
    maxAttempts: 3,
    windowMs: 5 * 60 * 1000,   // 5 minutes
    lockoutMs: 15 * 60 * 1000  // 15 minutes lockout
  },
  PASSWORD_RESET: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000,  // 1 hour
    lockoutMs: 60 * 60 * 1000  // 1 hour lockout
  }
};

export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return real || 'unknown';
}

export async function checkRateLimit(
  identifier: string, 
  type: keyof typeof RATE_LIMIT_CONFIGS
): Promise<{ allowed: boolean; resetTime?: Date; attemptsLeft?: number }> {
  const config = RATE_LIMIT_CONFIGS[type];
  const now = new Date();
  const resetTime = new Date(now.getTime() + config.windowMs);
  
  // Find or create rate limit record
  const rateLimit = await prisma.rateLimitAttempt.findUnique({
    where: {
      identifier_type: {
        identifier,
        type
      }
    }
  });
  
  if (!rateLimit) {
    // First attempt - create record
    await prisma.rateLimitAttempt.create({
      data: {
        identifier,
        type,
        attempts: 1,
        resetAt: resetTime
      }
    });
    
    return {
      allowed: true,
      attemptsLeft: config.maxAttempts - 1
    };
  }
  
  // Check if we're past the reset time
  if (now > rateLimit.resetAt) {
    // Reset the counter
    await prisma.rateLimitAttempt.update({
      where: { id: rateLimit.id },
      data: {
        attempts: 1,
        resetAt: resetTime,
        updatedAt: now
      }
    });
    
    return {
      allowed: true,
      attemptsLeft: config.maxAttempts - 1
    };
  }
  
  // Check if exceeded max attempts
  if (rateLimit.attempts >= config.maxAttempts) {
    return {
      allowed: false,
      resetTime: rateLimit.resetAt
    };
  }
  
  // Increment attempts
  await prisma.rateLimitAttempt.update({
    where: { id: rateLimit.id },
    data: {
      attempts: rateLimit.attempts + 1,
      updatedAt: now
    }
  });
  
  return {
    allowed: true,
    attemptsLeft: config.maxAttempts - rateLimit.attempts - 1
  };
}

export async function resetRateLimit(identifier: string, type: keyof typeof RATE_LIMIT_CONFIGS): Promise<void> {
  await prisma.rateLimitAttempt.deleteMany({
    where: {
      identifier,
      type
    }
  });
}
