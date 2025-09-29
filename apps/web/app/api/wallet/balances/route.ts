
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

    // Get user from session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get or create user's wallets
    const userId = user.id;
    
    // Ensure user has both wallet types
    const existingWallets = await prisma.wallet.findMany({
      where: { userId }
    });

    const walletTypes = ['PURCHASES', 'EARNINGS'] as const;
    const walletsToCreate = [];

    for (const type of walletTypes) {
      const existingWallet = existingWallets.find(w => w.type === type);
      if (!existingWallet) {
        walletsToCreate.push({
          userId,
          type,
          currency: type === 'PURCHASES' ? 'USD' : 'SHC',
          balance: 0
        });
      }
    }

    if (walletsToCreate.length > 0) {
      await prisma.wallet.createMany({
        data: walletsToCreate
      });
    }

    // Get all wallets
    const wallets = await prisma.wallet.findMany({
      where: { userId },
      select: {
        id: true,
        type: true,
        balance: true,
        currency: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const walletBalances = wallets.map(wallet => ({
      type: wallet.type,
      balance: parseFloat(wallet.balance.toString()),
      currency: wallet.currency,
      isActive: wallet.isActive
    }));

    return NextResponse.json({
      success: true,
      wallets: walletBalances
    });

  } catch (error) {
    console.error('Error fetching wallet balances:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
