
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  // Check admin authentication
  const authError = await requireAdminAuth();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // 30d
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get total revenue for the period
    const totalRevenue = await prisma.codePaymentTransaction.aggregate({
      where: {
        createdAt: { gte: startDate },
        confirmationStatus: 'confirmed'
      },
      _sum: { amountUsd: true }
    });

    // Get monthly revenue data
    const monthlyRevenue = [];
    const monthsToShow = timeRange === '1y' ? 12 : timeRange === '90d' ? 3 : 1;
    
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthData = await prisma.codePaymentTransaction.aggregate({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          confirmationStatus: 'confirmed'
        },
        _sum: { amountUsd: true },
        _count: true
      });

      monthlyRevenue.push({
        month: monthStart.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        revenue: Number(monthData._sum.amountUsd || 0),
        transactions: monthData._count
      });
    }

    // Get payment method breakdown
    const paymentMethods = await prisma.codePaymentTransaction.groupBy({
      by: ['paymentMethod'],
      where: {
        createdAt: { gte: startDate },
        confirmationStatus: 'confirmed'
      },
      _sum: { amountUsd: true },
      _count: true
    });

    const totalPaymentAmount = paymentMethods.reduce((sum, method) => sum + Number(method._sum.amountUsd || 0), 0);
    const paymentMethodBreakdown = paymentMethods.map((method, index) => {
      const amount = Number(method._sum.amountUsd || 0);
      return {
        method: method.paymentMethod === 'wallet' ? 'Wallet' : 'Crypto',
        amount,
        percentage: totalPaymentAmount > 0 ? Math.round((amount / totalPaymentAmount) * 100) : 0,
        color: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'][index % 4]
      };
    });

    // Get network breakdown for crypto payments
    const networkBreakdown = await prisma.codePaymentTransaction.groupBy({
      by: ['networkType'],
      where: {
        createdAt: { gte: startDate },
        confirmationStatus: 'confirmed',
        paymentMethod: 'crypto'
      },
      _sum: { amountUsd: true },
      _count: true
    });

    const formattedNetworkBreakdown = networkBreakdown
      .filter(network => network.networkType)
      .map((network, index) => ({
        network: network.networkType || 'Unknown',
        amount: Number(network._sum.amountUsd || 0),
        transactions: network._count,
        color: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'][index % 4]
      }));

    // Get creator revenue data
    const creatorRevenue = await prisma.user.findMany({
      select: {
        userId: true,
        firstName: true,
        lastName: true,
        username: true,
        codePaymentTransactions: {
          select: {
            amountUsd: true
          },
          where: {
            createdAt: { gte: startDate },
            confirmationStatus: 'confirmed'
          }
        }
      },
      where: {
        codePaymentTransactions: {
          some: {
            createdAt: { gte: startDate },
            confirmationStatus: 'confirmed'
          }
        }
      }
    });

    const formattedCreatorRevenue = creatorRevenue
      .map(creator => {
        const transactions = creator.codePaymentTransactions;
        const totalSpent = transactions.reduce((sum, tx) => sum + Number(tx.amountUsd), 0);
        
        return {
          creatorId: creator.userId,
          creatorName: creator.firstName && creator.lastName 
            ? `${creator.firstName} ${creator.lastName}`
            : creator.username,
          totalSpent,
          transactionCount: transactions.length,
          averageOrderValue: transactions.length > 0 ? totalSpent / transactions.length : 0
        };
      })
      .filter(creator => creator.totalSpent > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent);

    // Calculate revenue growth
    const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
    const previousRevenue = await prisma.codePaymentTransaction.aggregate({
      where: {
        createdAt: { gte: previousPeriodStart, lt: startDate },
        confirmationStatus: 'confirmed'
      },
      _sum: { amountUsd: true }
    });

    const currentRevenue = Number(totalRevenue._sum.amountUsd || 0);
    const previousRevenueAmount = Number(previousRevenue._sum.amountUsd || 0);
    const growthPercentage = previousRevenueAmount > 0 
      ? ((currentRevenue - previousRevenueAmount) / previousRevenueAmount) * 100
      : currentRevenue > 0 ? 100 : 0;

    return NextResponse.json({
      totalRevenue: currentRevenue,
      monthlyRevenue,
      paymentMethodBreakdown,
      networkBreakdown: formattedNetworkBreakdown,
      creatorRevenue: formattedCreatorRevenue,
      revenueGrowth: {
        currentMonth: currentRevenue,
        previousMonth: previousRevenueAmount,
        growthPercentage: Math.round(growthPercentage)
      }
    });

  } catch (error) {
    console.error('Error fetching revenue data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue data' },
      { status: 500 }
    );
  }
}

