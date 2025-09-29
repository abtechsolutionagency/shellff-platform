
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.userType !== 'CREATOR') {
      return NextResponse.json({ error: 'Access denied. Creator account required.' }, { status: 403 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const releaseId = searchParams.get('releaseId');
    const timeRange = searchParams.get('timeRange') || '30'; // days
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Build base query filters
    const baseFilters: any = {
      creatorId: user.userId,
    };

    if (releaseId) {
      baseFilters.releaseId = releaseId;
    }

    // Get total codes generated
    const totalCodesGenerated = await prisma.unlockCode.count({
      where: baseFilters,
    });

    // Get total codes redeemed
    const totalCodesRedeemed = await prisma.unlockCode.count({
      where: {
        ...baseFilters,
        status: 'redeemed',
      },
    });

    // Get redemption timeline (daily breakdown)
    const redemptionTimeline = await prisma.codeRedemptionLog.groupBy({
      by: ['redeemedAt'],
      _count: {
        id: true,
      },
      where: {
        unlockCode: baseFilters,
        redeemedAt: {
          gte: startDate,
        },
        success: true,
      },
      orderBy: {
        redeemedAt: 'desc',
      },
    });

    // Process timeline data to group by date
    const timelineMap = new Map<string, number>();
    redemptionTimeline.forEach((entry: any) => {
      const date = entry.redeemedAt.toISOString().split('T')[0];
      timelineMap.set(date, (timelineMap.get(date) || 0) + entry._count.id);
    });

    const timeline = Array.from(timelineMap.entries()).map(([date, count]) => ({
      date,
      redemptions: count,
    }));

    // Get redemption by status breakdown
    const statusBreakdown = await prisma.unlockCode.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
      where: baseFilters,
    });

    // Get geographic distribution (based on redemption logs IP addresses)
    const geographicData = await prisma.codeRedemptionLog.findMany({
      where: {
        unlockCode: baseFilters,
        success: true,
      },
      select: {
        ipAddress: true,
      },
    });

    // For demo purposes, we'll create mock geographic data
    // In production, you'd use an IP geolocation service
    const mockGeoData = [
      { country: 'United States', redemptions: Math.floor(geographicData.length * 0.4) },
      { country: 'United Kingdom', redemptions: Math.floor(geographicData.length * 0.2) },
      { country: 'Canada', redemptions: Math.floor(geographicData.length * 0.15) },
      { country: 'Australia', redemptions: Math.floor(geographicData.length * 0.1) },
      { country: 'Germany', redemptions: Math.floor(geographicData.length * 0.1) },
      { country: 'Others', redemptions: geographicData.length - Math.floor(geographicData.length * 0.95) },
    ].filter(item => item.redemptions > 0);

    // Get recent activity
    const recentActivity = await prisma.codeRedemptionLog.findMany({
      where: {
        unlockCode: baseFilters,
      },
      include: {
        unlockCode: {
          include: {
            release: {
              select: {
                title: true,
              },
            },
          },
        },
        user: {
          select: {
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        redeemedAt: 'desc',
      },
      take: 10,
    });

    // Get monthly revenue from code sales
    const codeRevenue = await prisma.codePaymentTransaction.findMany({
      where: {
        creatorId: user.userId,
        confirmationStatus: 'confirmed',
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        amountUsd: true,
        createdAt: true,
        batchId: true,
      },
    });

    const totalRevenue = codeRevenue.reduce((sum: number, transaction: any) =>
      sum + parseFloat(transaction.amountUsd.toString()), 0
    );

    // Get releases for filtering
    const userReleases = await prisma.release.findMany({
      where: {
        creatorId: user.userId,
        physicalUnlockEnabled: true,
      },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            unlockCodes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalCodesGenerated,
          totalCodesRedeemed,
          redemptionRate: totalCodesGenerated > 0 ? 
            ((totalCodesRedeemed / totalCodesGenerated) * 100).toFixed(1) : '0.0',
          totalRevenue: totalRevenue.toFixed(2),
        },
        timeline,
        statusBreakdown: statusBreakdown.map((item: any) => ({
          status: item.status,
          count: item._count.id,
        })),
        geographicDistribution: mockGeoData,
        recentActivity: recentActivity.map((activity: any) => ({
          id: activity.id,
          code: activity.unlockCode.code,
          releaseTitle: activity.unlockCode.release.title,
          redeemerName: activity.user ? 
            `${activity.user.firstName || ''} ${activity.user.lastName || ''}`.trim() || activity.user.username 
            : 'Anonymous',
          redeemedAt: activity.redeemedAt,
          success: activity.success,
          ipAddress: activity.ipAddress,
        })),
        revenue: codeRevenue.map((transaction: any) => ({
          amount: parseFloat(transaction.amountUsd.toString()),
          date: transaction.createdAt,
          batchId: transaction.batchId,
        })),
        releases: userReleases,
      },
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
