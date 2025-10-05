
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AlbumType, Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const genre = searchParams.get("genre");
    const albumType = searchParams.get("type"); // album, ep, single, compilation
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "latest"; // latest, popular, alphabetical

    const offset = (page - 1) * limit;

    const where: Prisma.AlbumWhereInput = {};
    let orderBy: Prisma.AlbumOrderByWithRelationInput | Prisma.AlbumOrderByWithRelationInput[] = { releaseDate: "desc" };

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { artist: { name: { contains: search, mode: "insensitive" } } }
      ];
    }

    // Album type filter
    if (albumType) {
      const normalizedType = albumType.toUpperCase();
      if (Object.values(AlbumType).includes(normalizedType as AlbumType)) {
        where.albumType = normalizedType as AlbumType;
      }
    }

    // Genre filter
    if (genre) {
      where.albumTags = {
        some: {
          tag: {
            name: genre,
            category: "GENRE"
          }
        }
      };
    }

    // Sorting
    switch (sort) {
      case "popular":
        orderBy = [
          { tracks: { _count: "desc" } }, // Albums with more tracks
          { createdAt: "desc" }
        ];
        break;
      case "alphabetical":
        orderBy = { title: "asc" };
        break;
      case "latest":
      default:
        orderBy = { releaseDate: "desc" };
        break;
    }

    const [albums, totalCount] = await Promise.all([
      prisma.release.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy,
        include: {
          creator: {
            select: {
              id: true,
              displayName: true,
              email: true
            }
          },
          tracks: {
            take: 5, // Preview tracks
            select: {
              id: true,
              title: true,
              duration: true,
              position: true, // Using position instead of trackNumber
              audioUrl: true
            },
            orderBy: {
              position: "asc" // Using position instead of trackNumber
            }
          },
          _count: {
            select: {
              tracks: true
            }
          }
        }
      }),
      prisma.release.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      albums: albums.map((album: any) => ({
        id: album.id,
        title: album.title,
        description: album.description,
        coverArt: album.coverArt,
        releaseDate: album.createdAt, // Using createdAt as releaseDate
        albumType: album.releaseType, // Using releaseType as albumType
        duration: 0, // Duration not available in Release model
        trackCount: album._count.tracks,
        price: 0, // Price not available in Release model
        isExclusive: false, // Not available in Release model
        purchaseCount: 0, // Purchase count not available
        createdAt: album.createdAt,
        artist: album.creator, // Using creator as artist
        tags: [], // Tags not available in Release model
        previewTracks: album.tracks
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
    console.error("Error fetching albums:", error);
    return NextResponse.json(
      { error: "Failed to fetch albums" },
      { status: 500 }
    );
  }
}




