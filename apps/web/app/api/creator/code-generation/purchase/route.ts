
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { PricingCalculator } from '@/lib/utils/pricingCalculator';
import { generateBatchCodes } from '@/lib/utils/codeGenerator';
import { NetworkHandlers } from '@/lib/crypto/networkHandlers';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { userType: true, userId: true, wallets: true }
    });

    if (!user || user.userType !== 'CREATOR') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { quantity, releaseId, paymentMethod, networkId } = body;

    // Validate required fields
    if (!quantity || !releaseId || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify release ownership and physical unlock enabled
    const release = await prisma.release.findFirst({
      where: {
        id: releaseId,
        creatorId: user.userId,
        physicalUnlockEnabled: true
      }
    });

    if (!release) {
      return NextResponse.json({ 
        error: 'Release not found or physical unlock codes not enabled' 
      }, { status: 404 });
    }

    // Calculate pricing
    const pricing = PricingCalculator.calculatePricing(quantity);
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (paymentMethod === 'wallet') {
      // Handle wallet payment
      return await handleWalletPayment(user.userId, batchId, pricing, quantity, releaseId);
    } else if (paymentMethod === 'crypto') {
      // Handle crypto payment
      if (!networkId) {
        return NextResponse.json({ error: 'Network ID required for crypto payment' }, { status: 400 });
      }
      
      return await handleCryptoPayment(user.userId, batchId, pricing, quantity, releaseId, networkId);
    } else {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

  } catch (error) {
    console.error('Code purchase error:', error);
    return NextResponse.json(
      { error: 'Failed to process purchase' }, 
      { status: 500 }
    );
  }
}

async function handleWalletPayment(
  creatorId: string, 
  batchId: string, 
  pricing: any, 
  quantity: number, 
  releaseId: string
) {
  try {
    // Find creator's purchases wallet
    const wallet = await prisma.wallet.findFirst({
      where: {
        userId: creatorId,
        type: 'PURCHASES',
        isActive: true
      }
    });

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    // Check sufficient balance (converting to proper decimal comparison)
    const walletBalance = Number(wallet.balance);
    if (walletBalance < pricing.totalCost) {
      return NextResponse.json({ 
        error: 'Insufficient wallet balance',
        required: pricing.totalCost,
        available: walletBalance
      }, { status: 400 });
    }

    // Create payment transaction record
    const paymentTransaction = await prisma.codePaymentTransaction.create({
      data: {
        creatorId,
        batchId,
        paymentMethod: 'wallet',
        networkType: null,
        amountUsd: pricing.totalCost,
        confirmationStatus: 'confirmed' // Wallet payments are instant
      }
    });

    // Deduct from wallet
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: pricing.totalCost } }
    });

    // Create wallet transaction record
    await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'PURCHASE',
        status: 'COMPLETED',
        amount: -pricing.totalCost,
        currency: 'USD',
        description: `Purchase ${quantity} unlock codes for release`,
        reference: batchId,
        paymentProvider: 'ADMIN_CREDIT'
      }
    });

    // Generate unlock codes
    const codes = generateBatchCodes(quantity);
    
    // Save codes to database
    const codeData = codes.map((code: string) => ({
      code: code,
      releaseId,
      creatorId,
      batchId,
      costPerCode: pricing.pricePerCode,
      codePaymentTransactionId: paymentTransaction.id
    }));

    await prisma.unlockCode.createMany({
      data: codeData
    });

    return NextResponse.json({
      success: true,
      data: {
        batchId,
        paymentTransactionId: paymentTransaction.id,
        quantity,
        totalCost: pricing.totalCost,
        paymentMethod: 'wallet',
        status: 'completed',
        codes: codes
      }
    });

  } catch (error) {
    console.error('Wallet payment error:', error);
    throw error;
  }
}

async function handleCryptoPayment(
  creatorId: string,
  batchId: string,
  pricing: any,
  quantity: number,
  releaseId: string,
  networkId: string
) {
  try {
    // Validate network
    const network = await prisma.supportedNetwork.findFirst({
      where: {
        networkName: networkId,
        isEnabled: true
      }
    });

    if (!network) {
      return NextResponse.json({ error: 'Network not supported' }, { status: 400 });
    }

    // Generate payment address
    const paymentAddress = await NetworkHandlers.generatePaymentAddress(
      networkId, 
      pricing.totalCost, 
      batchId
    );

    // Create pending payment transaction
    const paymentTransaction = await prisma.codePaymentTransaction.create({
      data: {
        creatorId,
        batchId,
        paymentMethod: 'crypto',
        networkType: networkId,
        supportedNetworkId: network.id,
        amountUsd: pricing.totalCost,
        paymentAddress: paymentAddress.address,
        confirmationStatus: 'pending'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        batchId,
        paymentTransactionId: paymentTransaction.id,
        quantity,
        totalCost: pricing.totalCost,
        paymentMethod: 'crypto',
        network: networkId,
        paymentAddress: paymentAddress.address,
        qrCode: paymentAddress.qrCode,
        instructions: paymentAddress.instructions,
        expiresAt: paymentAddress.expiresAt,
        status: 'awaiting_payment'
      }
    });

  } catch (error) {
    console.error('Crypto payment error:', error);
    throw error;
  }
}
