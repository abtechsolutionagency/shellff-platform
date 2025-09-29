
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().max(5).optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  playlistPrivacy: z.enum(['public', 'private', 'unlisted']).optional(),
  showOnlineStatus: z.boolean().optional(),
  autoPlayNext: z.boolean().optional(),
  highQualityAudio: z.boolean().optional(),
  downloadQuality: z.enum(['low', 'standard', 'high', 'lossless']).optional(),
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
        userSettings: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If no settings exist, create default ones
    if (!user.userSettings) {
      const defaultSettings = await prisma.userSettings.create({
        data: {
          userId: user.id,
        },
      });
      return NextResponse.json({ settings: defaultSettings });
    }

    return NextResponse.json({ settings: user.userSettings });
  } catch (error) {
    console.error('Settings fetch error:', error);
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
    const validatedData = updateSettingsSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Upsert user settings
    const updatedSettings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {
        ...validatedData,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        ...validatedData,
      },
    });

    return NextResponse.json({ 
      message: 'Settings updated successfully',
      settings: updatedSettings 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
