
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminUserOrThrow } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUserOrThrow();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const resolved = searchParams.get('resolved');
    const ipAddress = searchParams.get('ipAddress');
    const userId = searchParams.get('userId');
    const skip = (page - 1) * limit;

    const where: any = {};

    if (resolved !== null) {
      where.resolved = resolved === 'true';
    }
    
    if (ipAddress) {
      where.ipAddress = { contains: ipAddress };
    }
    
    if (userId) {
      where.userId = { contains: userId };
    }

    const [logs, total] = await Promise.all([
      prisma.fraudDetectionLog.findMany({
        where,
        orderBy: { flaggedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.fraudDetectionLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Fraud logs fetch error:', error);
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch fraud logs' },
      { status: 500 }
    );
  }
}
