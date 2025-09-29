
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateOtp, verifyOtp, OTP_TYPES } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const { userId, step, otpCode } = await req.json();
    const clientIP = getClientIP(req);
    
    if (step === 'send_verification') {
      // Step 1: Send verification email
      
      // Rate limiting
      const rateLimitCheck = await checkRateLimit(clientIP, 'OTP_REQUEST');
      if (!rateLimitCheck.allowed) {
        return NextResponse.json(
          { 
            error: "Too many verification requests. Please try again later.",
            resetTime: rateLimitCheck.resetTime 
          },
          { status: 429 }
        );
      }
      
      if (!userId) {
        return NextResponse.json(
          { error: "User ID is required" },
          { status: 400 }
        );
      }
      
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
      
      if (user.emailVerified) {
        return NextResponse.json(
          { error: "Email is already verified" },
          { status: 400 }
        );
      }
      
      // Generate and send OTP
      const otp = await generateOtp(user.id, OTP_TYPES.VERIFICATION);
      await sendOtpEmail(user.email, otp, 'VERIFICATION');
      
      return NextResponse.json({
        message: "Verification code sent to your email address",
        maskedEmail: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
      });
      
    } else if (step === 'verify_code') {
      // Step 2: Verify the OTP code
      
      if (!userId || !otpCode) {
        return NextResponse.json(
          { error: "User ID and verification code are required" },
          { status: 400 }
        );
      }
      
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
      
      if (user.emailVerified) {
        return NextResponse.json(
          { error: "Email is already verified" },
          { status: 400 }
        );
      }
      
      // Verify OTP
      const isValidOtp = await verifyOtp(user.id, otpCode, OTP_TYPES.VERIFICATION);
      
      if (!isValidOtp) {
        return NextResponse.json(
          { error: "Invalid or expired verification code" },
          { status: 401 }
        );
      }
      
      // Mark email as verified
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          emailVerified: new Date(),
          isVerified: true
        }
      });
      
      return NextResponse.json({
        message: "Email verified successfully!",
        user: {
          id: user.id,
          email: user.email,
          emailVerified: true
        }
      });
      
    } else {
      return NextResponse.json(
        { error: "Invalid step parameter" },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

