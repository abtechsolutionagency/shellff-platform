
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
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const batchId = params.batchId;

    // Find payment transaction (commented out - model doesn't exist)
    // const paymentTransaction = await prisma.codePaymentTransaction.findFirst({
    //   where: {
    //     batchId,
    //     creatorId: user.id
    //   },
    //   include: {
    //     supportedNetwork: true
    //   }
    // });

    // if (!paymentTransaction) {
    //   return NextResponse.json({ error: 'Payment transaction not found' }, { status: 404 });
    // }

    // Fallback: return not found for now (commented out complex logic due to missing model)
    return NextResponse.json({ error: 'Payment transaction not found' }, { status: 404 });

  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' }, 
      { status: 500 }
    );
  }
}
