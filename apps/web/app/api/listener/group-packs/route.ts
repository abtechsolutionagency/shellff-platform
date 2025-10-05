import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fallback: return empty packs for now (commented out complex logic due to missing models)
    return NextResponse.json({
      success: true,
      packs: []
    });

  } catch (error) {
    console.error('Group packs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group packs' }, 
      { status: 500 }
    );
  }
}