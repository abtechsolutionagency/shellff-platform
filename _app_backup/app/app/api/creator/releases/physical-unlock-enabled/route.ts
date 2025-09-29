
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { userType: true, userId: true }
    });

    if (!user || user.userType !== 'CREATOR') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch releases with physical unlock enabled
    const releases = await prisma.release.findMany({
      where: {
        creatorId: user.userId,
        physicalUnlockEnabled: true
      },
      select: {
        id: true,
        title: true,
        releaseType: true,
        status: true,
        physicalUnlockEnabled: true,
        physicalReleaseType: true,
        coverArt: true,
        publishedAt: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: releases
    });

  } catch (error) {
    console.error('Error fetching physical unlock releases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch releases' }, 
      { status: 500 }
    );
  }
}
