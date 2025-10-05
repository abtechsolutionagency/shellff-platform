import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  // Check admin authentication
  const authError = await requireAdminAuth();
  if (authError) return authError;

  return NextResponse.json(
    { error: 'Group discounts functionality not available in current schema' },
    { status: 501 }
  );
}