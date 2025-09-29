
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const withdrawSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  walletAddress: z.string().optional(),
  walletType: z.enum(['PURCHASES', 'EARNINGS']).optional().default('EARNINGS')
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = withdrawSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { amount, walletAddress, walletType } = validation.data;
    // Get user from session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user.id;

    // Get user's wallet
    const wallet = await prisma.wallet.findFirst({
      where: { 
        userId, 
        type: walletType
      }
    });

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    const currentBalance = parseFloat(wallet.balance.toString());

    // Check minimum withdrawal amount for earnings wallet
    if (walletType === 'EARNINGS') {
      const minWithdrawal = 50; // 50 SHC minimum
      if (amount < minWithdrawal) {
        return NextResponse.json(
          { error: `Minimum withdrawal amount is ${minWithdrawal} SHC` },
          { status: 400 }
        );
      }

      // Require wallet address for crypto withdrawals
      if (!walletAddress) {
        return NextResponse.json(
          { error: 'Wallet address is required for SHC withdrawals' },
          { status: 400 }
        );
      }

      // Basic SOL address validation (simplified)
      if (walletAddress.length < 32 || walletAddress.length > 44) {
        return NextResponse.json(
          { error: 'Invalid Solana wallet address' },
          { status: 400 }
        );
      }
    }

    // Check sufficient balance
    const withdrawalFee = walletType === 'EARNINGS' ? 1 : 0; // $1 SOL fee for SHC withdrawals
    const totalDeduction = amount + withdrawalFee;

    if (currentBalance < totalDeduction) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Create withdrawal transaction
    const transaction = await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'WITHDRAWAL',
        status: 'PROCESSING', // Withdrawals need manual approval/processing
        amount: amount,
        currency: wallet.currency,
        description: `Withdrawal to ${walletType === 'EARNINGS' ? 'external wallet' : 'bank account'}`,
        reference: `WTH_${Date.now()}_${userId.slice(-6)}`,
        fee: withdrawalFee,
        feesCurrency: walletType === 'EARNINGS' ? 'USD' : wallet.currency,
        walletAddress,
        metadata: {
          walletType,
          withdrawalFee,
          requestedAt: new Date().toISOString()
        }
      }
    });

    // For demo purposes, we don't actually deduct the balance yet
    // In production, this would be handled by a background job after admin approval

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      reference: transaction.reference,
      amount,
      fee: withdrawalFee,
      currency: wallet.currency,
      estimatedProcessingTime: walletType === 'EARNINGS' ? '1-3 business days' : '3-5 business days',
      status: 'PROCESSING'
    });

  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
