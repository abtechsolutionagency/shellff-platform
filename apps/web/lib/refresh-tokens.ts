
/**
 * JWT Refresh Token utilities with rotation
 */

import { prisma } from './db';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export async function generateTokenPair(userId: string): Promise<TokenPair> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not configured');
  }
  
  // Generate access token (15 minutes)
  const accessToken = jwt.sign(
    { userId },
    secret,
    { expiresIn: '15m' }
  );
  
  // Generate refresh token (7 days)
  const refreshToken = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      userId,
      token: refreshToken,
      expiresAt
    }
  });
  
  return { accessToken, refreshToken };
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenPair | null> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not configured');
  }
  
  // Find refresh token in database
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken }
  });
  
  if (!storedToken || storedToken.expiresAt < new Date()) {
    // Token not found or expired
    if (storedToken) {
      await prisma.refreshToken.delete({
        where: { id: storedToken.id }
      });
    }
    return null;
  }
  
  // Delete old refresh token (rotation)
  await prisma.refreshToken.delete({
    where: { id: storedToken.id }
  });
  
  // Generate new token pair
  return await generateTokenPair(storedToken.userId);
}

export async function verifyAccessToken(accessToken: string): Promise<{ userId: string } | null> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not configured');
  }
  
  try {
    const decoded = jwt.verify(accessToken, secret) as { userId: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function revokeAllTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { userId }
  });
}

export async function cleanupExpiredTokens(): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: { lt: new Date() }
    }
  });
}
