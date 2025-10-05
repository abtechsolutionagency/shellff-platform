
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get date ranges for comparison
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Get total code statistics
    const [totalCodes, totalRedeemed] = await Promise.all([
      // Total codes generated
      prisma.unlockCode.count(),
      
      // Total codes redeemed
      prisma.unlockCode.count({
        where: { status: 'REDEEMED' }
      }),
    ]);

    // Get active creators (creators who have generated codes)
    const activeCreators = await prisma.user.count({
      where: {
        createdUnlockCodes: {
          some: {}
        }
      }
    });

    // Calculate monthly growth
    const [currentMonthCodes, previousMonthCodes] = await Promise.all([
      prisma.unlockCode.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      prisma.unlockCode.count({
        where: { 
          createdAt: { 
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      })
    ]);

    const [currentMonthRedemptions, previousMonthRedemptions] = await Promise.all([
      prisma.unlockCode.count({
        where: { 
          redeemedAt: { gte: thirtyDaysAgo },
          status: 'REDEEMED'
        }
      }),
      prisma.unlockCode.count({
        where: { 
          redeemedAt: { 
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          },
          status: 'REDEEMED'
        }
      })
    ]);

    // Calculate growth percentages
    const codesGrowth = previousMonthCodes > 0 
      ? ((currentMonthCodes - previousMonthCodes) / previousMonthCodes) * 100
      : currentMonthCodes > 0 ? 100 : 0;

    const redemptionsGrowth = previousMonthRedemptions > 0
      ? ((currentMonthRedemptions - previousMonthRedemptions) / previousMonthRedemptions) * 100
      : currentMonthRedemptions > 0 ? 100 : 0;

    // Get recent activity data (last 30 days)
    const recentActivity = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      
      const [codesGenerated, codesRedeemed] = await Promise.all([
        prisma.unlockCode.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate
            }
          }
        }),
        prisma.unlockCode.count({
          where: {
            redeemedAt: {
              gte: date,
              lt: nextDate
            },
            status: 'REDEEMED'
          }
        })
      ]);

      recentActivity.push({
        date: date.toISOString().split('T')[0],
        codesGenerated,
        codesRedeemed,
        revenue: 0 // Revenue tracking not available
      });
    }

    // Get redemption status distribution
    const [unusedCount, redeemedCount, invalidCount] = await Promise.all([
      prisma.unlockCode.count({ where: { status: 'UNUSED' } }),
      prisma.unlockCode.count({ where: { status: 'REDEEMED' } }),
      prisma.unlockCode.count({ where: { status: 'REVOKED' } })
    ]);

    const redemptionsByStatus = [
      { status: 'Unused', count: unusedCount, color: '#06b6d4' },
      { status: 'Redeemed', count: redeemedCount, color: '#10b981' },
      { status: 'Invalid', count: invalidCount, color: '#ef4444' }
    ];

    // Get top creators by code generation
    const topCreators = await prisma.user.findMany({
      select: {
        id: true,
        displayName: true,
        _count: {
          select: {
            createdUnlockCodes: true
          }
        }
      },
      where: {
        createdUnlockCodes: {
          some: {}
        }
      },
      orderBy: {
        createdUnlockCodes: {
          _count: 'desc'
        }
      },
      take: 10
    });

    const formattedTopCreators = topCreators.map((creator: any) => ({
      id: creator.id,
      name: creator.displayName,
      codesGenerated: creator._count.createdUnlockCodes,
      revenue: 0 // Revenue tracking not available
    }));

    return NextResponse.json({
      totalCodes,
      totalRedeemed,
      totalRevenue: 0, // Revenue tracking not available in current schema
      activeCreators,
      monthlyGrowth: {
        codes: Math.round(codesGrowth),
        revenue: 0, // Revenue tracking not available
        redemptions: Math.round(redemptionsGrowth)
      },
      recentActivity,
      redemptionsByStatus,
      topCreators: formattedTopCreators
    });

  } catch (error) {
    console.error('Error fetching code system stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system statistics' },
      { status: 500 }
    );
  }
}
