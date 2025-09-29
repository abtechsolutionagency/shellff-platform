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
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const code = body?.code as string | undefined;
    const deviceFingerprint = body?.deviceFingerprint as string | undefined;

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, userId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const clientIp = getServerClientIp(request.headers);
    const userAgent = request.headers.get('user-agent') || undefined;

    const result = await redeemUnlockCode(code, {
      userPrimaryId: user.id,
      userPublicId: user.userId,
      clientIp: clientIp || undefined,
      userAgent,
      deviceFingerprint,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Code redeemed successfully',
      release: result.release,
      access: result.access,
    });
  } catch (error) {
    console.error('Code redemption error:', error);
    return NextResponse.json({ error: 'Failed to redeem code' }, { status: 500 });
  }
}
