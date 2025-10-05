
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateOtp, verifyOtp, OTP_TYPES } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, step, otpCode, newPassword } = await req.json();
    const clientIP = getClientIP(req);
    
    if (step === 'request_reset') {
      // Step 1: Request password reset OTP
      
      // Rate limiting
      const rateLimitCheck = await checkRateLimit(clientIP, 'PASSWORD_RESET');
      if (!rateLimitCheck.allowed) {
        return NextResponse.json(
          { 
            error: "Too many password reset requests. Please try again later.",
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
        // Don't reveal if email exists or not for security
        return NextResponse.json({
          message: "If an account with that email exists, you will receive a password reset code."
        });
      }
      
      // Generate and send OTP
      const otp = await generateOtp(user.id, OTP_TYPES.PASSWORD_RESET);
      await sendOtpEmail(email, otp, 'PASSWORD_RESET');
      
      return NextResponse.json({
        message: "If an account with that email exists, you will receive a password reset code.",
        maskedEmail: email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
      });
      
    } else if (step === 'verify_and_reset') {
      // Step 2: Verify OTP and reset password
      
      if (!email || !otpCode || !newPassword) {
        return NextResponse.json(
          { error: "Email, OTP code, and new password are required" },
          { status: 400 }
        );
      }
      
      // Validate password strength
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters long" },
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
      const isValidOtp = await verifyOtp(user.id, otpCode, OTP_TYPES.PASSWORD_RESET);
      
      if (!isValidOtp) {
        return NextResponse.json(
          { error: "Invalid or expired OTP code" },
          { status: 401 }
        );
      }
      
      // Hash new password and update user
      const passwordHash = await bcrypt.hash(newPassword, 12);
      
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          passwordHash
        }
      });
      
      // Revoke all existing refresh tokens for security
      await prisma.refreshToken.deleteMany({
        where: { userId: user.id }
      });
      
      return NextResponse.json({
        message: "Password reset successful. You can now login with your new password."
      });
      
    } else {
      return NextResponse.json(
        { error: "Invalid step parameter" },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
