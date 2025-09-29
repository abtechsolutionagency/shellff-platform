
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

    // Get available payment methods
    let paymentMethods = await prisma.paymentMethod.findMany({
      where: { isEnabled: true },
      orderBy: { provider: 'asc' }
    });

    // If no payment methods exist, create default ones
    if (paymentMethods.length === 0) {
      const defaultMethods = [
        {
          provider: 'PAYSTACK',
          name: 'Paystack (Card/Bank)',
          isEnabled: true,
          discountRate: 0,
          currency: 'USD',
          minAmount: 1,
          maxAmount: 10000,
          settings: {}
        },
        {
          provider: 'STRIPE',
          name: 'Stripe (Card/Bank)',
          isEnabled: true,
          discountRate: 0,
          currency: 'USD',
          minAmount: 1,
          maxAmount: 10000,
          settings: {}
        },
        {
          provider: 'CRYPTO_SOL',
          name: 'Crypto (SOL/USDC)',
          isEnabled: true,
          discountRate: 0.05, // 5% discount for crypto
          currency: 'USD',
          minAmount: 5,
          maxAmount: 50000,
          settings: {}
        },
        {
          provider: 'VOUCHER',
          name: 'Voucher Code',
          isEnabled: true,
          discountRate: 0,
          currency: 'USD',
          settings: {}
        }
      ] as const;

      await prisma.paymentMethod.createMany({
        data: defaultMethods as any
      });

      paymentMethods = await prisma.paymentMethod.findMany({
        where: { isEnabled: true },
        orderBy: { provider: 'asc' }
      });
    }

    const formattedMethods = paymentMethods.map((method: any) => ({
      id: method.id,
      provider: method.provider,
      name: method.name,
      isEnabled: method.isEnabled,
      discountRate: parseFloat(method.discountRate.toString()),
      currency: method.currency,
      minAmount: method.minAmount ? parseFloat(method.minAmount.toString()) : null,
      maxAmount: method.maxAmount ? parseFloat(method.maxAmount.toString()) : null
    }));

    return NextResponse.json({
      success: true,
      methods: formattedMethods
    });

  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
