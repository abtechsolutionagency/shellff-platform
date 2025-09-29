
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get date ranges for comparison
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Get total code statistics
    const [totalCodes, totalRedeemed, totalRevenue] = await Promise.all([
      // Total codes generated
      prisma.unlockCode.count(),
      
      // Total codes redeemed
      prisma.unlockCode.count({
        where: { status: 'redeemed' }
      }),
      
      // Total revenue from code generation
      prisma.codePaymentTransaction.aggregate({
        where: { confirmationStatus: 'confirmed' },
        _sum: { amountUsd: true }
      })
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

    const [currentMonthRevenue, previousMonthRevenue] = await Promise.all([
      prisma.codePaymentTransaction.aggregate({
        where: { 
          createdAt: { gte: thirtyDaysAgo },
          confirmationStatus: 'confirmed'
        },
        _sum: { amountUsd: true }
      }),
      prisma.codePaymentTransaction.aggregate({
        where: { 
          createdAt: { 
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          },
          confirmationStatus: 'confirmed'
        },
        _sum: { amountUsd: true }
      })
    ]);

    const [currentMonthRedemptions, previousMonthRedemptions] = await Promise.all([
      prisma.unlockCode.count({
        where: { 
          redeemedAt: { gte: thirtyDaysAgo },
          status: 'redeemed'
        }
      }),
      prisma.unlockCode.count({
        where: { 
          redeemedAt: { 
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          },
          status: 'redeemed'
        }
      })
    ]);

    // Calculate growth percentages
    const codesGrowth = previousMonthCodes > 0 
      ? ((currentMonthCodes - previousMonthCodes) / previousMonthCodes) * 100
      : currentMonthCodes > 0 ? 100 : 0;

    const currentRevenueNum = Number(currentMonthRevenue._sum.amountUsd || 0);
    const previousRevenueNum = Number(previousMonthRevenue._sum.amountUsd || 0);
    const revenueGrowth = previousRevenueNum > 0
      ? ((currentRevenueNum - previousRevenueNum) / previousRevenueNum) * 100
      : currentRevenueNum > 0 ? 100 : 0;

    const redemptionsGrowth = previousMonthRedemptions > 0
      ? ((currentMonthRedemptions - previousMonthRedemptions) / previousMonthRedemptions) * 100
      : currentMonthRedemptions > 0 ? 100 : 0;

    // Get recent activity data (last 30 days)
    const recentActivity = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      
      const [codesGenerated, codesRedeemed, dayRevenue] = await Promise.all([
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
            status: 'redeemed'
          }
        }),
        prisma.codePaymentTransaction.aggregate({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate
            },
            confirmationStatus: 'confirmed'
          },
          _sum: { amountUsd: true }
        })
      ]);

      recentActivity.push({
        date: date.toISOString().split('T')[0],
        codesGenerated,
        codesRedeemed,
        revenue: dayRevenue._sum.amountUsd || 0
      });
    }

    // Get redemption status distribution
    const [unusedCount, redeemedCount, invalidCount] = await Promise.all([
      prisma.unlockCode.count({ where: { status: 'unused' } }),
      prisma.unlockCode.count({ where: { status: 'redeemed' } }),
      prisma.unlockCode.count({ where: { status: 'invalid' } })
    ]);

    const redemptionsByStatus = [
      { status: 'Unused', count: unusedCount, color: '#06b6d4' },
      { status: 'Redeemed', count: redeemedCount, color: '#10b981' },
      { status: 'Invalid', count: invalidCount, color: '#ef4444' }
    ];

    // Get top creators by code generation
    const topCreators = await prisma.user.findMany({
      select: {
        userId: true,
        firstName: true,
        lastName: true,
        username: true,
        _count: {
          select: {
            createdUnlockCodes: true
          }
        },
        codePaymentTransactions: {
          select: {
            amountUsd: true
          },
          where: {
            confirmationStatus: 'confirmed'
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
      id: creator.userId,
      name: creator.firstName && creator.lastName
        ? `${creator.firstName} ${creator.lastName}`
        : creator.username,
      codesGenerated: creator._count.createdUnlockCodes,
      revenue: creator.codePaymentTransactions.reduce((sum: number, tx: any) => sum + Number(tx.amountUsd), 0)
    }));

    return NextResponse.json({
      totalCodes,
      totalRedeemed,
      totalRevenue: Number(totalRevenue._sum.amountUsd || 0),
      activeCreators,
      monthlyGrowth: {
        codes: Math.round(codesGrowth),
        revenue: Math.round(revenueGrowth),
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
