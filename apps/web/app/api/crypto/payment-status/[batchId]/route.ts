
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { NetworkHandlers } from '@/lib/crypto/networkHandlers';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { userId: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const batchId = params.batchId;

    // Find payment transaction
    const paymentTransaction = await prisma.codePaymentTransaction.findFirst({
      where: {
        batchId,
        creatorId: user.userId
      },
      include: {
        supportedNetwork: true
      }
    });

    if (!paymentTransaction) {
      return NextResponse.json({ error: 'Payment transaction not found' }, { status: 404 });
    }

    let paymentStatus: any = {
      status: paymentTransaction.confirmationStatus,
      confirmations: paymentTransaction.confirmations,
      createdAt: paymentTransaction.createdAt,
      confirmedAt: paymentTransaction.confirmedAt
    };

    // If crypto payment and still pending, check blockchain
    if (paymentTransaction.paymentMethod === 'crypto' && 
        paymentTransaction.confirmationStatus === 'pending' &&
        paymentTransaction.paymentAddress &&
        paymentTransaction.networkType) {
      
      try {
        const blockchainStatus = await NetworkHandlers.checkPaymentStatus(
          paymentTransaction.paymentAddress,
          paymentTransaction.networkType,
          Number(paymentTransaction.amountUsd)
        );

        paymentStatus = {
          ...paymentStatus,
          ...blockchainStatus
        };

        // Update database if status changed
        if (blockchainStatus.status !== paymentTransaction.confirmationStatus) {
          await prisma.codePaymentTransaction.update({
            where: { id: paymentTransaction.id },
            data: {
              confirmationStatus: blockchainStatus.status,
              confirmations: blockchainStatus.confirmations,
              transactionHash: blockchainStatus.txHash,
              confirmedAt: blockchainStatus.status === 'confirmed' ? new Date() : null
            }
          });
        }
      } catch (blockchainError) {
        console.error('Blockchain status check error:', blockchainError);
        // Continue with database status
      }
    }

    // Get generated codes count
    const codesGenerated = await prisma.unlockCode.count({
      where: { batchId }
    });

    return NextResponse.json({
      success: true,
      data: {
        batchId,
        paymentMethod: paymentTransaction.paymentMethod,
        networkType: paymentTransaction.networkType,
        networkDisplayName: paymentTransaction.supportedNetwork?.networkDisplayName,
        amountUsd: Number(paymentTransaction.amountUsd),
        paymentAddress: paymentTransaction.paymentAddress,
        codesGenerated,
        ...paymentStatus
      }
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' }, 
      { status: 500 }
    );
  }
}
