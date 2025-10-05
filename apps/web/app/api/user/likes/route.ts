import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Fallback: return empty likes for now (commented out complex logic due to missing models)
    return NextResponse.json({
      success: true,
      likedTracks: [],
      totalCount: 0,
      page,
      limit,
      totalPages: 0
    });

  } catch (error) {
    console.error('User likes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user likes' }, 
      { status: 500 }
    );
  }
}