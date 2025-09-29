
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
    const timeRange = searchParams.get('timeRange') || 'month'; // 'day', 'week', 'month', 'year'

    // Calculate date filter
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
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get listening statistics
    const [
      totalPlayEvents,
      totalListeningTime,
      uniqueTracks,
      topArtists,
      topTracks,
      listeningByDay
    ] = await Promise.all([
      // Total play events
      prisma.playEvent.count({
        where: {
          userId: session.user.id,
          startTime: { gte: startDate }
        }
      }),

      // Total listening time
      prisma.playEvent.aggregate({
        where: {
          userId: session.user.id,
          startTime: { gte: startDate }
        },
        _sum: {
          duration: true
        }
      }),

      // Number of unique tracks played
      prisma.playEvent.findMany({
        where: {
          userId: session.user.id,
          startTime: { gte: startDate }
        },
        select: {
          trackId: true
        },
        distinct: ['trackId']
      }),

      // Top artists
      prisma.playEvent.groupBy({
        by: ['trackId'],
        where: {
          userId: session.user.id,
          startTime: { gte: startDate }
        },
        _count: {
          trackId: true
        },
        orderBy: {
          _count: {
            trackId: 'desc'
          }
        },
        take: 10
      }),

      // Top tracks
      prisma.listeningHistory.findMany({
        where: {
          userId: session.user.id,
          lastPlayed: { gte: startDate }
        },
        orderBy: {
          playCount: 'desc'
        },
        take: 10,
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
      }),

      // Listening activity by day (last 30 days)
      prisma.$queryRaw`
        SELECT 
          DATE(start_time) as date,
          COUNT(*) as play_count,
          SUM(duration) as total_duration
        FROM play_events 
        WHERE user_id = ${session.user.id} 
          AND start_time >= ${startDate}
        GROUP BY DATE(start_time)
        ORDER BY date DESC
        LIMIT 30
      `
    ]);

    // Get detailed artist information for top artists
    const artistIds = await Promise.all(
      topArtists.slice(0, 10).map(async (item) => {
        const track = await prisma.track.findUnique({
          where: { id: item.trackId },
          include: { artist: true }
        });
        return {
          artist: track?.artist,
          playCount: item._count.trackId
        };
      })
    );

    // Remove duplicates and consolidate artist play counts
    const artistPlayCounts = new Map();
    artistIds.forEach(({ artist, playCount }) => {
      if (artist) {
        const existing = artistPlayCounts.get(artist.id) || { ...artist, totalPlays: 0 };
        existing.totalPlays += playCount;
        artistPlayCounts.set(artist.id, existing);
      }
    });

    const topArtistsFormatted = Array.from(artistPlayCounts.values())
      .sort((a, b) => b.totalPlays - a.totalPlays)
      .slice(0, 10);

    const stats = {
      overview: {
        totalPlayEvents,
        totalListeningTimeMinutes: Math.round((totalListeningTime._sum.duration || 0) / 60),
        uniqueTracks: uniqueTracks.length,
        averageSessionLength: totalPlayEvents > 0 
          ? Math.round((totalListeningTime._sum.duration || 0) / totalPlayEvents / 60) 
          : 0
      },
      topArtists: topArtistsFormatted.map(artist => ({
        id: artist.id,
        name: artist.name,
        avatar: artist.avatar,
        playCount: artist.totalPlays
      })),
      topTracks: topTracks.map(entry => ({
        id: entry.track.id,
        title: entry.track.title,
        artist: entry.track.artist.name,
        artistId: entry.track.artist.id,
        albumTitle: entry.track.album?.title,
        imageUrl: entry.track.album?.coverArt,
        playCount: entry.playCount,
        totalTimeMinutes: Math.round(entry.totalTime / 60)
      })),
      listeningActivity: listeningByDay
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching listening stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listening statistics' }, 
      { status: 500 }
    );
  }
}
