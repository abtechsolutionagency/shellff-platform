
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const calculateRoyaltiesSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be in format YYYY-MM'),
});

export async function POST(request: NextRequest) {
  try {
    // Get session and verify admin permissions
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, allow any authenticated user (in production, restrict to admins)
    const body = await request.json();
    const { period } = calculateRoyaltiesSchema.parse(body);

    const [year, month] = period.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of month

    // Get all qualified streams for the period
    const qualifiedStreams = await prisma.streamingStats.findMany({
      where: {
        isQualified: true,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        releaseTrack: {
          include: {
            release: {
              include: {
                royaltySplits: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        username: true,
                        sciId: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Calculate royalties per release
    const releaseRoyalties = new Map<string, {
      releaseId: string;
      totalStreams: number;
      totalRevenue: number;
      splits: Map<string, { userId: string; percentage: number; amount: number }>;
    }>();

    // Base revenue per stream (this could be configurable)
    const revenuePerStream = 0.001; // $0.001 per stream

    for (const stream of qualifiedStreams) {
      const releaseId = stream.releaseTrack.release.id;
      
      if (!releaseRoyalties.has(releaseId)) {
        releaseRoyalties.set(releaseId, {
          releaseId,
          totalStreams: 0,
          totalRevenue: 0,
          splits: new Map(),
        });

        // Initialize splits for this release
        const release = stream.releaseTrack.release;
        for (const split of release.royaltySplits) {
          releaseRoyalties.get(releaseId)!.splits.set(split.userId, {
            userId: split.userId,
            percentage: parseFloat(split.percentage.toString()),
            amount: 0,
          });
        }

        // If no splits defined, 100% goes to creator
        if (release.royaltySplits.length === 0) {
          releaseRoyalties.get(releaseId)!.splits.set(release.creatorId, {
            userId: release.creatorId,
            percentage: 1.0,
            amount: 0,
          });
        }
      }

      const releaseData = releaseRoyalties.get(releaseId)!;
      releaseData.totalStreams += 1;
      releaseData.totalRevenue += revenuePerStream;

      // Distribute revenue according to splits
      for (const split of releaseData.splits.values()) {
        split.amount += revenuePerStream * split.percentage;
      }
    }

    // Get S2E configuration for platform take
    const s2eConfig = await prisma.s2EConfiguration.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
    const platformTake = s2eConfig ? parseFloat(s2eConfig.platformTake.toString()) : 0.1;

    // Create royalty payments
    const createdPayments = [];
    const errors = [];

    for (const [releaseId, releaseData] of releaseRoyalties) {
      for (const split of releaseData.splits.values()) {
        if (split.amount > 0) {
          const targetUserId = split.userId;
          try {
            // Apply platform take
            const netAmount = split.amount * (1 - platformTake);
            
            // Find existing royalty split record
            const targetUserId = split.userId;

            const royaltySplit = await prisma.royaltySplit.findFirst({
              where: {
                releaseId,
                userId: targetUserId,
              },
            });

            if (royaltySplit) {
              // Check if payment for this period already exists
              const existingPayment = await prisma.royaltyPayment.findUnique({
                where: {
                  royaltySplitId_period: {
                    royaltySplitId: royaltySplit.id,
                    period,
                  },
                },
              });

              if (!existingPayment) {
                const payment = await prisma.royaltyPayment.create({
                  data: {
                    royaltySplitId: royaltySplit.id,
                    amount: netAmount,
                    currency: 'USD',
                    period,
                    totalStreams: releaseData.totalStreams,
                    qualifiedStreams: releaseData.totalStreams, // All streams in this calculation are qualified
                    status: 'PENDING',
                  },
                });
                createdPayments.push(payment);
              }
            }
          } catch (error) {
            console.error(`Error creating payment for user ${targetUserId}:`, error);
            errors.push(`Failed to create payment for user ${targetUserId}`);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      period,
      totalReleases: releaseRoyalties.size,
      totalStreams: qualifiedStreams.length,
      paymentsCreated: createdPayments.length,
      errors,
      summary: {
        totalRevenue: Array.from(releaseRoyalties.values()).reduce((sum, r) => sum + r.totalRevenue, 0),
        platformRevenue: Array.from(releaseRoyalties.values()).reduce((sum, r) => sum + r.totalRevenue, 0) * platformTake,
        creatorRevenue: Array.from(releaseRoyalties.values()).reduce((sum, r) => sum + r.totalRevenue, 0) * (1 - platformTake),
      },
    });

  } catch (error) {
    console.error('Calculate royalties error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid period format', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to calculate royalties' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period');
    const userId = searchParams.get('userId') || (session.user as any).id;

    const where: any = {};
    
    if (period) {
      where.period = period;
    }

    // If requesting specific user's royalties (only allow own data unless admin)
    if (userId !== (session.user as any).id) {
      // In production, add admin check here
    }

    const royaltyPayments = await prisma.royaltyPayment.findMany({
      where: {
        ...where,
        royaltySplit: {
          userId: userId,
        },
      },
      include: {
        royaltySplit: {
          include: {
            release: {
              select: {
                id: true,
                title: true,
                releaseType: true,
                coverArt: true,
              },
            },
            user: {
              select: {
                id: true,
                username: true,
                sciId: true,
              },
            },
          },
        },
      },
      orderBy: [
        { period: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      payments: royaltyPayments.map(payment => ({
        id: payment.id,
        period: payment.period,
        amount: parseFloat(payment.amount.toString()),
        currency: payment.currency,
        status: payment.status,
        totalStreams: payment.totalStreams,
        qualifiedStreams: payment.qualifiedStreams,
        createdAt: payment.createdAt,
        processedAt: payment.processedAt,
        release: payment.royaltySplit.release,
        percentage: parseFloat(payment.royaltySplit.percentage.toString()) * 100,
      })),
    });

  } catch (error) {
    console.error('Get royalties error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch royalty payments' },
      { status: 500 }
    );
  }
}







