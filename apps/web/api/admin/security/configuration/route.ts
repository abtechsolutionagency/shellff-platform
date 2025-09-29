
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminUserOrThrow } from '@/lib/admin-auth';

export async function GET() {
  try {
    const adminUser = await getAdminUserOrThrow();

    let config = await prisma.securityConfiguration.findFirst();
    
    if (!config) {
      config = await prisma.securityConfiguration.create({
        data: {
          updatedBy: adminUser.id,
        },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Security configuration fetch error:', error);
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch security configuration' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminUser = await getAdminUserOrThrow();

    const body = await request.json();
    const {
      deviceLockingEnabled,
      ipLockingEnabled,
      allowDeviceChange,
      deviceChangeLimit,
      maxRedemptionAttempts,
      rateLimitWindowHours,
      fraudDetectionEnabled,
      suspiciousAttemptThreshold,
      blockSuspiciousIPs,
      autoBlockDuration,
    } = body;

    // Validate input
    if (typeof deviceLockingEnabled !== 'boolean' || 
        typeof ipLockingEnabled !== 'boolean' ||
        typeof allowDeviceChange !== 'boolean' ||
        typeof fraudDetectionEnabled !== 'boolean' ||
        typeof blockSuspiciousIPs !== 'boolean') {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    if (deviceChangeLimit < 1 || maxRedemptionAttempts < 1 || 
        rateLimitWindowHours < 1 || suspiciousAttemptThreshold < 1 || 
        autoBlockDuration < 1) {
      return NextResponse.json({ error: 'Numeric values must be positive' }, { status: 400 });
    }

    const config = await prisma.securityConfiguration.upsert({
      where: { id: body.id || '' },
      update: {
        deviceLockingEnabled,
        ipLockingEnabled,
        allowDeviceChange,
        deviceChangeLimit,
        maxRedemptionAttempts,
        rateLimitWindowHours,
        fraudDetectionEnabled,
        suspiciousAttemptThreshold,
        blockSuspiciousIPs,
        autoBlockDuration,
        updatedBy: adminUser.id,
        updatedAt: new Date(),
      },
      create: {
        deviceLockingEnabled,
        ipLockingEnabled,
        allowDeviceChange,
        deviceChangeLimit,
        maxRedemptionAttempts,
        rateLimitWindowHours,
        fraudDetectionEnabled,
        suspiciousAttemptThreshold,
        blockSuspiciousIPs,
        autoBlockDuration,
        updatedBy: adminUser.id,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Security configuration update error:', error);
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to update security configuration' },
      { status: 500 }
    );
  }
}
