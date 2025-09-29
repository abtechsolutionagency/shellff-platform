
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// PUT /api/admin/discount-rules/[id] - Update a discount rule
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    const body = await request.json();

    // Check if discount rule exists
    const existingRule = await prisma.discountRule.findUnique({
      where: { id }
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: 'Discount rule not found' },
        { status: 404 }
      );
    }

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

    const updatedRule = await prisma.discountRule.update({
      where: { id },
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
        isActive: isActive !== undefined ? isActive : true,
        isStackable: isStackable !== undefined ? isStackable : false,
        priority: priority !== undefined ? parseInt(priority.toString()) : 0
      },
      include: {
        paymentMethod: {
          select: { name: true, provider: true }
        }
      }
    });

    return NextResponse.json(updatedRule);
  } catch (error) {
    console.error('Error updating discount rule:', error);
    return NextResponse.json(
      { error: 'Failed to update discount rule' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/discount-rules/[id] - Delete a discount rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Check if discount rule exists
    const existingRule = await prisma.discountRule.findUnique({
      where: { id },
      include: {
        discountUsages: true
      }
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: 'Discount rule not found' },
        { status: 404 }
      );
    }

    // Check if rule has been used
    if (existingRule.discountUsages.length > 0) {
      // Instead of deleting, just deactivate the rule
      const deactivatedRule = await prisma.discountRule.update({
        where: { id },
        data: { isActive: false }
      });

      return NextResponse.json({
        message: 'Discount rule deactivated (has usage history)',
        rule: deactivatedRule
      });
    }

    // Safe to delete if no usage history
    await prisma.discountRule.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Discount rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting discount rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete discount rule' },
      { status: 500 }
    );
  }
}
