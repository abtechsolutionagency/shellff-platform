
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
      return NextResponse.json({ users: [] });
    }

    // Search users by name, username, User ID, or SCI ID
    const users = await prisma.user.findMany({
      where: {
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
            userId: {
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
          {
            email: {
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
        userId: true,
        sciId: true,
        userType: true,
        avatar: true,
        isVerified: true,
        email: true,
      },
      take: limit,
      orderBy: [
        { userType: 'desc' }, // Creators first
        { isVerified: 'desc' },
        { username: 'asc' },
      ],
    });

    // Format the results (hide email for privacy unless exact match)
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username,
      username: user.username,
      userId: user.userId,
      sciId: user.sciId,
      userType: user.userType,
      avatar: user.avatar,
      isVerified: user.isVerified,
      // Only include email if it was an exact match
      ...(user.email.toLowerCase() === query.toLowerCase() && { email: user.email }),
    }));

    return NextResponse.json({ users: formattedUsers });

  } catch (error) {
    console.error('User search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
