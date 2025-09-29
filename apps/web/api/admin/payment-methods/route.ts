
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/admin/payment-methods - Get all payment methods
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const paymentMethods = await prisma.paymentMethod.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(paymentMethods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}

// POST /api/admin/payment-methods - Create or update payment method discount
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { id, discountRate, isEnabled } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    // Validate discount rate
    if (discountRate !== undefined && (discountRate < 0 || discountRate > 1)) {
      return NextResponse.json(
        { error: 'Discount rate must be between 0 and 1' },
        { status: 400 }
      );
    }

    const updatedPaymentMethod = await prisma.paymentMethod.update({
      where: { id },
      data: {
        discountRate: discountRate !== undefined ? parseFloat(discountRate.toString()) : undefined,
        isEnabled: isEnabled !== undefined ? isEnabled : undefined
      }
    });

    return NextResponse.json(updatedPaymentMethod);
  } catch (error) {
    console.error('Error updating payment method:', error);
    return NextResponse.json(
      { error: 'Failed to update payment method' },
      { status: 500 }
    );
  }
}
