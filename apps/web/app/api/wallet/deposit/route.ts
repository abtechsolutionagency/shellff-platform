
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const depositSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  paymentProvider: z.string().min(1, 'Payment provider is required'),
  returnUrl: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = depositSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { amount, paymentProvider, returnUrl } = validation.data;
    // Get user from session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user.id;

    // Verify payment method exists and is enabled
    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: { 
        provider: paymentProvider as any,
        isEnabled: true
      }
    });

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method not available' },
        { status: 400 }
      );
    }

    // Check amount limits
    if (paymentMethod.minAmount && amount < parseFloat(paymentMethod.minAmount.toString())) {
      return NextResponse.json(
        { error: `Minimum amount is ${paymentMethod.minAmount} ${paymentMethod.currency}` },
        { status: 400 }
      );
    }

    if (paymentMethod.maxAmount && amount > parseFloat(paymentMethod.maxAmount.toString())) {
      return NextResponse.json(
        { error: `Maximum amount is ${paymentMethod.maxAmount} ${paymentMethod.currency}` },
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

    // Calculate final amount with discount
    const discountRate = parseFloat(paymentMethod.discountRate.toString());
    const discountAmount = amount * discountRate;
    const finalAmount = amount - discountAmount;

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEPOSIT',
        status: 'PENDING',
        amount: finalAmount,
        currency: paymentMethod.currency,
        description: `Deposit via ${paymentMethod.name}`,
        paymentProvider: paymentProvider as any,
        reference: `DEP_${Date.now()}_${userId.slice(-6)}`,
        metadata: {
          originalAmount: amount,
          discountRate,
          discountAmount,
          returnUrl
        }
      }
    });

    // For demo purposes, simulate different payment flows
    let paymentData = {};

    switch (paymentProvider) {
      case 'STRIPE':
        paymentData = {
          paymentIntentId: `pi_${Date.now()}`,
          clientSecret: `pi_${Date.now()}_secret_${Date.now()}`,
          publishableKey: 'pk_test_demo_key',
          amount: Math.round(finalAmount * 100), // Stripe uses cents
          currency: paymentMethod.currency.toLowerCase()
        };
        break;
        
      case 'PAYSTACK':
        paymentData = {
          authorizationUrl: `https://checkout.paystack.com/demo_${transaction.id}`,
          accessCode: `AC_${Date.now()}`,
          reference: transaction.reference
        };
        break;
        
      case 'CRYPTO_SOL':
        paymentData = {
          walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
          amount: finalAmount,
          currency: 'USDC',
          network: 'solana-mainnet',
          memo: transaction.reference
        };
        break;
        
      default:
        paymentData = {
          reference: transaction.reference,
          amount: finalAmount,
          currency: paymentMethod.currency
        };
    }

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      reference: transaction.reference,
      amount: finalAmount,
      originalAmount: amount,
      discountAmount,
      currency: paymentMethod.currency,
      paymentProvider,
      paymentData
    });

  } catch (error) {
    console.error('Error initiating deposit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
