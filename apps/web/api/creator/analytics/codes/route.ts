
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

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const releaseId = searchParams.get('releaseId') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const offset = (page - 1) * limit;

    // Build filters
    const filters: any = {
      creatorId: user.userId,
    };

    if (search) {
      filters.code = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (status && status !== 'all') {
      filters.status = status;
    }

    if (releaseId && releaseId !== 'all') {
      filters.releaseId = releaseId;
    }

    // Get total count for pagination
    const totalCodes = await prisma.unlockCode.count({
      where: filters,
    });

    // Get codes with pagination
    const codes = await prisma.unlockCode.findMany({
      where: filters,
      include: {
        release: {
          select: {
            title: true,
            coverArt: true,
          },
        },
        redeemer: {
          select: {
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        paymentTransaction: {
          select: {
            batchId: true,
            amountUsd: true,
            paymentMethod: true,
          },
        },
        redemptionLogs: {
          where: {
            success: true,
          },
          orderBy: {
            redeemedAt: 'desc',
          },
          take: 1,
          select: {
            redeemedAt: true,
            ipAddress: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder as 'asc' | 'desc',
      },
      skip: offset,
      take: limit,
    });

    const formattedCodes = codes.map((code: any) => ({
      id: code.id,
      code: code.code,
      status: code.status,
      release: {
        id: code.releaseId,
        title: code.release.title,
        coverArt: code.release.coverArt,
      },
      redeemer: code.redeemer ? {
        username: code.redeemer.username,
        name: `${code.redeemer.firstName || ''} ${code.redeemer.lastName || ''}`.trim() || code.redeemer.username,
      } : null,
      redeemedAt: code.redeemedAt,
      createdAt: code.createdAt,
      costPerCode: code.costPerCode ? parseFloat(code.costPerCode.toString()) : null,
      batchId: code.batchId,
      paymentInfo: code.paymentTransaction ? {
        batchId: code.paymentTransaction.batchId,
        amount: parseFloat(code.paymentTransaction.amountUsd.toString()),
        method: code.paymentTransaction.paymentMethod,
      } : null,
      lastRedemptionAttempt: code.redemptionLogs[0] || null,
    }));

    const totalPages = Math.ceil(totalCodes / limit);

    return NextResponse.json({
      success: true,
      data: {
        codes: formattedCodes,
        pagination: {
          currentPage: page,
          totalPages,
          totalCodes,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });

  } catch (error) {
    console.error('Codes fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch codes data' },
      { status: 500 }
    );
  }
}

// Export codes to CSV
export async function POST(req: NextRequest) {
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

    const { filters } = await req.json();

    // Build query filters
    const queryFilters: any = {
      creatorId: user.userId,
    };

    if (filters?.status && filters.status !== 'all') {
      queryFilters.status = filters.status;
    }

    if (filters?.releaseId && filters.releaseId !== 'all') {
      queryFilters.releaseId = filters.releaseId;
    }

    if (filters?.search) {
      queryFilters.code = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    // Get all codes matching filters
    const codes = await prisma.unlockCode.findMany({
      where: queryFilters,
      include: {
        release: {
          select: {
            title: true,
          },
        },
        redeemer: {
          select: {
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Convert to CSV format
    const csvHeader = 'Code,Release,Status,Redeemer,Redeemed At,Created At,Cost Per Code,Batch ID\n';
    const csvRows = codes.map((code: any) => {
      const redeemer = code.redeemer ? 
        `${code.redeemer.firstName || ''} ${code.redeemer.lastName || ''}`.trim() || code.redeemer.username 
        : '';
      
      return [
        code.code,
        code.release.title,
        code.status,
        redeemer,
        code.redeemedAt ? code.redeemedAt.toISOString() : '',
        code.createdAt.toISOString(),
        code.costPerCode ? code.costPerCode.toString() : '',
        code.batchId || '',
      ].map((field: string | number) => `"${field}"`).join(',');
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="unlock-codes-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json(
      { error: 'Failed to export codes' },
      { status: 500 }
    );
  }
}
