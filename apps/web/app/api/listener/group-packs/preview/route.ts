import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inviteCode = searchParams.get('inviteCode');

    if (!inviteCode) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
    }

    // Fallback: return error for now (commented out complex logic due to missing models)
    return NextResponse.json({ error: 'Group packs not available' }, { status: 501 });

  } catch (error) {
    console.error('Group pack preview error:', error);
    return NextResponse.json(
      { error: 'Failed to preview group pack' }, 
      { status: 500 }
    );
  }
}