
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST /api/tracks/[trackId]/like - Like a track
export async function POST(
  request: NextRequest,
  { params }: { params: { trackId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { trackId } = params;
    const userId = session.user.id;

    // Check if track exists
    const track = await prisma.track.findUnique({
      where: { id: trackId }
    });

    if (!track) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      );
    }

    // Check if user already liked this track
    const existingLike = await prisma.trackLike.findUnique({
      where: {
        userId_trackId: {
          userId,
          trackId
        }
      }
    });

    if (existingLike) {
      return NextResponse.json(
        { error: 'Track already liked' },
        { status: 409 }
      );
    }

    // Create the like and increment like count in a transaction
    await prisma.$transaction([
      prisma.trackLike.create({
        data: {
          userId,
          trackId
        }
      }),
      prisma.track.update({
        where: { id: trackId },
        data: {
          likeCount: {
            increment: 1
          }
        }
      })
    ]);

    return NextResponse.json(
      { message: 'Track liked successfully', liked: true },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error liking track:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/tracks/[trackId]/like - Unlike a track
export async function DELETE(
  request: NextRequest,
  { params }: { params: { trackId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { trackId } = params;
    const userId = session.user.id;

    // Check if track exists
    const track = await prisma.track.findUnique({
      where: { id: trackId }
    });

    if (!track) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      );
    }

    // Check if user actually liked this track
    const existingLike = await prisma.trackLike.findUnique({
      where: {
        userId_trackId: {
          userId,
          trackId
        }
      }
    });

    if (!existingLike) {
      return NextResponse.json(
        { error: 'Track not liked' },
        { status: 404 }
      );
    }

    // Remove the like and decrement like count in a transaction
    await prisma.$transaction([
      prisma.trackLike.delete({
        where: {
          userId_trackId: {
            userId,
            trackId
          }
        }
      }),
      prisma.track.update({
        where: { id: trackId },
        data: {
          likeCount: {
            decrement: 1
          }
        }
      })
    ]);

    return NextResponse.json(
      { message: 'Track unliked successfully', liked: false },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error unliking track:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/tracks/[trackId]/like - Check if user has liked a track
export async function GET(
  request: NextRequest,
  { params }: { params: { trackId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { liked: false },
        { status: 200 }
      );
    }

    const { trackId } = params;
    const userId = session.user.id;

    // Check if user has liked this track
    const existingLike = await prisma.trackLike.findUnique({
      where: {
        userId_trackId: {
          userId,
          trackId
        }
      }
    });

    return NextResponse.json(
      { liked: !!existingLike },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error checking like status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
