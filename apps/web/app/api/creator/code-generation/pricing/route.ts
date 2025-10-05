
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
    
    // Calculate pricing
    const pricing = PricingCalculator.calculatePricing(quantity, tiers);
    const summary = PricingCalculator.getPricingSummary(pricing);

    return NextResponse.json({
      success: true,
      data: {
        ...pricing,
        summary,
        validation
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
    const { quantity, releaseId } = body;

    // Validate input
    if (!quantity || !releaseId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify release ownership
    const release = await prisma.release.findFirst({
      where: {
        id: releaseId,
        creatorId: user.id
      }
    });

    if (!release) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    // Calculate pricing for validation
    const pricing = PricingCalculator.calculatePricing(quantity);
    
    return NextResponse.json({
      success: true,
      data: {
        pricing,
        releaseId,
        quantity,
        estimatedTime: Math.ceil(quantity / 1000) // Rough estimate in seconds
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
