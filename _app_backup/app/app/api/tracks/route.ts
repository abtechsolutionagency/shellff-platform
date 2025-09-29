
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated to include like status
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const genre = searchParams.get("genre");
    const mood = searchParams.get("mood");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "latest"; // latest, popular, alphabetical

    const offset = (page - 1) * limit;

    let where: any = {};
    let orderBy: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { artist: { name: { contains: search, mode: "insensitive" } } },
        { album: { title: { contains: search, mode: "insensitive" } } }
      ];
    }

    // Tag filters
    if (genre || mood) {
      where.trackTags = {
        some: {
          tag: {
            AND: [
              genre ? { name: genre, category: "GENRE" } : {},
              mood ? { name: mood, category: "MOOD" } : {}
            ].filter(condition => Object.keys(condition).length > 0)
          }
        }
      };
    }

    // Sorting
    switch (sort) {
      case "popular":
        orderBy = [{ playCount: "desc" }, { likeCount: "desc" }];
        break;
      case "alphabetical":
        orderBy = { title: "asc" };
        break;
      case "latest":
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    const [tracks, totalCount] = await Promise.all([
      prisma.track.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy,
        include: {
          artist: {
            select: {
              id: true,
              name: true,
              avatar: true,
              verified: true
            }
          },
          album: {
            select: {
              id: true,
              title: true,
              coverArt: true,
              albumType: true
            }
          },
          trackTags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  category: true
                }
              }
            }
          },
          mediaAssets: {
            select: {
              id: true,
              type: true,
              quality: true,
              format: true
            }
          },
          _count: {
            select: {
              likes: true
            }
          },
          // Include user's like status if authenticated
          ...(userId && {
            likes: {
              where: {
                userId: userId
              },
              select: {
                userId: true
              }
            }
          })
        }
      }),
      prisma.track.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      tracks: tracks.map((track: any) => ({
        id: track.id,
        title: track.title,
        duration: track.duration,
        trackNumber: track.trackNumber,
        explicit: track.explicit,
        price: track.price,
        playCount: track.playCount,
        likeCount: track._count.likes,
        isExclusive: track.isExclusive,
        createdAt: track.createdAt,
        artist: track.artist,
        album: track.album,
        tags: track.trackTags?.map((tt: any) => tt.tag) || [],
        mediaAssets: track.mediaAssets || [],
        // Include like status for authenticated users
        liked: userId ? (track.likes && track.likes.length > 0) : undefined
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error("Error fetching tracks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tracks" },
      { status: 500 }
    );
  }
}
