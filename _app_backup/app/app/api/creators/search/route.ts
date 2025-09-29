
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);

    if (!query || query.length < 2) {
      return NextResponse.json({ creators: [] });
    }

    // Search creators by name, username, or SCI ID
    const creators = await prisma.user.findMany({
      where: {
        userType: 'CREATOR',
        sciId: {
          not: null,
        },
        OR: [
          {
            username: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            firstName: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            lastName: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            sciId: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
        // Exclude current user
        id: {
          not: (session.user as any).id,
        },
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        sciId: true,
        avatar: true,
        isVerified: true,
      },
      take: limit,
      orderBy: [
        { isVerified: 'desc' },
        { username: 'asc' },
      ],
    });

    // Format the results
    const formattedCreators = creators.map((creator) => ({
      id: creator.id,
      name: [creator.firstName, creator.lastName].filter(Boolean).join(' ') || creator.username,
      username: creator.username,
      sciId: creator.sciId,
      avatar: creator.avatar,
      isVerified: creator.isVerified,
    }));

    return NextResponse.json({ creators: formattedCreators });

  } catch (error) {
    console.error('Creator search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
