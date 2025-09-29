
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { batchId } = params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

    if (!['csv', 'pdf', 'zip'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be csv, pdf, or zip' },
        { status: 400 }
      );
    }

    // Get the user first to get the userId
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get unlock codes for this batch
    const unlockCodes = await prisma.unlockCode.findMany({
      where: {
        batchId,
        creatorId: user.userId
      },
      include: {
        release: {
          include: {
            creator: true
          }
        }
      }
    });

    if (unlockCodes.length === 0) {
      return NextResponse.json(
        { error: 'Batch not found or no access' },
        { status: 404 }
      );
    }

    const release = unlockCodes[0].release;
    const artistName = [release.creator.firstName, release.creator.lastName]
      .filter(Boolean)
      .join(' ') || release.creator.username || 'Unknown Artist';
    const codes = unlockCodes.map((uc: any) => uc.code);

    switch (format) {
      case 'csv': {
        const csvContent = [
          'Code,Album Title,Artist,Generated Date,Status,Redeemed By,Redeemed At',
          ...unlockCodes.map((uc: any) => [
            uc.code,
            release.title,
            artistName,
            uc.createdAt.toISOString(),
            uc.status,
            uc.redeemedBy || '',
            uc.redeemedAt?.toISOString() || ''
          ].map((cell: any) => `"${cell}"`).join(','))
        ].join('\n');

        return new NextResponse(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${release.title}-codes-${batchId}.csv"`
          }
        });
      }

      case 'pdf': {
        // In a real implementation, you would regenerate the PDF with current data
        // For now, return a simple response
        return NextResponse.json({
          message: 'PDF generation not implemented in this demo',
          downloadUrl: '#'
        });
      }

      case 'zip': {
        // In a real implementation, you would create a ZIP with all barcode images
        return NextResponse.json({
          message: 'ZIP generation not implemented in this demo',
          downloadUrl: '#'
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid format' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error downloading bundle:', error);
    return NextResponse.json(
      { error: 'Failed to download bundle' },
      { status: 500 }
    );
  }
}
