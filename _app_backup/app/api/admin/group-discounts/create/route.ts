
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/lib/admin-auth';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * POST /api/admin/group-discounts/create
 * Create a new group discount (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      discountType,
      discountValue,
      minMembers = 2,
      maxMembers,
      packType,
      validFrom,
      validUntil
    } = body;

    // Validate required fields
    if (!name || !discountType || discountValue === undefined) {
      return NextResponse.json({
        error: 'Name, discount type, and discount value are required'
      }, { status: 400 });
    }

    // Validate discount type
    if (!['percentage', 'fixed_amount'].includes(discountType)) {
      return NextResponse.json({
        error: 'Discount type must be "percentage" or "fixed_amount"'
      }, { status: 400 });
    }

    // Validate discount value
    const discountValueDecimal = new Decimal(discountValue);
    if (discountValueDecimal.lte(0)) {
      return NextResponse.json({
        error: 'Discount value must be greater than 0'
      }, { status: 400 });
    }

    if (discountType === 'percentage' && discountValueDecimal.gt(100)) {
      return NextResponse.json({
        error: 'Percentage discount cannot exceed 100%'
      }, { status: 400 });
    }

    // Validate member limits
    if (minMembers < 2) {
      return NextResponse.json({
        error: 'Minimum members must be at least 2'
      }, { status: 400 });
    }

    if (maxMembers && maxMembers < minMembers) {
      return NextResponse.json({
        error: 'Maximum members cannot be less than minimum members'
      }, { status: 400 });
    }

    // Create the group discount
    const groupDiscount = await prisma.groupDiscount.create({
      data: {
        name,
        discountType,
        discountValue: discountValueDecimal,
        minMembers,
        maxMembers: maxMembers || null,
        packType: packType || null,
        isActive: true,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        discount: {
          ...groupDiscount,
          discountValue: groupDiscount.discountValue.toString()
        },
        message: 'Group discount created successfully!'
      }
    });

  } catch (error) {
    console.error('Group discount creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create group discount' },
      { status: 500 }
    );
  }
}
