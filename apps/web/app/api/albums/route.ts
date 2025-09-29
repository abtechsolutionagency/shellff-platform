
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
      prisma.album.findMany({
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
          albumTags: {
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
          tracks: {
            take: 5, // Preview tracks
            select: {
              id: true,
              title: true,
              duration: true,
              trackNumber: true,
              explicit: true
            },
            orderBy: {
              trackNumber: "asc"
            }
          },
          _count: {
            select: {
              tracks: true,
              purchases: true
            }
          }
        }
      }),
      prisma.album.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      albums: albums.map((album: any) => ({
        id: album.id,
        title: album.title,
        description: album.description,
        coverArt: album.coverArt,
        releaseDate: album.releaseDate,
        albumType: album.albumType,
        duration: album.duration,
        trackCount: album._count.tracks,
        price: album.price,
        isExclusive: album.isExclusive,
        purchaseCount: album._count.purchases,
        createdAt: album.createdAt,
        artist: album.artist,
        tags: album.albumTags.map((at: any) => at.tag),
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




