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
  type RedemptionAttempt,
} from './fraudDetection';
import { normalizeUnlockCode, validateCodeFormat } from './codeGenerator';

const INVALID_FORMAT_MESSAGE = 'Invalid code format. Please use format: SHF-ABCD-1234';

interface ReleaseSummary {
  id: string;
  title: string;
  artist: string;
  coverArt: string;
  releaseType: string;
  trackCount: number;
}

interface ReleaseAccessSummary {
  releaseId: string;
  grantedAt: string;
  source: string;
}

interface ValidationOptions {
  userPrimaryId?: string;
  userPublicId?: string;
}

interface RedemptionOptions {
  userPrimaryId: string;
  userPublicId: string;
  clientIp?: string;
  userAgent?: string;
  deviceFingerprint?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
  release?: ReleaseSummary;
  alreadyOwned?: boolean;
}

export interface RedemptionResult {
  success: boolean;
  error?: string;
  release?: ReleaseSummary;
  access?: ReleaseAccessSummary;
}

type RateLimitIdentifier = {
  id: string;
  type: 'ip' | 'user' | 'device';
};

function buildReleaseSummary(unlockCode: {
  release: {
    id: string;
    title: string;
    coverArt: string | null;
    releaseType: string;
    releaseTracks: { id: string }[];
    creator: { firstName: string | null; lastName: string | null; username: string };
  };
}): ReleaseSummary {
  const { release } = unlockCode;
  const firstName = release.creator.firstName?.trim();
  const lastName = release.creator.lastName?.trim();
  const artist = [firstName, lastName].filter(Boolean).join(' ').trim() || release.creator.username;

  return {
    id: release.id,
    title: release.title,
    artist,
    coverArt: release.coverArt || '/api/placeholder/400/400',
    releaseType: release.releaseType,
    trackCount: release.releaseTracks.length,
  };
}

function createIdentifiers(options: RedemptionOptions): RateLimitIdentifier[] {
  const identifiers: RateLimitIdentifier[] = [];

  if (options.clientIp) {
    identifiers.push({ id: options.clientIp, type: 'ip' });
  }

  if (options.userPublicId) {
    identifiers.push({ id: options.userPublicId, type: 'user' });
  }

  if (options.deviceFingerprint) {
    identifiers.push({ id: options.deviceFingerprint, type: 'device' });
  }

  return identifiers;
}

function buildRedemptionAttempt(
  normalizedCode: string,
  options: RedemptionOptions,
  success: boolean,
): RedemptionAttempt {
  return {
    userId: options.userPublicId,
    ipAddress: options.clientIp || undefined,
    deviceFingerprint: options.deviceFingerprint,
    code: normalizedCode,
    success,
  };
}

async function logRedemption(
  normalizedCode: string,
  options: RedemptionOptions,
  success: boolean,
  unlockId?: string,
) {
  try {
    if (!unlockId) {
      const unlockCode = await prisma.unlockCode.findUnique({
        where: { code: normalizedCode },
      });
      if (!unlockCode) {
        return;
      }
      unlockId = unlockCode.id;
    }

    await prisma.codeRedemptionLog.create({
      data: {
        codeId: unlockId,
        userId: options.userPublicId,
        ipAddress: options.clientIp,
        userAgent: options.userAgent,
        deviceFingerprint: options.deviceFingerprint,
        success,
      },
    });
  } catch (error) {
    console.error('Failed to write redemption log', error);
  }
}

export async function validateUnlockCode(
  rawCode: string,
  options: ValidationOptions = {},
): Promise<ValidationResult> {
  const normalizedCode = normalizeUnlockCode(rawCode);

  if (!validateCodeFormat(normalizedCode)) {
    return {
      valid: false,
      error: INVALID_FORMAT_MESSAGE,
    };
  }

  const unlockCode = await prisma.unlockCode.findUnique({
    where: { code: normalizedCode },
    include: {
      release: {
        include: {
          creator: true,
          releaseTracks: { select: { id: true } },
        },
      },
    },
  });

  if (!unlockCode) {
    return {
      valid: false,
      error: 'Code not found or invalid',
    };
  }

  if (unlockCode.redeemedBy) {
    return {
      valid: false,
      error: 'This code has already been redeemed',
    };
  }

  if (unlockCode.status !== 'unused') {
    return {
      valid: false,
      error: 'This code is no longer valid',
    };
  }

  let alreadyOwned = false;

  if (options.userPrimaryId) {
    const existingAccess = await prisma.releaseAccess.findUnique({
      where: {
        releaseId_userId: {
          releaseId: unlockCode.releaseId,
          userId: options.userPrimaryId,
        },
      },
    });

    if (existingAccess) {
      alreadyOwned = true;
    } else {
      const purchase = await prisma.purchase.findFirst({
        where: {
          userId: options.userPrimaryId,
          releaseId: unlockCode.releaseId,
        },
      });
      alreadyOwned = Boolean(purchase);
    }
  }

  return {
    valid: true,
    code: normalizedCode,
    release: buildReleaseSummary(unlockCode),
    alreadyOwned,
  };
}

export async function redeemUnlockCode(
  rawCode: string,
  options: RedemptionOptions,
): Promise<RedemptionResult> {
  const normalizedCode = normalizeUnlockCode(rawCode);

  if (!validateCodeFormat(normalizedCode)) {
    return {
      success: false,
      error: INVALID_FORMAT_MESSAGE,
    };
  }

  const securityConfig = await getSecurityConfiguration();

  if (securityConfig?.fraudDetectionEnabled) {
    const blocked = await isBlockedForFraud(options.clientIp, options.deviceFingerprint);
    if (blocked) {
      return {
        success: false,
        error: 'Access temporarily blocked due to suspicious activity',
      };
    }
  }

  const identifiers = createIdentifiers(options);

  for (const identifier of identifiers) {
    const rateLimitResult = await checkRateLimit(identifier.id, identifier.type);
    if (rateLimitResult.isBlocked) {
      return {
        success: false,
        error: rateLimitResult.reason || 'Too many attempts, please try again later',
      };
    }
  }

  const validation = await validateUnlockCode(normalizedCode, {
    userPrimaryId: options.userPrimaryId,
    userPublicId: options.userPublicId,
  });

  if (!validation.valid || !validation.release) {
    for (const identifier of identifiers) {
      await incrementRateLimit(identifier.id, identifier.type);
    }

    await detectFraudulentActivity(buildRedemptionAttempt(normalizedCode, options, false));
    await logRedemption(normalizedCode, options, false);

    return {
      success: false,
      error: validation.error || 'Code validation failed',
    };
  }

  if (validation.alreadyOwned) {
    return {
      success: false,
      error: 'You already have access to this release.',
    };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const unlockCode = await tx.unlockCode.findUnique({
        where: { code: normalizedCode },
        include: {
          release: {
            include: {
              creator: true,
              releaseTracks: { select: { id: true } },
            },
          },
        },
      });

      if (!unlockCode) {
        throw new Error('Code not found');
      }

      if (unlockCode.status !== 'unused' || unlockCode.redeemedBy) {
        throw new Error('Code has already been redeemed');
      }

      if (securityConfig) {
        if (securityConfig.deviceLockingEnabled && unlockCode.deviceLockedTo) {
          if (!options.deviceFingerprint || unlockCode.deviceLockedTo !== options.deviceFingerprint) {
            throw new Error('This code is locked to a different device');
          }
        }

        if (securityConfig.ipLockingEnabled && unlockCode.ipLockedTo) {
          if (!options.clientIp || unlockCode.ipLockedTo !== options.clientIp) {
            throw new Error('This code is locked to a different IP address');
          }
        }
      }

      const updateData: Record<string, unknown> = {
        status: 'redeemed',
        redeemedBy: options.userPublicId,
        redeemedAt: new Date(),
      };

      if (securityConfig?.deviceLockingEnabled && options.deviceFingerprint && !unlockCode.deviceLockedTo) {
        updateData.deviceLockedTo = options.deviceFingerprint;
      }

      if (securityConfig?.ipLockingEnabled && options.clientIp && !unlockCode.ipLockedTo) {
        updateData.ipLockedTo = options.clientIp;
      }

      await tx.unlockCode.update({
        where: { id: unlockCode.id },
        data: updateData,
      });

      await tx.purchase.create({
        data: {
          userId: options.userPrimaryId,
          releaseId: unlockCode.releaseId,
          type: 'UNLOCK_CODES',
          price: 0,
          currency: 'SHC',
          status: 'COMPLETED',
        },
      });

      const access = await tx.releaseAccess.upsert({
        where: {
          releaseId_userId: {
            releaseId: unlockCode.releaseId,
            userId: options.userPrimaryId,
          },
        },
        update: {
          source: 'UNLOCK_CODE',
        },
        create: {
          releaseId: unlockCode.releaseId,
          userId: options.userPrimaryId,
          source: 'UNLOCK_CODE',
        },
      });

      await tx.codeRedemptionLog.create({
        data: {
          codeId: unlockCode.id,
          userId: options.userPublicId,
          ipAddress: options.clientIp,
          userAgent: options.userAgent,
          deviceFingerprint: options.deviceFingerprint,
          success: true,
        },
      });

      return {
        release: buildReleaseSummary(unlockCode),
        access,
        unlockId: unlockCode.id,
      };
    });

    await detectFraudulentActivity(buildRedemptionAttempt(normalizedCode, options, true));
    await logRedemption(normalizedCode, options, true, result.unlockId);

    return {
      success: true,
      release: result.release,
      access: {
        releaseId: result.access.releaseId,
        grantedAt: result.access.grantedAt.toISOString(),
        source: result.access.source,
      },
    };
  } catch (error) {
    console.error('Code redemption error', error);
    for (const identifier of identifiers) {
      await incrementRateLimit(identifier.id, identifier.type);
    }
    await detectFraudulentActivity(buildRedemptionAttempt(normalizedCode, options, false));
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to redeem code',
    };
  }
}

export async function getUserRedemptionStats(options: {
  userPrimaryId: string;
  userPublicId: string;
}) {
  try {
    const [logs, activeAccessCount] = await Promise.all([
      prisma.codeRedemptionLog.findMany({
        where: { userId: options.userPublicId },
        include: {
          unlockCode: {
            include: {
              release: {
                include: {
                  creator: true,
                },
              },
            },
          },
        },
        orderBy: { redeemedAt: 'desc' },
      }),
      prisma.releaseAccess.count({
        where: { userId: options.userPrimaryId },
      }),
    ]);

    return {
      totalRedemptions: logs.length,
      successfulRedemptions: logs.filter((entry) => entry.success).length,
      failedRedemptions: logs.filter((entry) => !entry.success).length,
      recentRedemptions: logs.slice(0, 10),
      activeAccessCount,
    };
  } catch (error) {
    console.error('Failed to get user redemption stats:', error);
    return {
      totalRedemptions: 0,
      successfulRedemptions: 0,
      failedRedemptions: 0,
      recentRedemptions: [],
      activeAccessCount: 0,
    };
  }
}
