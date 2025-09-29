
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  // Check admin authentication
  const authError = await requireAdminAuth();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { 
          release: {
            title: { contains: search, mode: 'insensitive' }
          }
        },
        {
          creator: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { username: { contains: search, mode: 'insensitive' } }
            ]
          }
        }
      ];
    }

    // Get total count for pagination
    const total = await prisma.unlockCode.count({ where });

    // Get codes with related data
    const codes = await prisma.unlockCode.findMany({
      where,
      skip,
      take: limit,
      include: {
        release: {
          select: {
            id: true,
            title: true
          }
        },
        creator: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            username: true
          }
        },
        redeemer: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the response
    const formattedCodes = codes.map(code => ({
      id: code.id,
      code: code.code,
      releaseId: code.releaseId,
      releaseTitle: code.release?.title || 'Unknown Release',
      creatorId: code.creatorId,
      creatorName: code.creator?.firstName && code.creator?.lastName 
        ? `${code.creator.firstName} ${code.creator.lastName}`
        : code.creator?.username || 'Unknown Creator',
      status: code.status,
      redeemedBy: code.redeemer?.userId,
      redeemedByName: code.redeemer?.firstName && code.redeemer?.lastName 
        ? `${code.redeemer.firstName} ${code.redeemer.lastName}`
        : code.redeemer?.username,
      redeemedAt: code.redeemedAt?.toISOString(),
      batchId: code.batchId,
      costPerCode: code.costPerCode ? Number(code.costPerCode) : null,
      createdAt: code.createdAt.toISOString()
    }));

    return NextResponse.json({
      codes: formattedCodes,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Error fetching codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch codes' },
      { status: 500 }
    );
  }
}

