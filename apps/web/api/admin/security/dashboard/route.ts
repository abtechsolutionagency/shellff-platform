
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminUserOrThrow } from '@/lib/admin-auth';

export async function GET() {
  try {
    const adminUser = await getAdminUserOrThrow();

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Get security statistics
    const [
      totalFraudLogs,
      unresolvedFraudLogs,
      fraudLogsLast24h,
      fraudLogsLast7d,
      fraudLogsLast30d,
      totalRedemptionAttempts,
      failedRedemptionAttempts,
      blockedIPs,
      deviceLockedCodes,
      ipLockedCodes,
      securityConfig
    ] = await Promise.all([
      // Fraud detection stats
      prisma.fraudDetectionLog.count(),
      prisma.fraudDetectionLog.count({ where: { resolved: false } }),
      prisma.fraudDetectionLog.count({ 
        where: { flaggedAt: { gte: twentyFourHoursAgo } } 
      }),
      prisma.fraudDetectionLog.count({ 
        where: { flaggedAt: { gte: sevenDaysAgo } } 
      }),
      prisma.fraudDetectionLog.count({ 
        where: { flaggedAt: { gte: thirtyDaysAgo } } 
      }),

      // Redemption stats
      prisma.codeRedemptionLog.count(),
      prisma.codeRedemptionLog.count({ where: { success: false } }),

      // Rate limiting stats
      prisma.codeRedemptionRateLimit.count({ where: { blocked: true } }),

      // Security features usage
      prisma.unlockCode.count({ where: { deviceLockedTo: { not: null } } }),
      prisma.unlockCode.count({ where: { ipLockedTo: { not: null } } }),

      // Current config
      prisma.securityConfiguration.findFirst(),
    ]);

    // Calculate fraud detection rate
    const fraudDetectionRate = totalRedemptionAttempts > 0 
      ? (totalFraudLogs / totalRedemptionAttempts * 100).toFixed(2) 
      : '0';

    // Calculate success rate
    const successRate = totalRedemptionAttempts > 0
      ? (((totalRedemptionAttempts - failedRedemptionAttempts) / totalRedemptionAttempts) * 100).toFixed(2)
      : '0';

    // Get top fraud reasons
    const topFraudReasons = await prisma.fraudDetectionLog.groupBy({
      by: ['detectionReason'],
      _count: {
        detectionReason: true,
      },
      orderBy: {
        _count: {
          detectionReason: 'desc',
        },
      },
      take: 5,
    });

    // Get fraud trends (last 7 days)
    const fraudTrends = await prisma.fraudDetectionLog.findMany({
      where: {
        flaggedAt: { gte: sevenDaysAgo },
      },
      select: {
        flaggedAt: true,
      },
      orderBy: { flaggedAt: 'asc' },
    });

    // Group by day
    const fraudByDay: { [key: string]: number } = {};
    fraudTrends.forEach((log: { flaggedAt: Date }) => {
      const day = log.flaggedAt.toISOString().split('T')[0];
      fraudByDay[day] = (fraudByDay[day] || 0) + 1;
    });

    const dashboard = {
      overview: {
        totalFraudLogs,
        unresolvedFraudLogs,
        fraudDetectionRate,
        successRate,
        blockedIPs,
        deviceLockedCodes,
        ipLockedCodes,
      },
      trends: {
        last24h: fraudLogsLast24h,
        last7d: fraudLogsLast7d,
        last30d: fraudLogsLast30d,
        fraudByDay,
      },
      topFraudReasons: topFraudReasons.map((reason: any) => ({
        reason: reason.detectionReason,
        count: reason._count.detectionReason,
      })),
      redemptionStats: {
        total: totalRedemptionAttempts,
        failed: failedRedemptionAttempts,
        successRate,
      },
      securityConfig: securityConfig || {
        deviceLockingEnabled: false,
        ipLockingEnabled: false,
        fraudDetectionEnabled: false,
      },
    };

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error('Security dashboard error:', error);
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch security dashboard data' },
      { status: 500 }
    );
  }
}
