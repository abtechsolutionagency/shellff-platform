import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { validateUnlockCode } from '@/lib/utils/codeValidator';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const code = body?.code as string | undefined;

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const validation = await validateUnlockCode(code, {
      userPrimaryId: user.id,
      userPublicId: user.id,
    });

    if (!validation.valid || !validation.release) {
      return NextResponse.json({ error: validation.error || 'Invalid unlock code' }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      alreadyOwned: Boolean(validation.alreadyOwned),
      albumTitle: validation.release.title,
      artistName: validation.release.artist,
      albumCover: validation.release.coverArt,
      releaseType: validation.release.releaseType,
      trackCount: validation.release.trackCount,
      code: validation.code,
    });
  } catch (error) {
    console.error('Code validation error:', error);
    return NextResponse.json({ error: 'Failed to validate code' }, { status: 500 });
  }
}
