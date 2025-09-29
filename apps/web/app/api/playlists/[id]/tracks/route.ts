
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// GET /api/playlists/[id]/tracks - Get playlist tracks
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check playlist access
    const playlist = await prisma.playlist.findUnique({
      where: { id: params.id },
      select: { 
        id: true,
        userId: true, 
        isPublic: true,
        name: true 
      }
    });

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    const canView = playlist.isPublic || playlist.userId === session.user.id;
    
    if (!canView) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const playlistTracks = await prisma.playlistTrack.findMany({
      where: {
        playlistId: params.id
      },
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
            likes: session.user.id ? {
              where: {
                userId: session.user.id
              },
              select: {
                userId: true
              }
            } : false
          }
        }
      },
      orderBy: {
        position: 'asc'
      }
    });

    // Format response with like status
    const tracks = playlistTracks.map((pt) => ({
      ...pt.track,
      isLiked: pt.track.likes ? pt.track.likes.length > 0 : false,
      likes: undefined, // Remove likes array from response
      position: pt.position,
      addedAt: pt.addedAt
    }));

    return NextResponse.json({
      playlistId: params.id,
      playlistName: playlist.name,
      tracks
    });

  } catch (error) {
    console.error('Error fetching playlist tracks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlist tracks' },
      { status: 500 }
    );
  }
}

// POST /api/playlists/[id]/tracks - Add track to playlist
const addTrackSchema = z.object({
  trackId: z.string().cuid('Invalid track ID'),
  position: z.number().int().min(0).optional()
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify playlist ownership
    const playlist = await prisma.playlist.findUnique({
      where: { id: params.id },
      select: { 
        userId: true, 
        trackCount: true,
        duration: true
      }
    });

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    if (playlist.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { trackId, position } = addTrackSchema.parse(body);

    // Verify track exists
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      select: { id: true, duration: true, title: true }
    });

    if (!track) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      );
    }

    // Check if track is already in playlist
    const existingTrack = await prisma.playlistTrack.findUnique({
      where: {
        playlistId_trackId: {
          playlistId: params.id,
          trackId: trackId
        }
      }
    });

    if (existingTrack) {
      return NextResponse.json(
        { error: 'Track already in playlist' },
        { status: 409 }
      );
    }

    // Determine position
    const finalPosition = position !== undefined ? position : playlist.trackCount;

    // If inserting at specific position, update existing positions
    if (position !== undefined && position < playlist.trackCount) {
      await prisma.playlistTrack.updateMany({
        where: {
          playlistId: params.id,
          position: {
            gte: position
          }
        },
        data: {
          position: {
            increment: 1
          }
        }
      });
    }

    // Add track to playlist
    const playlistTrack = await prisma.playlistTrack.create({
      data: {
        playlistId: params.id,
        trackId: trackId,
        position: finalPosition
      },
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
            }
          }
        }
      }
    });

    // Update playlist stats
    await prisma.playlist.update({
      where: { id: params.id },
      data: {
        trackCount: {
          increment: 1
        },
        duration: {
          increment: track.duration
        },
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      message: `"${track.title}" added to playlist`,
      playlistTrack
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error adding track to playlist:', error);
    return NextResponse.json(
      { error: 'Failed to add track to playlist' },
      { status: 500 }
    );
  }
}
