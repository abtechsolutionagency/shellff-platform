
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { calculateGroupPackPricing, generatePackInviteCode, validatePackMemberCount } from '@/lib/utils/groupPackPricing';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * POST /api/creator/group-packs/create
 * Create a new group code pack
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      releaseId,
      packName,
      packDescription,
      packType = 'family',
      maxMembers = 5,
      expiresAt
    } = body;

    // Validate required fields
    if (!releaseId || !packName) {
      return NextResponse.json({ 
        error: 'Release ID and pack name are required' 
      }, { status: 400 });
    }

    // Validate max members
    const memberValidation = validatePackMemberCount(0, maxMembers, 1);
    if (!memberValidation.valid) {
      return NextResponse.json({ 
        error: memberValidation.message 
      }, { status: 400 });
    }

    // Get release details
    const release = await prisma.release.findUnique({
      where: { id: releaseId },
      select: {
        id: true,
        title: true,
        creatorId: true,
        physicalUnlockEnabled: true
      }
    });

    if (!release) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    // Verify the user is the creator
    if (release.creatorId !== session.user.id) {
      return NextResponse.json({ 
        error: 'Unauthorized: Not the creator of this release' 
      }, { status: 403 });
    }

    // Verify physical unlock is enabled for this release
    if (!release.physicalUnlockEnabled) {
      return NextResponse.json({ 
        error: 'Physical unlock is not enabled for this release' 
      }, { status: 400 });
    }

    // Get active discounts for pricing calculation
    const activeDiscounts = await prisma.groupDiscount.findMany({
      where: {
        isActive: true,
        validFrom: { lte: new Date() },
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() }}
        ]
      }
    });

    // Calculate pricing for the minimum number of members (creator + 1)
    // For Part 1, we'll use a default base price per member - in future parts this will come from track pricing
    const basePrice = new Decimal(10); // Default 10 SHC per member
    const pricingCalculation = calculateGroupPackPricing(
      basePrice,
      maxMembers,
      packType,
      activeDiscounts as any[] // Temporary cast for Part 1
    );

    // Create the group pack
    const groupPack = await prisma.groupCodePack.create({
      data: {
        name: packName,
        description: packDescription,
        releaseId,
        creatorId: session.user.id,
        packType,
        maxMembers,
        currentMembers: 1, // Creator is automatically a member
        isActive: true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        originalPrice: pricingCalculation.originalPrice,
        discountedPrice: pricingCalculation.discountedPrice,
        discountPercentage: pricingCalculation.discountPercentage
      },
      include: {
        release: {
          select: {
            id: true,
            title: true,
            coverArt: true
          }
        },
        packMembers: {
          include: {
            user: {
              select: {
                userId: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    // Create the creator as the first pack member (owner role)
    await prisma.packMember.create({
      data: {
        packId: groupPack.id,
        userId: session.user.id,
        role: 'owner',
        isActive: true,
        hasRedeemed: false
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        groupPack: {
          ...groupPack,
          originalPrice: groupPack.originalPrice.toString(),
          discountedPrice: groupPack.discountedPrice.toString()
        },
        message: 'Group pack created successfully!'
      }
    });

  } catch (error) {
    console.error('Group pack creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create group pack' },
      { status: 500 }
    );
  }
}
