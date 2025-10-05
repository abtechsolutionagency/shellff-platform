import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Group packs functionality not available in current schema' },
    { status: 501 }
  );
}