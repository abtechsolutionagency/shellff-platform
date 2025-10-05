import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check admin authentication
  const authError = await requireAdminAuth();
  if (authError) return authError;

  const { id } = params;

  return NextResponse.json(
    { error: 'Discount rules functionality not available in current schema' },
    { status: 501 }
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check admin authentication
  const authError = await requireAdminAuth();
  if (authError) return authError;

  const { id } = params;

  return NextResponse.json(
    { error: 'Discount rules functionality not available in current schema' },
    { status: 501 }
  );
}