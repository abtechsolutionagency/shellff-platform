import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; trackId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fallback: return error for now (commented out complex logic due to missing models)
    return NextResponse.json({ error: 'Playlists not available' }, { status: 501 });

  } catch (error) {
    console.error('Playlist track add error:', error);
    return NextResponse.json(
      { error: 'Failed to add track to playlist' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; trackId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fallback: return error for now (commented out complex logic due to missing models)
    return NextResponse.json({ error: 'Playlists not available' }, { status: 501 });

  } catch (error) {
    console.error('Playlist track remove error:', error);
    return NextResponse.json(
      { error: 'Failed to remove track from playlist' }, 
      { status: 500 }
    );
  }
}