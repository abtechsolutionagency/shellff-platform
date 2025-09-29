
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// In a real application, these would be stored in database or config
// For now, we'll use a simple in-memory configuration
let adminSettings = {
  physicalEnabled: true,
  hybridEnabled: true,
  lastUpdated: new Date().toISOString(),
  updatedBy: 'system'
};

export async function GET() {
  try {
    return NextResponse.json(adminSettings);
  } catch (error) {
    console.error('Error fetching release mode settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch release mode settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // In a real application, check if user is admin
    // For now, any authenticated user can modify (you should add proper admin checks)
    
    const body = await request.json();
    const { physicalEnabled, hybridEnabled } = body;

    // Validate the request
    if (typeof physicalEnabled !== 'boolean' || typeof hybridEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid settings format' },
        { status: 400 }
      );
    }

    // Update settings
    adminSettings = {
      physicalEnabled,
      hybridEnabled,
      lastUpdated: new Date().toISOString(),
      updatedBy: session.user.email || (session.user as any).id || 'unknown'
    };

    return NextResponse.json({
      message: 'Release mode settings updated successfully',
      settings: adminSettings
    });
  } catch (error) {
    console.error('Error updating release mode settings:', error);
    return NextResponse.json(
      { error: 'Failed to update release mode settings' },
      { status: 500 }
    );
  }
}
