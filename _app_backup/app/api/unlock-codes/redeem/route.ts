
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redeemUnlockCode } from '@/lib/utils/codeValidator';
import { getServerClientIp } from '@/lib/utils/deviceFingerprinting';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { code, deviceFingerprint } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
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

    // Get client IP and User Agent for logging
    const clientIp = getServerClientIp(request.headers) || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Use the code validator utility to redeem the code
    const result = await redeemUnlockCode(
      code,
      user.userId,
      clientIp,
      userAgent,
      deviceFingerprint
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Code redeemed successfully',
      album: result.album
    });

  } catch (error) {
    console.error('Code redemption error:', error);
    return NextResponse.json(
      { error: 'Failed to redeem code' },
      { status: 500 }
    );
  }
}
