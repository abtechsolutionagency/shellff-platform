
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/creator/group-packs/list
 * Get all group packs created by the authenticated creator
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const releaseId = searchParams.get('releaseId');
    const packType = searchParams.get('packType');
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {
      creatorId: session.user.id
    };

    if (releaseId) where.releaseId = releaseId;
    if (packType) where.packType = packType;
    if (isActive !== null) where.isActive = isActive === 'true';

    // Get group packs with related data
    const groupPacks = await prisma.groupCodePack.findMany({
      where,
      include: {
        release: {
          select: {
            id: true,
            title: true,
            coverArt: true,
            status: true
          }
        },
        packMembers: {
          where: { isActive: true },
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
        },
        unlockCodes: {
          select: {
            id: true,
            status: true
          }
        },
        _count: {
          select: {
            packMembers: true,
            unlockCodes: true
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      skip: offset,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.groupCodePack.count({ where });

    // Transform the data for response
    const transformedPacks = groupPacks.map(pack => ({
      id: pack.id,
      name: pack.name,
      description: pack.description,
      packType: pack.packType,
      maxMembers: pack.maxMembers,
      currentMembers: pack.currentMembers,
      isActive: pack.isActive,
      expiresAt: pack.expiresAt,
      createdAt: pack.createdAt,
      updatedAt: pack.updatedAt,
      originalPrice: pack.originalPrice.toString(),
      discountedPrice: pack.discountedPrice.toString(),
      discountPercentage: pack.discountPercentage,
      release: pack.release,
      members: pack.packMembers.map(member => ({
        id: member.id,
        role: member.role,
        joinedAt: member.joinedAt,
        hasRedeemed: member.hasRedeemed,
        redeemedAt: member.redeemedAt,
        user: member.user
      })),
      stats: {
        totalMembers: pack._count.packMembers,
        redeemedCount: pack.packMembers.filter(m => m.hasRedeemed).length,
        availableCodes: pack._count.unlockCodes,
        redemptionRate: pack._count.packMembers > 0 
          ? Math.round((pack.packMembers.filter(m => m.hasRedeemed).length / pack._count.packMembers) * 100)
          : 0
      }
    }));

    return NextResponse.json({
      success: true,
      data: {
        groupPacks: transformedPacks,
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
    console.error('Group packs list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group packs' },
      { status: 500 }
    );
  }
}
