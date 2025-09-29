
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserType } from "@prisma/client";
import { generateSciId } from "@/lib/sci-id";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { firstName, lastName, bio } = body;

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is already a creator
    if (currentUser.userType === UserType.CREATOR) {
      return NextResponse.json(
        { error: "User is already a creator" },
        { status: 400 }
      );
    }

    // Check if user already has an SCI ID (shouldn't happen, but safety check)
    if (currentUser.sciId) {
      return NextResponse.json(
        { error: "User already has a Creator ID" },
        { status: 400 }
      );
    }

    // Generate SCI ID for the new creator
    const sciId = await generateSciId();
    if (!sciId) {
      return NextResponse.json(
        { error: "Failed to generate Creator ID. Please try again." },
        { status: 500 }
      );
    }

    // Update user to creator with SCI ID
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        userType: UserType.CREATOR,
        sciId,
        firstName: firstName || currentUser.firstName,
        lastName: lastName || currentUser.lastName,
        bio: bio || currentUser.bio,
      },
      select: {
        id: true,
        userId: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        userType: true,
        sciId: true,
        bio: true,
        updatedAt: true,
      }
    });

    return NextResponse.json(
      { 
        message: "Successfully upgraded to Creator account!",
        user: updatedUser
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Upgrade to creator error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
