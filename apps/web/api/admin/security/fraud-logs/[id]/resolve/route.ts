import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check admin authentication
  const authError = await requireAdminAuth();
  if (authError) return authError;

  return NextResponse.json(
    { error: 'Fraud logs functionality not available in current schema' },
    { status: 501 }
  );
}