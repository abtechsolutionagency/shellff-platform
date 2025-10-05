
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { primaryRole: true, id: true }
    });

    if (!user || user.primaryRole !== 'CREATOR') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch releases for this creator
    const releases = await prisma.release.findMany({
      where: {
        creatorId: user.id
      },
      select: {
        id: true,
        title: true,
        releaseType: true,
        coverArt: true,
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
