
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/user/likes - Get user's liked tracks
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50); // Max 50 items per page
    const offset = (page - 1) * limit;

    const userId = session.user.id;

    // Get liked tracks with pagination
    const [likedTracks, totalCount] = await Promise.all([
      prisma.trackLike.findMany({
        where: { userId },
        include: {
          track: {
            include: {
              artist: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              },
              album: {
                select: {
                  id: true,
                  title: true,
                  coverArt: true
                }
              },
              mediaAssets: {
                select: {
                  id: true,
                  type: true,
                  url: true,
                  quality: true,
                  format: true
                }
              },
              _count: {
                select: {
                  likes: true,
                  playlistTracks: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.trackLike.count({
        where: { userId }
      })
    ]);

    // Transform the response to match the expected track format
    const tracks = likedTracks.map((like: any) => ({
      id: like.track.id,
      title: like.track.title,
      duration: like.track.duration,
      trackNumber: like.track.trackNumber,
      explicit: like.track.explicit,
      price: like.track.price,
      playCount: like.track.playCount,
      likeCount: like.track._count.likes,
      isExclusive: like.track.isExclusive,
      createdAt: like.track.createdAt,
      updatedAt: like.track.updatedAt,
      artist: like.track.artist,
      album: like.track.album,
      mediaAssets: like.track.mediaAssets,
      likedAt: like.createdAt, // When the user liked this track
      liked: true // Always true for liked tracks
    }));

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      tracks,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    console.error('Error fetching liked tracks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
