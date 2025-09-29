
/**
 * Code Slice 4: Code Redemption System
 * Utility functions for validating unlock codes
 */

import { prisma } from '@/lib/db';
import { 
  checkRateLimit, 
  incrementRateLimit, 
  detectFraudulentActivity, 
  isBlockedForFraud, 
  getSecurityConfiguration,
  type RedemptionAttempt 
} from './fraudDetection';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
  release?: {
    id: string;
    title: string;
    artist: string;
    coverArt: string;
    releaseType: string;
    trackCount: number;
  };
}

export interface RedemptionResult {
  success: boolean;
  error?: string;
  album?: {
    title: string;
    artist: string;
    cover: string;
    trackCount: number;
  };
}

/**
 * Validate code format
 */
export function validateCodeFormat(code: string): boolean {
  const codePattern = /^SH\d{4}$/;
  return codePattern.test(code.toUpperCase());
}

/**
 * Validate and check if code exists and is unused
 */
export async function validateUnlockCode(code: string, userId?: string): Promise<ValidationResult> {
  try {
    // Validate format first
    if (!validateCodeFormat(code)) {
      return {
        valid: false,
        error: 'Invalid code format. Please use format: SH1234'
      };
    }

    // Find the unlock code in the database
    const unlockCode = await prisma.unlockCode.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        release: {
          include: {
            creator: true,
            releaseTracks: true,
          }
        }
      }
    });

    if (!unlockCode) {
      return {
        valid: false,
        error: 'Code not found or invalid'
      };
    }

    // Check if code is already redeemed
    if (unlockCode.redeemedBy) {
      return {
        valid: false,
        error: 'This code has already been redeemed'
      };
    }

    // Check if code status is unused
    if (unlockCode.status !== 'unused') {
      return {
        valid: false,
        error: 'This code is no longer valid'
      };
    }

    // If userId provided, check if user already owns this album
    if (userId) {
      const existingPurchase = await prisma.purchase.findFirst({
        where: {
          userId,
          // Check if user already has this release through any purchase
          OR: [
            { type: 'UNLOCK_CODES' },
            { type: 'ALBUM' }
          ]
        }
      });

      if (existingPurchase) {
        // Note: This is a soft warning, not a blocking error
        // Users can still redeem additional codes for the same album
      }
    }

    return {
      valid: true,
      code: code.toUpperCase(),
      release: {
        id: unlockCode.release.id,
        title: unlockCode.release.title,
        artist: `${unlockCode.release.creator.firstName} ${unlockCode.release.creator.lastName}`,
        coverArt: unlockCode.release.coverArt || '/api/placeholder/400/400',
        releaseType: unlockCode.release.releaseType,
        trackCount: unlockCode.release.releaseTracks.length
      }
    };

  } catch (error) {
    console.error('Code validation error:', error);
    return {
      valid: false,
      error: 'Failed to validate code'
    };
  }
}

/**
 * Redeem unlock code for a user (with advanced security)
 */
export async function redeemUnlockCode(
  code: string, 
  userId: string,
  ipAddress?: string,
  userAgent?: string,
  deviceFingerprint?: string
): Promise<RedemptionResult> {
  try {
    // Get security configuration
    const securityConfig = await getSecurityConfiguration();
    
    // Use the provided IP and device fingerprint
    const clientIp = ipAddress;
    const deviceFP = deviceFingerprint;

    // Security Check 1: Check if IP/Device is blocked for fraud
    if (securityConfig && securityConfig.fraudDetectionEnabled) {
      const isBlocked = await isBlockedForFraud(clientIp || undefined, deviceFP);
      if (isBlocked) {
        return {
          success: false,
          error: 'Access temporarily blocked due to suspicious activity'
        };
      }
    }

    // Security Check 2: Rate limiting
    const identifiers = [
      { id: clientIp || 'unknown', type: 'ip' as const },
      { id: userId, type: 'user' as const },
      { id: deviceFP || 'unknown', type: 'device' as const },
    ];

    for (const identifier of identifiers) {
      if (identifier.id !== 'unknown') {
        const rateLimitResult = await checkRateLimit(identifier.id, identifier.type);
        if (rateLimitResult.isBlocked) {
          return {
            success: false,
            error: rateLimitResult.reason || 'Too many attempts, please try again later'
          };
        }
      }
    }

    // Validate the code first
    const validation = await validateUnlockCode(code, userId);
    
    if (!validation.valid || !validation.release) {
      // Increment rate limits for failed attempts
      for (const identifier of identifiers) {
        if (identifier.id !== 'unknown') {
          await incrementRateLimit(identifier.id, identifier.type);
        }
      }

      // Create redemption attempt object for fraud detection
      const attempt: RedemptionAttempt = {
        userId,
        ipAddress: clientIp || undefined,
        deviceFingerprint: deviceFP,
        code: code.toUpperCase(),
        success: false
      };

      // Check for fraudulent activity
      if (securityConfig && securityConfig.fraudDetectionEnabled) {
        await detectFraudulentActivity(attempt);
      }

      // Log failed redemption attempt
      try {
        const unlockCode = await prisma.unlockCode.findUnique({
          where: { code: code.toUpperCase() }
        });
        
        if (unlockCode) {
          await prisma.codeRedemptionLog.create({
            data: {
              codeId: unlockCode.id,
              userId,
              ipAddress: clientIp,
              userAgent,
              deviceFingerprint: deviceFP,
              success: false
            }
          });
        }
      } catch (logError) {
        console.error('Failed to log redemption attempt:', logError);
      }

      return {
        success: false,
        error: validation.error || 'Code validation failed'
      };
    }

    // Begin transaction to redeem the code
    const result = await prisma.$transaction(async (tx) => {
      // Find the unlock code
      const unlockCode = await tx.unlockCode.findUnique({
        where: { code: code.toUpperCase() },
        include: {
          release: {
            include: {
              creator: true,
              releaseTracks: true
            }
          }
        }
      });

      if (!unlockCode) {
        throw new Error('Code not found');
      }

      // Double-check the code is still unused (race condition protection)
      if (unlockCode.status !== 'unused' || unlockCode.redeemedBy) {
        throw new Error('Code has already been redeemed');
      }

      // Security Check 3: Device/IP Locking
      if (securityConfig) {
        // Check device locking
        if (securityConfig.deviceLockingEnabled && unlockCode.deviceLockedTo) {
          if (unlockCode.deviceLockedTo !== deviceFP) {
            throw new Error('This code is locked to a different device');
          }
        }

        // Check IP locking
        if (securityConfig.ipLockingEnabled && unlockCode.ipLockedTo) {
          if (unlockCode.ipLockedTo !== clientIp) {
            throw new Error('This code is locked to a different IP address');
          }
        }
      }

      // Prepare update data for unlock code
      const updateData: any = {
        status: 'redeemed',
        redeemedBy: userId,
        redeemedAt: new Date(),
      };

      // Apply device/IP locking if enabled and not already set
      if (securityConfig) {
        if (securityConfig.deviceLockingEnabled && !unlockCode.deviceLockedTo && deviceFP) {
          updateData.deviceLockedTo = deviceFP;
        }
        if (securityConfig.ipLockingEnabled && !unlockCode.ipLockedTo && clientIp) {
          updateData.ipLockedTo = clientIp;
        }
      }

      // Update the unlock code to mark as redeemed
      await tx.unlockCode.update({
        where: { id: unlockCode.id },
        data: updateData
      });

      // Create a purchase record
      await tx.purchase.create({
        data: {
          userId,
          type: 'UNLOCK_CODES',
          price: 0, // Free through code redemption
          currency: 'SHC',
          status: 'COMPLETED',
        }
      });

      // Log successful redemption
      await tx.codeRedemptionLog.create({
        data: {
          codeId: unlockCode.id,
          userId,
          ipAddress: clientIp,
          userAgent,
          deviceFingerprint: deviceFP,
          success: true
        }
      });

      // Create successful attempt for fraud detection
      const attempt: RedemptionAttempt = {
        userId,
        ipAddress: clientIp || undefined,
        deviceFingerprint: deviceFP,
        code: code.toUpperCase(),
        success: true
      };

      // Log successful redemption for fraud detection (helps with pattern recognition)
      if (securityConfig && securityConfig.fraudDetectionEnabled) {
        // This helps establish normal usage patterns
        await detectFraudulentActivity(attempt);
      }

      return {
        success: true,
        album: {
          title: unlockCode.release.title,
          artist: `${unlockCode.release.creator.firstName} ${unlockCode.release.creator.lastName}`,
          cover: unlockCode.release.coverArt || '/api/placeholder/400/400',
          trackCount: unlockCode.release.releaseTracks.length
        }
      };
    });

    return result;

  } catch (error) {
    console.error('Code redemption error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to redeem code'
    };
  }
}

/**
 * Get redemption statistics for a user
 */
export async function getUserRedemptionStats(userId: string) {
  try {
    const stats = await prisma.codeRedemptionLog.findMany({
      where: { userId },
      include: {
        unlockCode: {
          include: {
            release: {
              include: {
                creator: true
              }
            }
          }
        }
      },
      orderBy: { redeemedAt: 'desc' }
    });

    return {
      totalRedemptions: stats.length,
      successfulRedemptions: stats.filter(s => s.success).length,
      failedRedemptions: stats.filter(s => !s.success).length,
      recentRedemptions: stats.slice(0, 10) // Last 10 redemptions
    };

  } catch (error) {
    console.error('Failed to get user redemption stats:', error);
    return {
      totalRedemptions: 0,
      successfulRedemptions: 0,
      failedRedemptions: 0,
      recentRedemptions: []
    };
  }
}
