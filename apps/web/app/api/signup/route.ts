
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { UserType } from "@prisma/client";
import { generateSciId, generateUserId } from "@/lib/sci-id";
import { generateOtp, OTP_TYPES } from "@/lib/otp";
import { sendOtpEmail, sendWelcomeEmail } from "@/lib/email";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, username, firstName, lastName, userType } = body;
    const clientIP = getClientIP(req);

    // Rate limiting for signups
    const rateLimitCheck = await checkRateLimit(clientIP, 'LOGIN');
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { 
          error: "Too many signup attempts. Please try again later.",
          resetTime: rateLimitCheck.resetTime 
        },
        { status: 429 }
      );
    }

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
          { username: username }
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

    // Generate User ID for all users
    const userId = await generateUserId();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Failed to generate user ID. Please try again." },
        { status: 500 }
      );
    }

    // Validate and set userType
    const validUserType = userType === "CREATOR" ? UserType.CREATOR : UserType.LISTENER;

    // Generate SCI ID only for creators
    let sciId = null;
    if (validUserType === UserType.CREATOR) {
      sciId = await generateSciId();
      if (!sciId) {
        return NextResponse.json(
          { error: "Failed to generate Creator ID. Please try again." },
          { status: 500 }
        );
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        username,
        firstName: firstName || null,
        lastName: lastName || null,
        userType: validUserType,
        userId,
        sciId,
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
        createdAt: true,
      }
    });

    // Generate and send email verification OTP
    const verificationOtp = await generateOtp(user.id, OTP_TYPES.VERIFICATION);
    await sendOtpEmail(user.email, verificationOtp, 'VERIFICATION');

    // Send welcome email
    await sendWelcomeEmail(user.email, user.firstName || user.username, user.userId, user.sciId || undefined);

    return NextResponse.json(
      { 
        message: "Account created successfully! Please check your email for verification code.",
        user: user,
        requiresEmailVerification: true
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
