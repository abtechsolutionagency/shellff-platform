
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  // Check admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const { creatorId, codeIds, reason } = await request.json();

    if (!creatorId || !codeIds || !Array.isArray(codeIds) || codeIds.length === 0 || !reason) {
      return NextResponse.json(
        { error: 'Creator ID, code IDs array, and reason are required' },
        { status: 400 }
      );
    }

    // Get the codes to be refunded (only unused codes)
    const codes = await prisma.unlockCode.findMany({
      where: {
        id: { in: codeIds },
        creatorId: creatorId,
        status: 'unused' // Only refund unused codes
      },
      include: {
        paymentTransaction: true
      }
    });

    if (codes.length === 0) {
      return NextResponse.json(
        { error: 'No valid unused codes found for refund' },
        { status: 400 }
      );
    }

    // Calculate total refund amount
    const totalRefund = codes.reduce((sum, code) => {
      return sum + (code.costPerCode ? Number(code.costPerCode) : 0);
    }, 0);

    if (totalRefund <= 0) {
      return NextResponse.json(
        { error: 'No refund amount calculated' },
        { status: 400 }
      );
    }

    // Start a transaction to handle the refund
    await prisma.$transaction(async (tx) => {
      // Mark codes as invalid
      await tx.unlockCode.updateMany({
        where: { id: { in: codes.map(c => c.id) } },
        data: { status: 'invalid' }
      });

      // Get or create creator's purchases wallet
      let wallet = await tx.wallet.findFirst({
        where: {
          userId: creatorId,
          type: 'PURCHASES'
        }
      });

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: {
            userId: creatorId,
            type: 'PURCHASES',
            balance: 0,
            currency: 'USD'
          }
        });
      }

      // Add refund to creator's wallet
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: totalRefund }
        }
      });

      // Create a transaction record for the refund
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'REFUND',
          status: 'COMPLETED',
          amount: totalRefund,
          currency: 'USD',
          description: `Refund for ${codes.length} unused unlock codes. Reason: ${reason}`,
          reference: `refund-${Date.now()}`,
          metadata: {
            refundedCodeIds: codes.map(c => c.id),
            reason: reason,
            adminAction: true
          }
        }
      });
    });

    // Log the refund action
    console.log(`Admin refund processed: $${totalRefund} for ${codes.length} codes to creator ${creatorId}. Reason: ${reason}`);

    return NextResponse.json({
      success: true,
      refundAmount: totalRefund,
      refundedCodes: codes.length,
      message: `Successfully processed refund of $${totalRefund} for ${codes.length} codes`
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    );
  }
}
