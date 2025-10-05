
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const createReleaseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  releaseType: z.enum(['SINGLE', 'ALBUM', 'EP']),
  coverArt: z.string().optional(),
  genre: z.string().optional(),
  mood: z.string().optional(),
  language: z.string().default('en'),
  isExplicit: z.boolean().default(false),
  copyrightYear: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  releaseDate: z.string().datetime().optional(),
  publishingFee: z.number().min(0),
  // Physical Album Unlock System
  physicalReleaseType: z.enum(['digital', 'physical', 'hybrid']).default('digital'),
  physicalUnlockEnabled: z.boolean().default(false),
  tracks: z.array(z.object({
    title: z.string().min(1),
    trackNumber: z.number().int().min(1),
    duration: z.string(),
    audioFile: z.string(),
    originalFileName: z.string().optional(),
    lyrics: z.string().optional(),
    isExplicit: z.boolean().default(false),
    contributors: z.array(z.object({
      name: z.string(),
      sciId: z.string(),
      role: z.string(),
      royaltyPercentage: z.number().min(0).max(100),
    })).default([]),
  })).min(1),
  royaltySplits: z.array(z.object({
    userId: z.string(),
    percentage: z.number().min(0).max(100),
  })).default([]),
});

export async function POST(request: NextRequest) {
  try {
    // Get session and verify creator status
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a creator
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { primaryRole: true }
    });

    if (!user || user.primaryRole !== 'CREATOR') {
      return NextResponse.json(
        { error: 'Only creators can upload music' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createReleaseSchema.parse(body);

    // Additional validation
    const { tracks, royaltySplits, releaseType } = validatedData;

    // Validate track count based on release type
    if (releaseType === 'SINGLE' && tracks.length > 1) {
      return NextResponse.json(
        { error: 'Singles can only have 1 track' },
        { status: 400 }
      );
    } else if (releaseType === 'EP' && (tracks.length < 2 || tracks.length > 6)) {
      return NextResponse.json(
        { error: 'EPs must have 2-6 tracks' },
        { status: 400 }
      );
    } else if (releaseType === 'ALBUM' && tracks.length < 5) {
      return NextResponse.json(
        { error: 'Albums must have at least 5 tracks' },
        { status: 400 }
      );
    }

    // Validate royalty splits
    const totalRoyalty = royaltySplits.reduce((sum: number, split: any) => sum + split.percentage, 0);
    if (royaltySplits.length > 0 && Math.abs(totalRoyalty - 100) > 0.01) {
      return NextResponse.json(
        { error: 'Royalty splits must total 100%' },
        { status: 400 }
      );
    }

    // Check wallet balance for publishing fee
    const wallet = await prisma.wallet.findFirst({
      where: {
        userId: (session.user as any).id,
        type: 'PURCHASES',
        isActive: true,
      },
    });

    if (!wallet || parseFloat(wallet.balance.toString()) < validatedData.publishingFee) {
      return NextResponse.json(
        { error: 'Insufficient funds for publishing fee' },
        { status: 400 }
      );
    }

    // Begin transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create release
      const release = await tx.release.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          releaseType: validatedData.releaseType,
          coverArt: validatedData.coverArt,
          genre: validatedData.genre,
          mood: validatedData.mood,
          language: validatedData.language,
          isExplicit: validatedData.isExplicit,
          copyrightYear: validatedData.copyrightYear,
          releaseDate: validatedData.releaseDate ? new Date(validatedData.releaseDate) : null,
          publishingFee: validatedData.publishingFee,
          publishingFeeStatus: 'PAID',
          totalTracks: tracks.length,
          totalDuration: 0, // Will be calculated after track creation
          creatorId: (session.user as any).id,
          status: 'PROCESSING',
          // Physical Album Unlock System
          physicalReleaseType: validatedData.physicalReleaseType,
          physicalUnlockEnabled: validatedData.physicalUnlockEnabled,
        },
      });

      // Deduct publishing fee from wallet
      const feeTransaction = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'FEE',
          status: 'COMPLETED',
          amount: validatedData.publishingFee,
          currency: 'USD',
          description: `Publishing fee for ${validatedData.releaseType}: ${validatedData.title}`,
          reference: `pub-fee-${release.id}`,
          metadata: {
            releaseId: release.id,
            releaseType: validatedData.releaseType,
          },
          completedAt: new Date(),
        },
      });

      // Update wallet balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            decrement: validatedData.publishingFee,
          },
        },
      });

      // Store transaction ID in release
      await tx.release.update({
        where: { id: release.id },
        data: { publishingFeeTxId: feeTransaction.id },
      });

      // Create tracks
      let totalDuration = 0;
      const createdTracks: any[] = [];

      for (const trackData of tracks as any[]) {
        const track = await tx.releaseTrack.create({
          data: {
            releaseId: release.id,
            title: trackData.title,
            trackNumber: trackData.trackNumber,
            duration: parseInt(trackData.duration.split(':')[0]) * 60 + parseInt(trackData.duration.split(':')[1] || '0'),
            audioFile: trackData.audioFile,
            originalFileName: trackData.originalFileName,
            lyrics: trackData.lyrics,
            isExplicit: trackData.isExplicit,
          },
        });

        totalDuration += track.duration;

        // Create track contributors
        for (const contributor of (trackData.contributors as any[])) {
          // Find contributor by sciId
          const contributorUser = await tx.user.findUnique({
            where: { sciId: contributor.sciId },
          });

          if (contributorUser) {
            await tx.trackContributor.create({
              data: {
                releaseTrackId: track.id,
                contributorId: contributorUser.id,
                role: contributor.role as any,
                royaltyPercentage: contributor.royaltyPercentage / 100, // Convert to decimal
              },
            });
          }
        }

        createdTracks.push(track);
      }

      // Update release total duration
      await tx.release.update({
        where: { id: release.id },
        data: { totalDuration },
      });

      // Create royalty splits
      for (const split of royaltySplits as any[]) {
        await tx.royaltySplit.create({
          data: {
            releaseId: release.id,
            userId: split.userId,
            percentage: split.percentage / 100, // Convert to decimal
          },
        });
      }

      return { release, tracks: createdTracks, feeTransaction };
    });

    return NextResponse.json({
      id: result.release.id,
      title: result.release.title,
      status: result.release.status,
      publishingFee: result.release.publishingFee,
      tracks: result.tracks.length,
      message: 'Release created successfully and is being processed for publication',
    });

  } catch (error) {
    console.error('Create release error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create release' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get session and verify creator status
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const status = searchParams.get('status');

    const where = {
      creatorId: (session.user as any).id,
      ...(status && { status: status as any }),
    };

    const [releases, total] = await Promise.all([
      prisma.release.findMany({
        where,
        include: {
          tracks: {
            select: {
              id: true,
              title: true,
              duration: true,
              position: true,
            },
            orderBy: { position: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.release.count({ where }),
    ]);

    return NextResponse.json({
      releases,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Get releases error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch releases' },
      { status: 500 }
    );
  }
}
