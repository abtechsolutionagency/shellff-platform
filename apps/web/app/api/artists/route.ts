
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const search = searchParams.get("search");
    const verified = searchParams.get("verified");
    const sort = searchParams.get("sort") || "popular"; // popular, alphabetical, latest

    const offset = (page - 1) * limit;

    const where: Prisma.ArtistWhereInput = {};
    let orderBy: Prisma.ArtistOrderByWithRelationInput | Prisma.ArtistOrderByWithRelationInput[] = [{ monthlyListeners: "desc" }, { followerCount: "desc" }];

    // Search filter
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    // Verified filter
    if (verified === "true") {
      where.verified = true;
    }

    // Sorting
    switch (sort) {
      case "alphabetical":
        orderBy = { name: "asc" };
        break;
      case "latest":
        orderBy = { createdAt: "desc" };
        break;
      case "popular":
      default:
        orderBy = [{ monthlyListeners: "desc" }, { followerCount: "desc" }];
        break;
    }

    const [artists, totalCount] = await Promise.all([
      prisma.artist.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy,
        include: {
          artistTags: {
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
          _count: {
            select: {
              albums: true,
              tracks: true
            }
          }
        }
      }),
      prisma.artist.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      artists: artists.map((artist: any) => ({
        id: artist.id,
        name: artist.name,
        bio: artist.bio,
        avatar: artist.avatar,
        verified: artist.verified,
        followerCount: artist.followerCount,
        monthlyListeners: artist.monthlyListeners,
        albumCount: artist._count.albums,
        trackCount: artist._count.tracks,
        createdAt: artist.createdAt,
        tags: artist.artistTags.map((at: any) => at.tag)
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
    console.error("Error fetching artists:", error);
    return NextResponse.json(
      { error: "Failed to fetch artists" },
      { status: 500 }
    );
  }
}


