
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';
import { UnlockCodeStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  // Check admin authentication
  const authError = await requireAdminAuth();
  if (authError) return authError;

  try {
    const { action, codeIds, reason } = await request.json();

    if (!action || !codeIds || !Array.isArray(codeIds) || codeIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request. Action and codeIds array are required.' },
        { status: 400 }
      );
    }

    let updateData: any = {};
    let affectedCount = 0;

    switch (action) {
      case 'mark_invalid':
        updateData = { status: 'REVOKED' };
        break;
      case 'mark_unused':
        updateData = { status: 'UNUSED' };
        break;
      case 'revoke':
        updateData = { 
          status: 'REVOKED',
          redeemedAt: null,
          redeemedBy: null
        };
        break;
      case 'delete':
        // For delete, we'll actually mark as invalid rather than delete from DB
        // to preserve audit trail
        updateData = { status: 'REVOKED' };
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action type' },
          { status: 400 }
        );
    }

    // Only allow operations on codes that haven't been redeemed (unless it's restore)
    const whereClause = action === 'mark_unused' 
      ? { id: { in: codeIds } } // For restore, allow any status
      : { id: { in: codeIds }, status: { in: [UnlockCodeStatus.UNUSED, UnlockCodeStatus.REVOKED] } }; // For others, exclude redeemed

    // Perform the bulk update
    const result = await prisma.unlockCode.updateMany({
      where: whereClause,
      data: updateData
    });

    affectedCount = result.count;

    // Log the admin action for audit trail
    if (reason && affectedCount > 0) {
      // You could create an admin_actions table to log this
      console.log(`Admin bulk action: ${action} on ${affectedCount} codes. Reason: ${reason}`);
    }

    return NextResponse.json({
      success: true,
      affectedCount,
      message: `Successfully performed ${action} on ${affectedCount} codes`
    });

  } catch (error) {
    console.error('Error performing bulk operation:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}

