
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

    const where: Prisma.UserWhereInput = {};
    let orderBy: Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[] = { createdAt: "desc" };

    // Search filter
    if (search) {
      where.displayName = { contains: search, mode: "insensitive" };
    }

    // Filter for creators only
    where.primaryRole = 'CREATOR';

    // Verified filter (not available in User model)
    // if (verified === "true") {
    //   where.verified = true;
    // }

    // Sorting
    switch (sort) {
      case "alphabetical":
        orderBy = { displayName: "asc" };
        break;
      case "latest":
        orderBy = { createdAt: "desc" };
        break;
      case "popular":
      default:
        orderBy = { createdAt: "desc" }; // Using createdAt as popularity proxy
        break;
    }

    const [artists, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: {
              releases: true // Using releases instead of createdReleases
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      artists: artists.map((artist: any) => ({
        id: artist.id,
        name: artist.displayName, // Using displayName as name
        bio: '', // Bio not available in User model
        avatar: '', // Avatar not available in User model
        verified: false, // Verified not available in User model
        followerCount: 0, // Follower count not available
        monthlyListeners: 0, // Monthly listeners not available
        albumCount: artist._count.releases, // Using releases as albumCount
        trackCount: 0, // Track count not available
        createdAt: artist.createdAt,
        tags: [] // Tags not available in User model
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


