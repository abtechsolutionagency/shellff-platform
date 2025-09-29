
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const redeemSchema = z.object({
  code: z.string().min(1, 'Voucher code is required').max(50, 'Voucher code is too long')
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = redeemSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { code } = validation.data;
    // Get user from session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user.id;
    const normalizedCode = code.trim().toUpperCase();

    // Find the voucher
    const voucher = await prisma.voucher.findFirst({
      where: { 
        code: normalizedCode,
        isActive: true
      },
      include: {
        redemptions: true
      }
    });

    if (!voucher) {
      return NextResponse.json(
        { error: 'Invalid or expired voucher code' },
        { status: 404 }
      );
    }

    // Check if voucher has expired
    if (voucher.expiresAt && voucher.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This voucher has expired' },
        { status: 400 }
      );
    }

    // Check usage limit
    if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
      return NextResponse.json(
        { error: 'This voucher has reached its usage limit' },
        { status: 400 }
      );
    }

    // Check if user has already redeemed this voucher
    const existingRedemption = voucher.redemptions.find((r: any) => r.userId === userId);
    if (existingRedemption) {
      return NextResponse.json(
        { error: 'You have already redeemed this voucher' },
        { status: 400 }
      );
    }

    // Get or create purchases wallet
    let wallet = await prisma.wallet.findFirst({
      where: { 
        userId, 
        type: 'PURCHASES' 
      }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          type: 'PURCHASES',
          currency: 'USD',
          balance: 0
        }
      });
    }

    const voucherAmount = parseFloat(voucher.amount.toString());

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx: any) => {
      // Create voucher redemption record
      const redemption = await tx.voucherRedemption.create({
        data: {
          voucherId: voucher.id,
          userId,
          amount: voucherAmount,
          currency: voucher.currency
        }
      });

      // Update voucher usage count
      await tx.voucher.update({
        where: { id: voucher.id },
        data: { usedCount: voucher.usedCount + 1 }
      });

      // Add funds to wallet
      await tx.wallet.update({
        where: { id: wallet!.id },
        data: {
          balance: {
            increment: voucherAmount
          }
        }
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          walletId: wallet!.id,
          type: 'VOUCHER_REDEMPTION',
          status: 'COMPLETED',
          amount: voucherAmount,
          currency: voucher.currency,
          description: `Voucher redeemed: ${normalizedCode}`,
          reference: `VCR_${Date.now()}_${userId.slice(-6)}`,
          paymentProvider: 'VOUCHER',
          completedAt: new Date(),
          metadata: {
            voucherCode: normalizedCode,
            voucherId: voucher.id,
            redemptionId: redemption.id
          }
        }
      });

      return { redemption, transaction };
    });

    return NextResponse.json({
      success: true,
      amount: voucherAmount,
      currency: voucher.currency,
      transactionId: result.transaction.id,
      reference: result.transaction.reference,
      message: `Successfully redeemed voucher! ${voucherAmount} ${voucher.currency} added to your wallet.`
    });

  } catch (error) {
    console.error('Error redeeming voucher:', error);
    
    // Handle specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'You have already redeemed this voucher' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create demo vouchers endpoint for testing
export async function PUT(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (simplified check)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user?.email?.includes('admin') && !user?.email?.includes('john@doe.com')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Create demo vouchers if none exist
    const existingVouchers = await prisma.voucher.count();
    
    if (existingVouchers === 0) {
      const demoVouchers = [
        {
          code: 'WELCOME10',
          amount: 10,
          currency: 'USD',
          description: 'Welcome bonus - $10 free credits',
          usageLimit: 100
        },
        {
          code: 'TESTCODE',
          amount: 25,
          currency: 'USD',
          description: 'Test voucher - $25 credits',
          usageLimit: 10
        },
        {
          code: 'PREMIUM50',
          amount: 50,
          currency: 'USD',
          description: 'Premium voucher - $50 credits',
          usageLimit: 5
        }
      ];

      await prisma.voucher.createMany({
        data: demoVouchers
      });

      return NextResponse.json({
        success: true,
        message: 'Demo vouchers created',
        vouchers: demoVouchers.map(v => v.code)
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Vouchers already exist'
    });

  } catch (error) {
    console.error('Error creating demo vouchers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
