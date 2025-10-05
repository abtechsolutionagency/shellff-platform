
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const timeRange = searchParams.get('timeRange'); // 'day', 'week', 'month', 'year'

    // Calculate date filter based on time range
    let dateFilter = {};
    if (timeRange) {
      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }

      dateFilter = {
        lastPlayed: {
          gte: startDate
        }
      };
    }

    // Get listening history with track details
    // Get listening history with track details (commented out - model doesn't exist)
    // Fallback: return empty array for now
    const listeningHistory: any[] = [];

    // Get total count for pagination (commented out - model doesn't exist)
    const totalCount = 0;

    // Format response
    const formattedHistory = listeningHistory.map((entry: any) => ({
      id: entry.id,
      lastPlayed: entry.lastPlayed,
      playCount: entry.playCount,
      totalTime: entry.totalTime,
      track: {
        id: entry.track.id,
        title: entry.track.title,
        duration: entry.track.duration,
        artist: entry.track.artist.name,
        artistId: entry.track.artist.id,
        artistAvatar: entry.track.artist.avatar,
        albumTitle: entry.track.album?.title,
        albumId: entry.track.album?.id,
        imageUrl: entry.track.album?.coverArt,
        audioUrl: entry.track.mediaAssets[0]?.url,
        playCount: entry.track.playCount,
        likeCount: entry.track.likeCount
      }
    }));

    return NextResponse.json({
      history: formattedHistory,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching listening history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listening history' }, 
      { status: 500 }
    );
  }
}

// Get recently played tracks (simplified version for quick access)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { limit = 10 } = body;

    // Get recent tracks (commented out - model doesn't exist)
    const recentTracks: any[] = [];

    const formattedTracks = recentTracks.map((entry: any) => ({
      id: entry.track.id,
      title: entry.track.title,
      artist: entry.track.artist.name,
      artistId: entry.track.artist.id,
      albumTitle: entry.track.album?.title,
      albumId: entry.track.album?.id,
      imageUrl: entry.track.album?.coverArt,
      audioUrl: entry.track.mediaAssets[0]?.url,
      duration: entry.track.duration,
      playCount: entry.track.playCount,
      likeCount: entry.track.likeCount,
      lastPlayed: entry.lastPlayed
    }));

    return NextResponse.json({
      recentTracks: formattedTracks
    });

  } catch (error) {
    console.error('Error fetching recent tracks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent tracks' }, 
      { status: 500 }
    );
  }
}
