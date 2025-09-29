
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  username: z.string().min(3).max(30).optional(),
  bio: z.string().max(500).optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        userId: true,
        sciId: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        userType: true,
        avatar: true,
        profilePicture: true,
        bio: true,
        isVerified: true,
        createdAt: true,
        userSettings: {
          select: {
            theme: true,
            language: true,
            emailNotifications: true,
            pushNotifications: true,
            playlistPrivacy: true,
            showOnlineStatus: true,
            autoPlayNext: true,
            highQualityAudio: true,
            downloadQuality: true,
          }
        }
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Check if username is being changed and if it's already taken
    if (validatedData.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: validatedData.username,
          email: { not: session.user.email },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        userId: true,
        sciId: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        userType: true,
        avatar: true,
        profilePicture: true,
        bio: true,
        isVerified: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
