
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userType = (session.user as any)?.userType;
    if (userType !== 'CREATOR') {
      return NextResponse.json({ error: "Only creators can access this endpoint" }, { status: 403 });
    }

    const userId = (session.user as any)?.id;

    // Get release counts
    const totalReleases = await prisma.release.count({
      where: { creatorId: userId }
    });

    const publishedReleases = await prisma.release.count({
      where: { 
        creatorId: userId
      }
    });

    // For now, return mock streaming and revenue data
    // In a real app, this would come from streaming analytics and payment systems
    const stats = {
      totalReleases,
      publishedReleases,
      totalStreams: 12450, // Mock data
      totalRevenue: 89.50, // Mock data
      monthlyStreams: 3240, // Mock data
      monthlyRevenue: 24.75 // Mock data
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Creator stats error:', error);
    return NextResponse.json(
      { error: "Failed to fetch creator stats" },
      { status: 500 }
    );
  }
}
