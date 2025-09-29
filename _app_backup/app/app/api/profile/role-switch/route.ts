
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { UserType } from '@prisma/client';

const roleSwitchSchema = z.object({
  newRole: z.enum(['LISTENER', 'CREATOR']),
});

// Generate SCI ID for new creators
function generateSciId(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `SCI${timestamp}${random}`;
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { newRole } = roleSwitchSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, userType: true, sciId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If switching to creator and doesn't have SCI ID, generate one
    let sciIdUpdate = {};
    if (newRole === 'CREATOR' && !user.sciId) {
      let sciId = generateSciId();
      
      // Ensure uniqueness
      let attempts = 0;
      while (attempts < 10) {
        const existing = await prisma.user.findUnique({
          where: { sciId },
        });
        
        if (!existing) break;
        
        sciId = generateSciId();
        attempts++;
      }
      
      if (attempts >= 10) {
        return NextResponse.json(
          { error: 'Unable to generate unique Creator ID. Please try again.' },
          { status: 500 }
        );
      }
      
      sciIdUpdate = { sciId };
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        userType: newRole,
        ...sciIdUpdate,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        userType: true,
        sciId: true,
        firstName: true,
        lastName: true,
        username: true,
      },
    });

    return NextResponse.json({
      message: `Successfully switched to ${newRole.toLowerCase()}`,
      user: updatedUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      );
    }
    
    console.error('Role switch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
