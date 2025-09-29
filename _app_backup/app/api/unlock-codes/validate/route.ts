
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { validateUnlockCode } from '@/lib/utils/codeValidator';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { code } = await request.json();

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

    // Use the code validator utility
    const validation = await validateUnlockCode(code, user.userId);

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Return album information without redeeming yet
    return NextResponse.json({
      valid: true,
      albumTitle: validation.release?.title,
      artistName: validation.release?.artist,
      albumCover: validation.release?.coverArt,
      releaseType: validation.release?.releaseType,
      trackCount: validation.release?.trackCount,
      code: validation.code
    });

  } catch (error) {
    console.error('Code validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate code' },
      { status: 500 }
    );
  }
}
