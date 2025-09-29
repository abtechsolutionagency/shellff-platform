
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category"); // GENRE, MOOD, ACTIVITY, DECADE, LANGUAGE

    let where: any = {};
    if (category) {
      where.category = category.toUpperCase();
    }

    const tags = await prisma.tag.findMany({
      where,
      select: {
        id: true,
        name: true,
        category: true,
        _count: {
          select: {
            trackTags: true,
            albumTags: true,
            artistTags: true
          }
        }
      },
      orderBy: [
        { name: "asc" }
      ]
    });

    // Group by category
    const tagsByCategory = tags.reduce((acc, tag) => {
      if (!acc[tag.category]) {
        acc[tag.category] = [];
      }
      acc[tag.category].push({
        id: tag.id,
        name: tag.name,
        category: tag.category,
        usageCount: tag._count.trackTags + tag._count.albumTags + tag._count.artistTags
      });
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      tags: category ? tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        category: tag.category,
        usageCount: tag._count.trackTags + tag._count.albumTags + tag._count.artistTags
      })) : tagsByCategory
    });

  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}
