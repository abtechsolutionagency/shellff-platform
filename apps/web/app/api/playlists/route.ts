
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// GET /api/playlists - Get user's playlists
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const skip = (page - 1) * limit;

    const [playlists, totalCount] = await Promise.all([
      prisma.playlist.findMany({
        where: {
          userId: session.user.id
        },
        include: {
          _count: {
            select: {
              tracks: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.playlist.count({
        where: {
          userId: session.user.id
        }
      })
    ]);

    return NextResponse.json({
      playlists,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlists' },
      { status: 500 }
    );
  }
}

// POST /api/playlists - Create new playlist
const createPlaylistSchema = z.object({
  name: z.string().min(1, 'Playlist name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  coverArt: z.string().optional(),
  isPublic: z.boolean().default(false)
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check user type - only listeners can create playlists
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userType: true }
    });

    if (user?.userType !== 'LISTENER') {
      return NextResponse.json(
        { error: 'Only listeners can create playlists' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createPlaylistSchema.parse(body);

    const playlist = await prisma.playlist.create({
      data: {
        ...validatedData,
        userId: session.user.id
      },
      include: {
        _count: {
          select: {
            tracks: true
          }
        }
      }
    });

    return NextResponse.json(playlist, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating playlist:', error);
    return NextResponse.json(
      { error: 'Failed to create playlist' },
      { status: 500 }
    );
  }
}
