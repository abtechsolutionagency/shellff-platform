
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateOtp, OTP_TYPES } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const { email, step, otpCode } = await req.json();
    const clientIP = getClientIP(req);
    
    if (step === 'request_otp') {
      // Step 1: Request OTP
      
      // Rate limiting
      const rateLimitCheck = await checkRateLimit(clientIP, 'OTP_REQUEST');
      if (!rateLimitCheck.allowed) {
        return NextResponse.json(
          { 
            error: "Too many OTP requests. Please try again later.",
            resetTime: rateLimitCheck.resetTime 
          },
          { status: 429 }
        );
      }
      
      if (!email) {
        return NextResponse.json(
          { error: "Email is required" },
          { status: 400 }
        );
      }
      
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email }
      });
      
      if (!user) {
        return NextResponse.json(
          { error: "No account found with this email address" },
          { status: 404 }
        );
      }
      
      // Generate and send OTP
      const otp = await generateOtp(user.id, OTP_TYPES.LOGIN);
      await sendOtpEmail(email, otp, 'LOGIN');
      
      return NextResponse.json({
        message: "OTP sent to your email address",
        maskedEmail: email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
      });
      
    } else if (step === 'verify_otp') {
      // Step 2: Verify OTP and login
      
      // Rate limiting for login attempts
      const rateLimitCheck = await checkRateLimit(email, 'LOGIN');
      if (!rateLimitCheck.allowed) {
        return NextResponse.json(
          { 
            error: "Too many login attempts. Please try again later.",
            resetTime: rateLimitCheck.resetTime 
          },
          { status: 429 }
        );
      }
      
      if (!email || !otpCode) {
        return NextResponse.json(
          { error: "Email and OTP code are required" },
          { status: 400 }
        );
      }
      
      const user = await prisma.user.findUnique({
        where: { email }
      });
      
      if (!user) {
        return NextResponse.json(
          { error: "Invalid email or OTP code" },
          { status: 401 }
        );
      }
      
      // Verify OTP
      const { verifyOtp } = await import("@/lib/otp");
      const isValidOtp = await verifyOtp(user.id, otpCode, OTP_TYPES.LOGIN);
      
      if (!isValidOtp) {
        return NextResponse.json(
          { error: "Invalid or expired OTP code" },
          { status: 401 }
        );
      }
      
      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          lastLoginAt: new Date(),
          failedLoginAttempts: 0,
          lockedUntil: null
        }
      });
      
      return NextResponse.json({
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          sciId: user.sciId,
          userType: user.userType
        }
      });
      
    } else {
      return NextResponse.json(
        { error: "Invalid step parameter" },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error("OTP Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
