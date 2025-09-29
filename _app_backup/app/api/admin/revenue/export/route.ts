
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  // Check admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';
    const format = searchParams.get('format') || 'csv';

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

    // Get all revenue transactions for the period
    const transactions = await prisma.codePaymentTransaction.findMany({
      where: {
        createdAt: { gte: startDate },
        confirmationStatus: 'confirmed'
      },
      include: {
        creator: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true
          }
        },
        supportedNetwork: {
          select: {
            networkDisplayName: true
          }
        },
        unlockCodes: {
          select: {
            id: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (format === 'csv') {
      // Generate CSV content
      const headers = [
        'Transaction ID',
        'Creator Name',
        'Creator Email',
        'Amount (USD)',
        'Payment Method',
        'Network',
        'Codes Generated',
        'Codes Redeemed',
        'Transaction Date',
        'Confirmation Status',
        'Transaction Hash'
      ];

      const csvRows = [
        headers.join(','), // Header row
        ...transactions.map(tx => {
          const creatorName = tx.creator?.firstName && tx.creator?.lastName 
            ? `${tx.creator.firstName} ${tx.creator.lastName}`
            : tx.creator?.username || 'Unknown';

          const redeemedCodes = tx.unlockCodes.filter(code => code.status === 'redeemed').length;

          return [
            `"${tx.id}"`,
            `"${creatorName}"`,
            `"${tx.creator?.email || ''}"`,
            `"${Number(tx.amountUsd)}"`,
            `"${tx.paymentMethod === 'wallet' ? 'Wallet' : 'Crypto'}"`,
            `"${tx.supportedNetwork?.networkDisplayName || tx.networkType || ''}"`,
            `"${tx.unlockCodes.length}"`,
            `"${redeemedCodes}"`,
            `"${tx.createdAt.toISOString()}"`,
            `"${tx.confirmationStatus}"`,
            `"${tx.transactionHash || ''}"`
          ].join(',');
        })
      ];

      const csvContent = csvRows.join('\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="revenue-report-${timeRange}.csv"`,
        },
      });
    }

    // For now, only CSV export is supported
    return NextResponse.json(
      { error: 'Only CSV format is currently supported' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error exporting revenue report:', error);
    return NextResponse.json(
      { error: 'Failed to export revenue report' },
      { status: 500 }
    );
  }
}
