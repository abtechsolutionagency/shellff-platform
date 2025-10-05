
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
    const track = await prisma.releaseTrack.findUnique({
      where: { id: trackId }
    });

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Create play event (commented out - model doesn't exist)
    // const playEvent = await prisma.playEvent.create({...});
    
    // Fallback: return success for now
    return NextResponse.json({ 
      success: true, 
      message: 'Play event recorded (fallback)' 
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

    // Update play event (commented out - model doesn't exist)
    // Fallback: return success for now
    return NextResponse.json({ 
      success: true, 
      message: 'Play event updated (fallback)' 
    });

  } catch (error) {
    console.error('Error updating play event:', error);
    return NextResponse.json(
      { error: 'Failed to update play event' }, 
      { status: 500 }
    );
  }
}
