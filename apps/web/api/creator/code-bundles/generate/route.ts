
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { generateBatchCodes } from '@/lib/utils/codeGenerator';

const prisma = new PrismaClient();
import { generateBatchBarcodes } from '@/lib/utils/barcodeGenerator';
import { generateCodesPDF, generateCSV } from '@/lib/utils/pdfGenerator';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { releaseId, quantity } = body;

    if (!releaseId || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'Release ID and quantity are required' },
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

    // Verify the release belongs to the user and include creator info
    const release = await prisma.release.findFirst({
      where: {
        id: releaseId,
        creatorId: user.id,
      },
      include: {
        creator: true
      }
    });

    if (!release) {
      return NextResponse.json(
        { error: 'Release not found or physical unlock not enabled' },
        { status: 404 }
      );
    }

    // Generate unique batch ID
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Generate codes
    const codes = generateBatchCodes(quantity);
    
    // Create unlock codes in database
    const unlockCodes = await Promise.all(
      codes.map(async (code) => {
        return prisma.unlockCode.create({
          data: {
            code,
            releaseId,
            creatorId: user.id,
            batchId,
            status: 'UNUSED'
          }
        });
      })
    );

    // Generate barcodes
    const barcodeData = await generateBatchBarcodes(codes, { format: 'svg' });
    
    // Get artist name from creator
    const artistName = release.creator.displayName || 'Unknown Artist';

    // Prepare data for PDF and CSV generation
    const codeData = unlockCodes.map((unlockCode, index) => ({
      code: unlockCode.code,
      barcode: barcodeData[index].barcode,
      albumTitle: release.title,
      artistName: artistName
    }));

    // Generate PDF
    const pdfBuffer = generateCodesPDF(codeData, {
      title: release.title,
      artist: artistName
    });

    // Generate CSV
    const csvContent = generateCSV(codeData, {
      title: release.title,
      artist: artistName
    });

    // In a production environment, you would save these files to cloud storage
    // For now, we'll return the data directly
    const pdfBase64 = pdfBuffer.toString('base64');
    const csvBase64 = Buffer.from(csvContent).toString('base64');

    // Create a bundle record for tracking
    const bundle = {
      id: batchId,
      batchId,
      releaseId,
      albumTitle: release.title,
      artistName: artistName,
      totalCodes: quantity,
      generatedAt: new Date().toISOString(),
      status: 'ready' as const,
      downloadUrls: {
        csv: `data:text/csv;base64,${csvBase64}`,
        pdf: `data:application/pdf;base64,${pdfBase64}`,
        zip: `data:application/zip;base64,${csvBase64}` // Simplified for demo
      }
    };

    return NextResponse.json({
      success: true,
      bundle,
      message: `Successfully generated ${quantity} unlock codes`
    });

  } catch (error) {
    console.error('Error generating code bundle:', error);
    return NextResponse.json(
      { error: 'Failed to generate code bundle' },
      { status: 500 }
    );
  }
}
