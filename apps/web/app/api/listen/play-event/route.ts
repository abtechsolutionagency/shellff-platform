
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      trackId,
      duration = 0,
      completed = false,
      deviceType,
      platform = 'web',
      source,
      sessionId,
      skipPosition,
      bufferCount = 0
    } = body;

    if (!trackId) {
      return NextResponse.json({ error: 'Track ID is required' }, { status: 400 });
    }

    // Verify track exists
    const track = await prisma.track.findUnique({
      where: { id: trackId }
    });

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Create play event
    const playEvent = await prisma.playEvent.create({
      data: {
        userId: session.user.id,
        trackId,
        duration,
        completed,
        deviceType,
        platform,
        source,
        sessionId,
        skipPosition,
        bufferCount,
        endTime: completed ? new Date() : null
      }
    });

    // Update or create listening history entry
    await prisma.listeningHistory.upsert({
      where: {
        userId_trackId: {
          userId: session.user.id,
          trackId
        }
      },
      update: {
        lastPlayed: new Date(),
        playCount: { increment: 1 },
        totalTime: { increment: duration }
      },
      create: {
        userId: session.user.id,
        trackId,
        playCount: 1,
        totalTime: duration
      }
    });

    // Update track play count
    await prisma.track.update({
      where: { id: trackId },
      data: { playCount: { increment: 1 } }
    });

    return NextResponse.json({ 
      success: true, 
      playEventId: playEvent.id 
    });

  } catch (error) {
    console.error('Error logging play event:', error);
    return NextResponse.json(
      { error: 'Failed to log play event' }, 
      { status: 500 }
    );
  }
}

// Update an existing play event (e.g., when track is paused or ends)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      playEventId,
      duration,
      completed,
      skipPosition,
      bufferCount
    } = body;

    if (!playEventId) {
      return NextResponse.json({ error: 'Play event ID is required' }, { status: 400 });
    }

    // Update play event
    const playEvent = await prisma.playEvent.update({
      where: { 
        id: playEventId,
        userId: session.user.id // Ensure user can only update their own events
      },
      data: {
        duration,
        completed,
        skipPosition,
        bufferCount,
        endTime: completed ? new Date() : undefined
      }
    });

    // If completed, update listening history total time
    if (completed && duration) {
      await prisma.listeningHistory.update({
        where: {
          userId_trackId: {
            userId: session.user.id,
            trackId: playEvent.trackId
          }
        },
        data: {
          totalTime: { increment: duration }
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      playEvent 
    });

  } catch (error) {
    console.error('Error updating play event:', error);
    return NextResponse.json(
      { error: 'Failed to update play event' }, 
      { status: 500 }
    );
  }
}
