
/**
 * OTP (One-Time Password) utilities for email verification and login
 */

import { prisma } from './db';
import crypto from 'crypto';

export interface OtpType {
  LOGIN: 'LOGIN';
  VERIFICATION: 'VERIFICATION';
  PASSWORD_RESET: 'PASSWORD_RESET';
}

export const OTP_TYPES: OtpType = {
  LOGIN: 'LOGIN',
  VERIFICATION: 'VERIFICATION',
  PASSWORD_RESET: 'PASSWORD_RESET'
};

export async function generateOtp(userId: string, type: keyof OtpType): Promise<string> {
  // Generate 6-digit OTP
  const code = crypto.randomInt(100000, 999999).toString();
  
  // Expire existing OTPs of the same type for this user
  await prisma.otpCode.updateMany({
    where: {
      userId,
      type,
      used: false,
      expiresAt: { gt: new Date() }
    },
    data: { used: true }
  });
  
  // Create new OTP with 15-minute expiration
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  
  await prisma.otpCode.create({
    data: {
      userId,
      code,
      type,
      expiresAt
    }
  });
  
  return code;
}

export async function verifyOtp(userId: string, code: string, type: keyof OtpType): Promise<boolean> {
  const otpCode = await prisma.otpCode.findFirst({
    where: {
      userId,
      code,
      type,
      used: false,
      expiresAt: { gt: new Date() }
    }
  });
  
  if (!otpCode) {
    return false;
  }
  
  // Mark OTP as used
  await prisma.otpCode.update({
    where: { id: otpCode.id },
    data: { used: true }
  });
  
  return true;
}

export async function cleanupExpiredOtps(): Promise<void> {
  await prisma.otpCode.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { used: true }
      ]
    }
  });
}
