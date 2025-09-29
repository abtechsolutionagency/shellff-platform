
/**
 * Code Slice 4: Code Redemption System
 * API endpoint for listener redemption statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getUserRedemptionStats } from '@/lib/utils/codeValidator';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get redemption statistics
    const stats = await getUserRedemptionStats(user.userId);

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Failed to get redemption stats:', error);
    return NextResponse.json(
      { error: 'Failed to get redemption statistics' },
      { status: 500 }
    );
  }
}
