
/**
 * Shellff Creator ID (SCI) and User ID Generator
 */

import { prisma } from './db';

/**
 * Generate a User ID for all users
 * Format: USRxxxxxxxx (8-digit zero-padded integer)
 */
export async function generateUserId(): Promise<string> {
  const maxAttempts = 10;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Get next sequential number
    const userCount = await prisma.user.count();
    const nextNumber = userCount + 1;
    const userId = `USR${nextNumber.toString().padStart(8, '0')}`;
    
    // Check if this User ID already exists (very unlikely but safety check)
    const existingUser = await prisma.user.findUnique({
      where: { userId }
    });
    
    if (!existingUser) {
      return userId;
    }
  }
  
  // Fallback to random if sequential fails
  const randomNum = Math.floor(Math.random() * 99999999) + 1;
  return `USR${randomNum.toString().padStart(8, '0')}`;
}

/**
 * Generate a Shellff Creator ID (SCI) - only for creators
 * Format: SCIxxxxxxxx (8-digit zero-padded integer)
 */
export async function generateSciId(): Promise<string> {
  const maxAttempts = 10;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Get next sequential SCI number
    const creatorCount = await prisma.user.count({
      where: { sciId: { not: null } }
    });
    const nextNumber = creatorCount + 1;
    const sciId = `SCI${nextNumber.toString().padStart(8, '0')}`;
    
    // Check if this SCI ID already exists (very unlikely but safety check)
    const existingUser = await prisma.user.findUnique({
      where: { sciId }
    });
    
    if (!existingUser) {
      return sciId;
    }
  }
  
  // Fallback to random if sequential fails
  const randomNum = Math.floor(Math.random() * 99999999) + 1;
  return `SCI${randomNum.toString().padStart(8, '0')}`;
}

export function validateUserId(userId: string): boolean {
  const userIdPattern = /^USR\d{8}$/;
  return userIdPattern.test(userId);
}

export function validateSciId(sciId: string): boolean {
  const sciIdPattern = /^SCI\d{8}$/;
  return sciIdPattern.test(sciId);
}

