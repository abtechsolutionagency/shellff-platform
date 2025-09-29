
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { userType: true, userId: true }
    });

    if (!user || user.userType !== 'CREATOR') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch code payment transactions (batches) for this creator
    const batches = await prisma.codePaymentTransaction.findMany({
      where: {
        creatorId: user.userId
      },
      include: {
        unlockCodes: {
          select: {
            id: true,
            status: true,
            releaseId: true
          }
        },
        _count: {
          select: {
            unlockCodes: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform data to match expected format
    const transformedBatches = await Promise.all(batches.map(async (batch: any) => {
      // Get release info
      const release = await prisma.release.findFirst({
        where: {
          id: batch.unlockCodes[0]?.releaseId || ''
        },
        select: {
          title: true,
          coverArt: true
        }
      });

      // Count redeemed codes
      const redeemedCount = batch.unlockCodes.filter((code: any) => code.status === 'redeemed').length;

      return {
        id: batch.id,
        batchId: batch.batchId,
        releaseId: batch.unlockCodes[0]?.releaseId || '',
        quantity: batch._count.unlockCodes,
        totalCost: Number(batch.amountUsd),
        paymentMethod: batch.paymentMethod,
        status: batch.confirmationStatus,
        createdAt: batch.createdAt.toISOString(),
        codesGenerated: batch._count.unlockCodes,
        codesRedeemed: redeemedCount,
        release: {
          title: release?.title || 'Unknown Release',
          coverArt: release?.coverArt || null
        }
      };
    }));

    return NextResponse.json({
      success: true,
      data: transformedBatches
    });

  } catch (error) {
    console.error('Error fetching code batches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch code batches' }, 
      { status: 500 }
    );
  }
}
