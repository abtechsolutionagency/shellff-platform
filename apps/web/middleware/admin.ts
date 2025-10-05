
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/db';
import { UserType } from '@prisma/client';

export async function adminMiddleware(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token?.id) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: token.id as string },
      select: { primaryRole: true }
    });

    if (!user || user.primaryRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' }, 
        { status: 403 }
      );
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return NextResponse.json(
      { error: 'Authentication error' }, 
      { status: 500 }
    );
  }
}
