
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const streamSchema = z.object({
  releaseTrackId: z.string(),
  streamDuration: z.number().min(1),
  totalTrackDuration: z.number().min(1),
  deviceType: z.string().optional(),
  location: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = streamSchema.parse(body);

    // Get S2E configuration
    const s2eConfig = await prisma.s2EConfiguration.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    // If S2E is disabled, just log the stream without rewards
    if (!s2eConfig || !s2eConfig.isEnabled) {
      await prisma.streamingStats.create({
        data: {
          releaseTrackId: validatedData.releaseTrackId,
          listenerId: (session.user as any).id,
          streamDuration: validatedData.streamDuration,
          isQualified: false,
          rewardAmount: 0,
          rewardCurrency: 'SHC',
          deviceType: validatedData.deviceType,
          location: validatedData.location,
        },
      });

      return NextResponse.json({
        qualified: false,
        rewardAmount: 0,
        message: 'Stream logged (S2E disabled)',
      });
    }

    // Check if stream qualifies for rewards
    const streamPercentage = validatedData.streamDuration / validatedData.totalTrackDuration;
    const meetsMinDuration = validatedData.streamDuration >= s2eConfig.minStreamDuration;
    const meetsMinPercentage = streamPercentage >= parseFloat(s2eConfig.minStreamPercentage.toString());
    
    let isQualified = meetsMinDuration && meetsMinPercentage;
    let rewardAmount = 0;

    if (isQualified) {
      // Check daily limits
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Get or create daily stats
      const dailyStats = await prisma.dailyS2EStats.findUnique({
        where: {
          userId_date: {
            userId: (session.user as any).id,
            date: today,
          },
        },
      });

      // Check if user has hit daily reward cap
      const currentDailyRewards = dailyStats ? parseFloat(dailyStats.totalRewards.toString()) : 0;
      if (currentDailyRewards >= parseFloat(s2eConfig.dailyRewardCap.toString())) {
        isQualified = false;
      }

      // Check max streams per track per day
      if (isQualified) {
        const todayStreamsForTrack = await prisma.streamingStats.count({
          where: {
            releaseTrackId: validatedData.releaseTrackId,
            listenerId: (session.user as any).id,
            isQualified: true,
            timestamp: {
              gte: new Date(today + 'T00:00:00.000Z'),
              lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000),
            },
          },
        });

        if (todayStreamsForTrack >= s2eConfig.maxStreamsPerTrack) {
          isQualified = false;
        }
      }

      // Calculate reward
      if (isQualified) {
        rewardAmount = parseFloat(s2eConfig.rewardPerStream.toString());
        
        // Ensure we don't exceed daily cap
        if (currentDailyRewards + rewardAmount > parseFloat(s2eConfig.dailyRewardCap.toString())) {
          rewardAmount = parseFloat(s2eConfig.dailyRewardCap.toString()) - currentDailyRewards;
        }
      }
    }

    // Record the stream
    const streamRecord = await prisma.streamingStats.create({
      data: {
        releaseTrackId: validatedData.releaseTrackId,
        listenerId: (session.user as any).id,
        streamDuration: validatedData.streamDuration,
        isQualified,
        rewardAmount: rewardAmount || 0,
        rewardCurrency: 'SHC',
        deviceType: validatedData.deviceType,
        location: validatedData.location,
      },
    });

    // If qualified and earning rewards, update wallet and daily stats
    if (isQualified && rewardAmount > 0) {
      await prisma.$transaction(async (tx: any) => {
        // Get or create S2E wallet
        let wallet = await tx.wallet.findFirst({
          where: {
            userId: (session.user as any).id,
            type: 'EARNINGS',
            isActive: true,
          },
        });

        if (!wallet) {
          wallet = await tx.wallet.create({
            data: {
              userId: (session.user as any).id,
              type: 'EARNINGS',
              currency: 'SHC',
              balance: 0,
              isActive: true,
            },
          });
        }

        // Add reward to wallet
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: {
              increment: rewardAmount,
            },
          },
        });

        // Record transaction
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: 'EARNING',
            status: 'COMPLETED',
            amount: rewardAmount,
            currency: 'SHC',
            description: 'Stream-to-Earn reward',
            reference: `s2e-${streamRecord.id}`,
            metadata: {
              streamId: streamRecord.id,
              trackId: validatedData.releaseTrackId,
            },
            completedAt: new Date(),
          },
        });

        // Update daily stats
        const today = new Date().toISOString().split('T')[0];
        await tx.dailyS2EStats.upsert({
          where: {
            userId_date: {
              userId: (session.user as any).id,
              date: today,
            },
          },
          create: {
            userId: (session.user as any).id,
            date: today,
            totalStreams: 1,
            qualifiedStreams: 1,
            totalRewards: rewardAmount,
            rewardsCapped: false,
          },
          update: {
            totalStreams: {
              increment: 1,
            },
            qualifiedStreams: {
              increment: 1,
            },
            totalRewards: {
              increment: rewardAmount,
            },
          },
        });
      });
    }

    return NextResponse.json({
      qualified: isQualified,
      rewardAmount: rewardAmount,
      currency: 'SHC',
      message: isQualified 
        ? `Earned ${rewardAmount} SHC for streaming!`
        : 'Stream logged but not qualified for rewards',
    });

  } catch (error) {
    console.error('Stream S2E error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid stream data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to process stream' },
      { status: 500 }
    );
  }
}
