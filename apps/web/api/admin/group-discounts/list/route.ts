
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/lib/admin-auth';

/**
 * GET /api/admin/group-discounts/list
 * Get all group discounts (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const packType = searchParams.get('packType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (isActive !== null) where.isActive = isActive === 'true';
    if (packType && packType !== 'all') where.packType = packType;

    // Get group discounts
    const groupDiscounts = await prisma.groupDiscount.findMany({
      where,
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: offset,
      take: limit
    });

    // Get total count
    const totalCount = await prisma.groupDiscount.count({ where });

    // Transform the data for response
    const transformedDiscounts = groupDiscounts.map(discount => ({
      id: discount.id,
      name: discount.name,
      discountType: discount.discountType,
      discountValue: discount.discountValue.toString(),
      minMembers: discount.minMembers,
      maxMembers: discount.maxMembers,
      packType: discount.packType,
      isActive: discount.isActive,
      validFrom: discount.validFrom,
      validUntil: discount.validUntil,
      createdAt: discount.createdAt,
      updatedAt: discount.updatedAt
    }));

    return NextResponse.json({
      success: true,
      data: {
        discounts: transformedDiscounts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: offset + limit < totalCount,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Group discounts list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group discounts' },
      { status: 500 }
    );
  }
}
