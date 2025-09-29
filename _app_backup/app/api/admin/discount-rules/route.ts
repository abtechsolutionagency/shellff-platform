
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/admin/discount-rules - Get all discount rules
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (you can implement your admin check logic here)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const discountRules = await prisma.discountRule.findMany({
      include: {
        paymentMethod: {
          select: { name: true, provider: true }
        },
        discountUsages: {
          select: { id: true },
          take: 1 // Just to check if there are any usages
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(discountRules);
  } catch (error) {
    console.error('Error fetching discount rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discount rules' },
      { status: 500 }
    );
  }
}

// POST /api/admin/discount-rules - Create a new discount rule
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
    const {
      name,
      description,
      discountType,
      target,
      percentageDiscount,
      fixedAmountDiscount,
      buyQuantity,
      getQuantity,
      tierBreakpoints,
      minOrderAmount,
      maxOrderAmount,
      minQuantity,
      maxQuantity,
      maxUsagePerUser,
      maxTotalUsage,
      paymentMethodId,
      purchaseTypes,
      startDate,
      endDate,
      isActive,
      isStackable,
      priority
    } = body;

    // Validation
    if (!name || !discountType || !target) {
      return NextResponse.json(
        { error: 'Name, discount type, and target are required' },
        { status: 400 }
      );
    }

    // Validate discount value based on type
    if (discountType === 'PERCENTAGE' && (!percentageDiscount || percentageDiscount <= 0 || percentageDiscount > 1)) {
      return NextResponse.json(
        { error: 'Percentage discount must be between 0 and 1' },
        { status: 400 }
      );
    }

    if (discountType === 'FIXED_AMOUNT' && (!fixedAmountDiscount || fixedAmountDiscount <= 0)) {
      return NextResponse.json(
        { error: 'Fixed amount discount must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate tier breakpoints JSON if provided
    if (discountType === 'TIERED' && tierBreakpoints) {
      try {
        JSON.parse(tierBreakpoints);
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid tier breakpoints JSON format' },
          { status: 400 }
        );
      }
    }

    // Validate purchase types JSON if provided
    if (purchaseTypes) {
      try {
        JSON.parse(purchaseTypes);
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid purchase types JSON format' },
          { status: 400 }
        );
      }
    }

    const discountRule = await prisma.discountRule.create({
      data: {
        name,
        description,
        discountType,
        target,
        percentageDiscount: percentageDiscount ? parseFloat(percentageDiscount.toString()) : null,
        fixedAmountDiscount: fixedAmountDiscount ? parseFloat(fixedAmountDiscount.toString()) : null,
        buyQuantity: buyQuantity ? parseInt(buyQuantity.toString()) : null,
        getQuantity: getQuantity ? parseInt(getQuantity.toString()) : null,
        tierBreakpoints: tierBreakpoints || null,
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount.toString()) : null,
        maxOrderAmount: maxOrderAmount ? parseFloat(maxOrderAmount.toString()) : null,
        minQuantity: minQuantity ? parseInt(minQuantity.toString()) : null,
        maxQuantity: maxQuantity ? parseInt(maxQuantity.toString()) : null,
        maxUsagePerUser: maxUsagePerUser ? parseInt(maxUsagePerUser.toString()) : null,
        maxTotalUsage: maxTotalUsage ? parseInt(maxTotalUsage.toString()) : null,
        paymentMethodId: paymentMethodId || null,
        purchaseTypes: purchaseTypes || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive || true,
        isStackable: isStackable || false,
        priority: priority ? parseInt(priority.toString()) : 0,
        createdBy: user.id
      },
      include: {
        paymentMethod: {
          select: { name: true, provider: true }
        }
      }
    });

    return NextResponse.json(discountRule, { status: 201 });
  } catch (error) {
    console.error('Error creating discount rule:', error);
    return NextResponse.json(
      { error: 'Failed to create discount rule' },
      { status: 500 }
    );
  }
}
