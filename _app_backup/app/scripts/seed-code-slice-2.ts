import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function seedCodeSlice2() {
  try {
    console.log('🌱 Seeding Code Slice 2: Code Generation & Pricing...');

    // Seed default pricing tiers
    const pricingTiers = [
      {
        minQuantity: 1,
        maxQuantity: 999,
        pricePerCode: 50,
        currency: 'USD',
        createdBy: 'system',
        isActive: true
      },
      {
        minQuantity: 1000,
        maxQuantity: 4999,
        pricePerCode: 30,
        currency: 'USD',
        createdBy: 'system',
        isActive: true
      },
      {
        minQuantity: 5000,
        maxQuantity: null,
        pricePerCode: 20,
        currency: 'USD',
        createdBy: 'system',
        isActive: true
      }
    ];

    console.log('Creating default pricing tiers...');
    for (const tier of pricingTiers) {
      const existing = await prisma.codePricingTier.findFirst({
        where: { minQuantity: tier.minQuantity }
      });
      
      if (!existing) {
        await prisma.codePricingTier.create({
          data: tier
        });
        console.log(`  ✅ Created pricing tier: ${tier.minQuantity}-${tier.maxQuantity || '∞'} codes at $${tier.pricePerCode} each`);
      } else {
        console.log(`  ⏭  Pricing tier already exists: ${tier.minQuantity}-${tier.maxQuantity || '∞'} codes`);
      }
    }

    // Seed supported networks
    const networks = [
      {
        networkName: 'TRC20',
        networkDisplayName: 'Tron (TRC20)',
        isEnabled: true,
        adminWalletAddress: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE'
      },
      {
        networkName: 'BEP20',
        networkDisplayName: 'Binance Smart Chain (BEP20)',
        isEnabled: true,
        adminWalletAddress: '0x742d35Cc6634C0532925a3b8D23B15F2d5FA7F34'
      },
      {
        networkName: 'TON',
        networkDisplayName: 'The Open Network',
        isEnabled: false,
        adminWalletAddress: null
      },
      {
        networkName: 'SOLANA',
        networkDisplayName: 'Solana Network',
        isEnabled: false,
        adminWalletAddress: null
      }
    ];

    console.log('Creating supported networks...');
    for (const network of networks) {
      const existing = await prisma.supportedNetwork.findFirst({
        where: { networkName: network.networkName }
      });
      
      if (!existing) {
        await prisma.supportedNetwork.create({
          data: network
        });
        console.log(`  ✅ Created network: ${network.networkDisplayName} (${network.isEnabled ? 'enabled' : 'disabled'})`);
      } else {
        console.log(`  ⏭  Network already exists: ${network.networkDisplayName}`);
      }
    }

    console.log('✅ Code Slice 2 seeding completed!');
    console.log('📊 Created pricing tiers: 3 tiers from $50 to $20 per code');
    console.log('🌐 Created crypto networks: 4 networks (2 enabled by default)');

  } catch (error) {
    console.error('❌ Code Slice 2 seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedCodeSlice2();
