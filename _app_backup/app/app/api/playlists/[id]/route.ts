
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// GET /api/playlists/[id] - Get specific playlist
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

    const playlist = await prisma.playlist.findUnique({
      where: {
        id: params.id
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        tracks: {
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
          },
          orderBy: {
            position: 'asc'
          }
        }
      }
    });

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    // Check if user can view this playlist
    const canView = playlist.isPublic || playlist.userId === session.user.id;
    
    if (!canView) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(playlist);

  } catch (error) {
    console.error('Error fetching playlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlist' },
      { status: 500 }
    );
  }
}

// PUT /api/playlists/[id] - Update playlist
const updatePlaylistSchema = z.object({
  name: z.string().min(1, 'Playlist name is required').max(100, 'Name too long').optional(),
  description: z.string().optional(),
  coverArt: z.string().optional(),
  isPublic: z.boolean().optional()
});

export async function PUT(
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
    const existingPlaylist = await prisma.playlist.findUnique({
      where: { id: params.id },
      select: { userId: true }
    });

    if (!existingPlaylist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    if (existingPlaylist.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updatePlaylistSchema.parse(body);

    // Remove undefined values
    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([_, value]) => value !== undefined)
    );

    const playlist = await prisma.playlist.update({
      where: { id: params.id },
      data: updateData,
      include: {
        _count: {
          select: {
            tracks: true
          }
        }
      }
    });

    return NextResponse.json(playlist);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating playlist:', error);
    return NextResponse.json(
      { error: 'Failed to update playlist' },
      { status: 500 }
    );
  }
}

// DELETE /api/playlists/[id] - Delete playlist
export async function DELETE(
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
    const existingPlaylist = await prisma.playlist.findUnique({
      where: { id: params.id },
      select: { userId: true, name: true }
    });

    if (!existingPlaylist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    if (existingPlaylist.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Delete playlist (cascade will handle playlist tracks)
    await prisma.playlist.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      message: `Playlist "${existingPlaylist.name}" deleted successfully`
    });

  } catch (error) {
    console.error('Error deleting playlist:', error);
    return NextResponse.json(
      { error: 'Failed to delete playlist' },
      { status: 500 }
    );
  }
}
