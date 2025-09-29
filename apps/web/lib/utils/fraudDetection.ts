
import { prisma } from '@/lib/db';

export interface FraudDetectionResult {
  isBlocked: boolean;
  reason?: string;
  remainingAttempts?: number;
  blockDuration?: number;
}

export interface RedemptionAttempt {
  userId?: string;
  ipAddress?: string;
  deviceFingerprint?: string;
  code: string;
  success: boolean;
}

/**
 * Check if a user/IP/device is rate limited
 */
export async function checkRateLimit(
  identifier: string, 
  identifierType: 'ip' | 'user' | 'device'
): Promise<FraudDetectionResult> {
  try {
    // Get security configuration
    const config = await prisma.securityConfiguration.findFirst();
    if (!config) {
      return { isBlocked: false };
    }

    const now = new Date();

    // Find or create rate limit record
    let rateLimit = await prisma.codeRedemptionRateLimit.findUnique({
      where: {
        identifier_identifierType: {
          identifier,
          identifierType,
        },
      },
    });

    if (!rateLimit) {
      // Create new rate limit record
      rateLimit = await prisma.codeRedemptionRateLimit.create({
        data: {
          identifier,
          identifierType,
          attempts: 0,
          windowStart: now,
          windowEnd: new Date(now.getTime() + (config.rateLimitWindowHours * 60 * 60 * 1000)),
        },
      });
    }

    // Check if currently blocked
    if (rateLimit.blocked && rateLimit.blockedUntil && rateLimit.blockedUntil > now) {
      const blockDuration = Math.ceil((rateLimit.blockedUntil.getTime() - now.getTime()) / (1000 * 60 * 60));
      return {
        isBlocked: true,
        reason: 'Rate limit exceeded',
        blockDuration,
      };
    }

    // Check if window has expired
    if (rateLimit.windowEnd < now) {
      // Reset the window
      await prisma.codeRedemptionRateLimit.update({
        where: { id: rateLimit.id },
        data: {
          attempts: 0,
          windowStart: now,
          windowEnd: new Date(now.getTime() + (config.rateLimitWindowHours * 60 * 60 * 1000)),
          blocked: false,
          blockedUntil: null,
        },
      });
      return { isBlocked: false, remainingAttempts: config.maxRedemptionAttempts };
    }

    // Check if rate limit exceeded
    if (rateLimit.attempts >= config.maxRedemptionAttempts) {
      // Block the identifier
      const blockedUntil = new Date(now.getTime() + (config.autoBlockDuration * 60 * 60 * 1000));
      await prisma.codeRedemptionRateLimit.update({
        where: { id: rateLimit.id },
        data: {
          blocked: true,
          blockedUntil,
        },
      });

      return {
        isBlocked: true,
        reason: 'Too many redemption attempts',
        blockDuration: config.autoBlockDuration,
      };
    }

    return {
      isBlocked: false,
      remainingAttempts: config.maxRedemptionAttempts - rateLimit.attempts,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    return { isBlocked: false };
  }
}

/**
 * Increment rate limit attempts
 */
export async function incrementRateLimit(
  identifier: string, 
  identifierType: 'ip' | 'user' | 'device'
): Promise<void> {
  try {
    await prisma.codeRedemptionRateLimit.upsert({
      where: {
        identifier_identifierType: {
          identifier,
          identifierType,
        },
      },
      update: {
        attempts: {
          increment: 1,
        },
        updatedAt: new Date(),
      },
      create: {
        identifier,
        identifierType,
        attempts: 1,
        windowStart: new Date(),
        windowEnd: new Date(Date.now() + (60 * 60 * 1000)), // 1 hour default
      },
    });
  } catch (error) {
    console.error('Rate limit increment error:', error);
  }
}

/**
 * Detect and log fraudulent activity
 */
export async function detectFraudulentActivity(attempt: RedemptionAttempt): Promise<boolean> {
  try {
    const config = await prisma.securityConfiguration.findFirst();
    if (!config || !config.fraudDetectionEnabled) {
      return false;
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));

    // Check for suspicious patterns
    const suspiciousReasons: string[] = [];

    // Check for multiple failed attempts from same IP
    if (attempt.ipAddress) {
      const ipFailures = await prisma.codeRedemptionLog.count({
        where: {
          ipAddress: attempt.ipAddress,
          success: false,
          redeemedAt: {
            gte: oneHourAgo,
          },
        },
      });

      if (ipFailures >= config.suspiciousAttemptThreshold) {
        suspiciousReasons.push(`Multiple failed attempts from IP: ${ipFailures}`);
      }
    }

    // Check for multiple failed attempts from same device
    if (attempt.deviceFingerprint) {
      const deviceFailures = await prisma.codeRedemptionLog.count({
        where: {
          deviceFingerprint: attempt.deviceFingerprint,
          success: false,
          redeemedAt: {
            gte: oneHourAgo,
          },
        },
      });

      if (deviceFailures >= config.suspiciousAttemptThreshold) {
        suspiciousReasons.push(`Multiple failed attempts from device: ${deviceFailures}`);
      }
    }

    // Check for rapid-fire attempts (more than 1 per minute)
    const oneMinuteAgo = new Date(now.getTime() - (60 * 1000));
    const recentAttempts = await prisma.codeRedemptionLog.count({
      where: {
        OR: [
          { ipAddress: attempt.ipAddress },
          { deviceFingerprint: attempt.deviceFingerprint },
          { userId: attempt.userId },
        ],
        redeemedAt: {
          gte: oneMinuteAgo,
        },
      },
    });

    if (recentAttempts > 5) {
      suspiciousReasons.push(`Rapid-fire attempts: ${recentAttempts} in last minute`);
    }

    // If suspicious activity detected, log it
    if (suspiciousReasons.length > 0) {
      await prisma.fraudDetectionLog.create({
        data: {
          userId: attempt.userId,
          ipAddress: attempt.ipAddress,
          deviceFingerprint: attempt.deviceFingerprint,
          attemptedCodes: [attempt.code],
          detectionReason: suspiciousReasons.join('; '),
          flaggedAt: now,
        },
      });

      return true; // Fraud detected
    }

    return false; // No fraud detected
  } catch (error) {
    console.error('Fraud detection error:', error);
    return false;
  }
}

/**
 * Check if an IP/device is blocked due to fraud
 */
export async function isBlockedForFraud(
  ipAddress?: string, 
  deviceFingerprint?: string
): Promise<boolean> {
  try {
    const config = await prisma.securityConfiguration.findFirst();
    if (!config || !config.blockSuspiciousIPs) {
      return false;
    }

    // Check for unresolved fraud logs in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - (24 * 60 * 60 * 1000));
    
    const fraudLogs = await prisma.fraudDetectionLog.findMany({
      where: {
        AND: [
          {
            OR: [
              { ipAddress },
              { deviceFingerprint },
            ],
          },
          {
            resolved: false,
          },
          {
            flaggedAt: {
              gte: twentyFourHoursAgo,
            },
          },
        ],
      },
    });

    return fraudLogs.length > 0;
  } catch (error) {
    console.error('Fraud block check error:', error);
    return false;
  }
}

/**
 * Get security configuration
 */
export async function getSecurityConfiguration() {
  try {
    let config = await prisma.securityConfiguration.findFirst();
    
    if (!config) {
      // Create default configuration
      config = await prisma.securityConfiguration.create({
        data: {
          updatedBy: 'system',
        },
      });
    }
    
    return config;
  } catch (error) {
    console.error('Security configuration error:', error);
    return null;
  }
}

