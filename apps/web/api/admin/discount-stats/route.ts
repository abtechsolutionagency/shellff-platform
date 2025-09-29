
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { DiscountEngine } from '@/lib/discount-engine';

const prisma = new PrismaClient();

// GET /api/admin/discount-stats - Get discount statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let start: Date | undefined;
    let end: Date | undefined;

    if (startDate) start = new Date(startDate);
    if (endDate) end = new Date(endDate);

    const stats = await DiscountEngine.getDiscountStatistics(start, end);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching discount statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discount statistics' },
      { status: 500 }
    );
  }
}
