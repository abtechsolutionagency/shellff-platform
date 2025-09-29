
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// DELETE /api/playlists/[id]/tracks/[trackId] - Remove track from playlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; trackId: string } }
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
      select: { userId: true }
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

    // Find the track in playlist
    const playlistTrack = await prisma.playlistTrack.findUnique({
      where: {
        playlistId_trackId: {
          playlistId: params.id,
          trackId: params.trackId
        }
      },
      include: {
        track: {
          select: {
            title: true,
            duration: true
          }
        }
      }
    });

    if (!playlistTrack) {
      return NextResponse.json(
        { error: 'Track not found in playlist' },
        { status: 404 }
      );
    }

    // Remove track from playlist
    await prisma.playlistTrack.delete({
      where: {
        playlistId_trackId: {
          playlistId: params.id,
          trackId: params.trackId
        }
      }
    });

    // Update positions for remaining tracks
    await prisma.playlistTrack.updateMany({
      where: {
        playlistId: params.id,
        position: {
          gt: playlistTrack.position
        }
      },
      data: {
        position: {
          decrement: 1
        }
      }
    });

    // Update playlist stats
    await prisma.playlist.update({
      where: { id: params.id },
      data: {
        trackCount: {
          decrement: 1
        },
        duration: {
          decrement: playlistTrack.track.duration
        },
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      message: `"${playlistTrack.track.title}" removed from playlist`
    });

  } catch (error) {
    console.error('Error removing track from playlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove track from playlist' },
      { status: 500 }
    );
  }
}
