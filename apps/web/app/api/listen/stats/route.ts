
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return mock stats for now (commented out complex logic due to missing models)
    return NextResponse.json({
      success: true,
      data: {
        totalPlayEvents: 0,
        totalListeningTime: 0,
        uniqueTracks: 0,
        topArtists: [],
        topTracks: [],
        listeningByDay: []
      }
    });

  } catch (error) {
    console.error('Error fetching listening stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listening stats' }, 
      { status: 500 }
    );
  }
}


