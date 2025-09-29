
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserType } from '@prisma/client';

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  userType: UserType;
  firstName?: string | null;
  lastName?: string | null;
}

/**
 * Check if a user is an admin based on session
 */
export async function isAdmin(session: any): Promise<boolean> {
  if (!session?.user?.id) {
    return false;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userType: true }
    });

    return user?.userType === UserType.ADMIN;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get current admin user from session
 */
export async function getCurrentAdminUser(): Promise<AdminUser | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        userType: true,
        firstName: true,
        lastName: true
      }
    });

    if (!user || user.userType !== UserType.ADMIN) {
      return null;
    }

    return user as AdminUser;
  } catch (error) {
    console.error('Error getting current admin user:', error);
    return null;
  }
}

/**
 * Middleware function to check admin access for API routes
 */
export async function requireAdminAuth(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const adminUser = await getCurrentAdminUser();
    
    if (!adminUser) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }), 
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return null; // No error, proceed
  } catch (error) {
    console.error('Admin auth error:', error);
    return new Response(
      JSON.stringify({ error: 'Authentication error' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Get admin user or throw error for API routes
 */
export async function getAdminUserOrThrow(): Promise<AdminUser> {
  const adminUser = await getCurrentAdminUser();
  
  if (!adminUser) {
    throw new Error('Admin access required');
  }
  
  return adminUser;
}

/**
 * Client-side admin check hook
 */
export function useAdminCheck() {
  return {
    checkAdminAccess: async (userType: string) => {
      return userType === 'ADMIN';
    }
  };
}
