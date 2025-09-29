
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type'); // Optional filter by transaction type

    // Get user from session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user.id;

    // Get user's wallets
    const userWallets = await prisma.wallet.findMany({
      where: { userId },
      select: { id: true }
    });

    const walletIds = userWallets.map((w: any) => w.id);

    if (walletIds.length === 0) {
      return NextResponse.json({
        success: true,
        transactions: [],
        total: 0
      });
    }

    // Build where clause
    const whereClause: any = {
      walletId: { in: walletIds }
    };

    if (type) {
      whereClause.type = type;
    }

    // Get transactions with pagination
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          type: true,
          status: true,
          amount: true,
          currency: true,
          description: true,
          reference: true,
          paymentProvider: true,
          fee: true,
          feesCurrency: true,
          createdAt: true,
          completedAt: true,
          wallet: {
            select: {
              type: true
            }
          }
        }
      }),
      prisma.transaction.count({
        where: whereClause
      })
    ]);

    const formattedTransactions = transactions.map((tx: any) => ({
      id: tx.id,
      type: tx.type,
      status: tx.status,
      amount: parseFloat(tx.amount.toString()),
      currency: tx.currency,
      description: tx.description,
      reference: tx.reference,
      paymentProvider: tx.paymentProvider,
      fee: tx.fee ? parseFloat(tx.fee.toString()) : null,
      feesCurrency: tx.feesCurrency,
      createdAt: tx.createdAt,
      completedAt: tx.completedAt,
      walletType: tx.wallet.type
    }));

    return NextResponse.json({
      success: true,
      transactions: formattedTransactions,
      total,
      limit,
      offset
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
