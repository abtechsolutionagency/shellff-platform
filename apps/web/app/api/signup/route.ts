
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { RoleType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, username, firstName, lastName, accountType } = body;

    // Validate required fields
    if (!email || !password || !username) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { displayName: username }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or username already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Validate and set role
    const validRole = accountType === "CREATOR" ? RoleType.CREATOR : RoleType.LISTENER;

    // Create display name from firstName and lastName or use username
    const displayName = firstName && lastName ? `${firstName} ${lastName}` : username;

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName,
        primaryRole: validRole,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        primaryRole: true,
        status: true,
        createdAt: true,
      }
    });

    return NextResponse.json(
      { 
        message: "Account created successfully!",
        user: user,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
