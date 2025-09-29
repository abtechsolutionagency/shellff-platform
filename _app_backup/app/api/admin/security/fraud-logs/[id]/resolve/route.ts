
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminUserOrThrow } from '@/lib/admin-auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await getAdminUserOrThrow();

    const body = await request.json();
    const { notes } = body;

    const fraudLog = await prisma.fraudDetectionLog.update({
      where: { id: params.id },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: adminUser.id,
        notes,
      },
    });

    return NextResponse.json(fraudLog);
  } catch (error) {
    console.error('Fraud log resolution error:', error);
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to resolve fraud log' },
      { status: 500 }
    );
  }
}
