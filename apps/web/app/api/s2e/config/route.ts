
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get current S2E configuration
    const config = await prisma.s2EConfiguration.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!config) {
      // Return default configuration if none exists
      return NextResponse.json({
        isEnabled: false,
        minStreamDuration: 30,
        minStreamPercentage: 0.3,
        rewardPerStream: 0.001,
        dailyRewardCap: 10.0,
        maxStreamsPerTrack: 5,
        platformTake: 0.1,
      });
    }

    return NextResponse.json({
      isEnabled: config.isEnabled,
      minStreamDuration: config.minStreamDuration,
      minStreamPercentage: parseFloat(config.minStreamPercentage.toString()),
      rewardPerStream: parseFloat(config.rewardPerStream.toString()),
      dailyRewardCap: parseFloat(config.dailyRewardCap.toString()),
      maxStreamsPerTrack: config.maxStreamsPerTrack,
      platformTake: parseFloat(config.platformTake.toString()),
      updatedAt: config.updatedAt,
    });

  } catch (error) {
    console.error('Get S2E config error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch S2E configuration' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify admin permissions (you might want to implement proper admin checking)
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, allow any authenticated user to toggle S2E (in production, restrict to admins)
    const body = await request.json();
    const {
      isEnabled,
      minStreamDuration,
      minStreamPercentage,
      rewardPerStream,
      dailyRewardCap,
      maxStreamsPerTrack,
      platformTake,
    } = body;

    // Validate input
    if (typeof isEnabled !== 'boolean') {
      return NextResponse.json({ error: 'isEnabled must be a boolean' }, { status: 400 });
    }

    // Create or update configuration
    const config = await prisma.s2EConfiguration.upsert({
      where: { id: 'default' }, // We'll use a fixed ID for singleton config
      create: {
        id: 'default',
        isEnabled,
        minStreamDuration: minStreamDuration || 30,
        minStreamPercentage: minStreamPercentage || 0.3,
        rewardPerStream: rewardPerStream || 0.001,
        dailyRewardCap: dailyRewardCap || 10.0,
        maxStreamsPerTrack: maxStreamsPerTrack || 5,
        platformTake: platformTake || 0.1,
        updatedBy: (session.user as any).id,
      },
      update: {
        isEnabled,
        ...(minStreamDuration !== undefined && { minStreamDuration }),
        ...(minStreamPercentage !== undefined && { minStreamPercentage }),
        ...(rewardPerStream !== undefined && { rewardPerStream }),
        ...(dailyRewardCap !== undefined && { dailyRewardCap }),
        ...(maxStreamsPerTrack !== undefined && { maxStreamsPerTrack }),
        ...(platformTake !== undefined && { platformTake }),
        updatedBy: (session.user as any).id,
      },
    });

    return NextResponse.json({
      message: 'S2E configuration updated successfully',
      isEnabled: config.isEnabled,
    });

  } catch (error) {
    console.error('Update S2E config error:', error);
    return NextResponse.json(
      { error: 'Failed to update S2E configuration' },
      { status: 500 }
    );
  }
}

