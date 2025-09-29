
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type"); // tracks, albums, artists, all
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 20);

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
    }

    const searchCondition = {
      contains: query,
      mode: "insensitive" as const
    };

    const results: any = {};

    if (!type || type === "all" || type === "tracks") {
      const tracks = await prisma.track.findMany({
        where: {
          OR: [
            { title: searchCondition },
            { artist: { name: searchCondition } },
            { album: { title: searchCondition } }
          ]
        },
        take: limit,
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
              coverArt: true
            }
          },
          _count: {
            select: {
              likes: true
            }
          }
        },
        orderBy: [
          { playCount: "desc" },
          { likeCount: "desc" }
        ]
      });

      results.tracks = tracks.map(track => ({
        id: track.id,
        title: track.title,
        duration: track.duration,
        explicit: track.explicit,
        price: track.price,
        playCount: track.playCount,
        likeCount: track._count.likes,
        artist: track.artist,
        album: track.album
      }));
    }

    if (!type || type === "all" || type === "albums") {
      const albums = await prisma.album.findMany({
        where: {
          OR: [
            { title: searchCondition },
            { artist: { name: searchCondition } }
          ]
        },
        take: limit,
        include: {
          artist: {
            select: {
              id: true,
              name: true,
              avatar: true,
              verified: true
            }
          },
          _count: {
            select: {
              tracks: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      });

      results.albums = albums.map(album => ({
        id: album.id,
        title: album.title,
        coverArt: album.coverArt,
        releaseDate: album.releaseDate,
        albumType: album.albumType,
        trackCount: album._count.tracks,
        price: album.price,
        artist: album.artist
      }));
    }

    if (!type || type === "all" || type === "artists") {
      const artists = await prisma.artist.findMany({
        where: {
          name: searchCondition
        },
        take: limit,
        include: {
          _count: {
            select: {
              albums: true,
              tracks: true
            }
          }
        },
        orderBy: [
          { monthlyListeners: "desc" },
          { followerCount: "desc" }
        ]
      });

      results.artists = artists.map(artist => ({
        id: artist.id,
        name: artist.name,
        avatar: artist.avatar,
        verified: artist.verified,
        followerCount: artist.followerCount,
        monthlyListeners: artist.monthlyListeners,
        albumCount: artist._count.albums,
        trackCount: artist._count.tracks
      }));
    }

    // Get total count for each category
    const totalCounts = {
      tracks: results.tracks?.length || 0,
      albums: results.albums?.length || 0,
      artists: results.artists?.length || 0
    };

    return NextResponse.json({
      query,
      results,
      totalCounts,
      hasMoreResults: Object.values(totalCounts).some(count => count === limit)
    });

  } catch (error) {
    console.error("Error searching:", error);
    return NextResponse.json(
      { error: "Failed to search" },
      { status: 500 }
    );
  }
}
