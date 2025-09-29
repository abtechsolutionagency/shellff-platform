
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { NetworkHandlers } from '@/lib/crypto/networkHandlers';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get available networks from database and configuration
    const networks = await NetworkHandlers.getAvailableNetworks();

    return NextResponse.json({
      success: true,
      data: networks
    });

  } catch (error) {
    console.error('Error fetching networks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch networks' }, 
      { status: 500 }
    );
  }
}
