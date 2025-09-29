
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { calculateGroupPackPricing, getDefaultPackTypes } from '@/lib/utils/groupPackPricing';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * GET /api/creator/group-packs/pricing
 * Calculate pricing for group packs based on member count and pack type
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const releaseId = searchParams.get('releaseId');
    const memberCount = parseInt(searchParams.get('memberCount') || '2');
    const packType = searchParams.get('packType') || 'family';

    if (!releaseId) {
      return NextResponse.json({ error: 'Release ID is required' }, { status: 400 });
    }

    // Get release details to calculate base pricing
    const release = await prisma.release.findUnique({
      where: { id: releaseId },
      select: {
        id: true,
        title: true,
        coverArt: true,
        creatorId: true
      }
    });

    if (!release) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    // Verify the user is the creator of this release
    if (release.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: Not the creator of this release' }, { status: 403 });
    }

    // Get active group discounts
    const activeDiscounts = await prisma.groupDiscount.findMany({
      where: {
        isActive: true,
        validFrom: { lte: new Date() },
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() }}
        ]
      },
      orderBy: [
        { minMembers: 'asc' },
        { discountValue: 'desc' }
      ]
    });

    // Calculate pricing
    // For Part 1, we'll use a default base price per member - in future parts this will come from track pricing
    const basePrice = new Decimal(10); // Default 10 SHC per member
    const pricingCalculation = calculateGroupPackPricing(
      basePrice,
      memberCount,
      packType,
      activeDiscounts as any[] // Temporary cast for Part 1
    );

    // Get available pack types
    const packTypes = getDefaultPackTypes();

    return NextResponse.json({
      success: true,
      data: {
        release: {
          id: release.id,
          title: release.title,
          coverArt: release.coverArt,
          basePrice: basePrice.toString()
        },
        pricing: {
          ...pricingCalculation,
          originalPrice: pricingCalculation.originalPrice.toString(),
          discountedPrice: pricingCalculation.discountedPrice.toString(),
          discountAmount: pricingCalculation.discountAmount.toString(),
          savings: pricingCalculation.savings.toString()
        },
        memberCount,
        packType,
        availablePackTypes: packTypes,
        appliedDiscount: pricingCalculation.appliedDiscount ? {
          ...pricingCalculation.appliedDiscount,
          discountValue: pricingCalculation.appliedDiscount.discountValue.toString()
        } : null
      }
    });

  } catch (error) {
    console.error('Group pack pricing calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate pricing' },
      { status: 500 }
    );
  }
}
