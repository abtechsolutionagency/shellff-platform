
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    // Build where clause (same as list endpoint)
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

    // Get all codes matching the criteria (no pagination for export)
    const codes = await prisma.unlockCode.findMany({
      where,
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
            username: true,
            email: true
          }
        },
        redeemer: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Generate CSV content
    const headers = [
      'Code',
      'Status', 
      'Release Title',
      'Creator Name',
      'Creator Email',
      'Redeemed By',
      'Redeemer Email',
      'Redeemed At',
      'Cost Per Code',
      'Batch ID',
      'Created At'
    ];

    const csvRows = [
      headers.join(','), // Header row
      ...codes.map(code => {
        const creatorName = code.creator?.firstName && code.creator?.lastName 
          ? `${code.creator.firstName} ${code.creator.lastName}`
          : code.creator?.username || 'Unknown';
        
        const redeemerName = code.redeemer?.firstName && code.redeemer?.lastName 
          ? `${code.redeemer.firstName} ${code.redeemer.lastName}`
          : code.redeemer?.username || '';

        return [
          `"${code.code}"`,
          `"${code.status}"`,
          `"${code.release?.title || 'Unknown Release'}"`,
          `"${creatorName}"`,
          `"${code.creator?.email || ''}"`,
          `"${redeemerName}"`,
          `"${code.redeemer?.email || ''}"`,
          `"${code.redeemedAt ? code.redeemedAt.toISOString() : ''}"`,
          `"${code.costPerCode ? Number(code.costPerCode) : ''}"`,
          `"${code.batchId || ''}"`,
          `"${code.createdAt.toISOString()}"`
        ].join(',');
      })
    ];

    const csvContent = csvRows.join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="unlock-codes-${Date.now()}.csv"`,
      },
    });

  } catch (error) {
    console.error('Error exporting codes:', error);
    return NextResponse.json(
      { error: 'Failed to export codes' },
      { status: 500 }
    );
  }
}
