
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { PricingCalculator } from '@/lib/utils/pricingCalculator';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and verify creator status
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { primaryRole: true, id: true }
    });

    if (!user || user.primaryRole !== 'CREATOR') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const url = new URL(request.url);
    const quantity = parseInt(url.searchParams.get('quantity') || '0');
    const paymentMethodId = url.searchParams.get('paymentMethodId');

    if (!quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    // Validate quantity
    const validation = PricingCalculator.validateQuantity(quantity);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Get active pricing tiers
    const tiers = await PricingCalculator.getActiveTiers();
    
    // Calculate pricing with discounts
    const pricing = await PricingCalculator.calculatePricingWithDiscounts(
      quantity, 
      user.id,
      paymentMethodId || undefined,
      tiers
    );
    const summary = PricingCalculator.getPricingSummary(pricing);

    return NextResponse.json({
      success: true,
      data: {
        ...pricing,
        summary,
        validation,
        discounts: {
          applied: pricing.applicableDiscounts || [],
          originalAmount: pricing.originalAmount,
          discountAmount: pricing.discountAmount,
          finalAmount: pricing.finalAmount,
          savingsFromDiscounts: pricing.discountAmount || 0,
          savingsFromTiering: pricing.savings
        }
      }
    });

  } catch (error) {
    console.error('Pricing calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate pricing' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { primaryRole: true, id: true }
    });

    if (!user || user.primaryRole !== 'CREATOR') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { quantity, releaseId, paymentMethodId } = body;

    // Validate input
    if (!quantity || !releaseId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify release ownership
    const release = await prisma.release.findFirst({
      where: {
        id: releaseId,
        creatorId: user.id,
      }
    });

    if (!release) {
      return NextResponse.json({ error: 'Release not found or unlock codes not enabled' }, { status: 404 });
    }

    // Calculate pricing with discounts for validation
    const pricing = await PricingCalculator.calculatePricingWithDiscounts(
      quantity,
      user.id,
      paymentMethodId
    );
    
    return NextResponse.json({
      success: true,
      data: {
        pricing,
        releaseId,
        quantity,
        estimatedTime: Math.ceil(quantity / 1000), // Rough estimate in seconds
        discounts: {
          applied: pricing.applicableDiscounts || [],
          originalAmount: pricing.originalAmount,
          discountAmount: pricing.discountAmount,
          finalAmount: pricing.finalAmount,
          totalSavings: (pricing.discountAmount || 0) + pricing.savings
        }
      }
    });

  } catch (error) {
    console.error('Pricing validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate pricing' }, 
      { status: 500 }
    );
  }
}
