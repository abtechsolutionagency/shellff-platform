
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function seedDiscountSystem() {
  console.log('🌱 Seeding discount system...');

  try {
    // 1. Create admin discount configuration
    console.log('Creating admin discount configuration...');
    await prisma.adminDiscountConfiguration.upsert({
      where: { id: 'main-config' },
      update: {
        globalDiscountEnabled: true,
        maxStackableDiscounts: 3,
        discountCalculationOrder: 'priority',
        autoApplyBestDiscount: true,
        updatedBy: 'system'
      },
      create: {
        id: 'main-config',
        globalDiscountEnabled: true,
        maxStackableDiscounts: 3,
        discountCalculationOrder: 'priority',
        autoApplyBestDiscount: true,
        updatedBy: 'system'
      }
    });

    // 2. Get payment methods to create payment-specific discounts
    console.log('Fetching payment methods...');
    const paymentMethods = await prisma.paymentMethod.findMany();

    // 3. Create default discount rules
    console.log('Creating default discount rules...');

    // Global 5% discount for crypto payments
    await prisma.discountRule.upsert({
      where: { id: 'global-crypto-discount' },
      update: {
        name: 'Crypto Payment Discount',
        description: 'Get 5% off when paying with cryptocurrency',
        discountType: 'PERCENTAGE',
        target: 'GLOBAL',
        percentageDiscount: 0.05,
        purchaseTypes: JSON.stringify(['UNLOCK_CODES']),
        isActive: true,
        isStackable: false,
        priority: 10,
        createdBy: 'system'
      },
      create: {
        id: 'global-crypto-discount',
        name: 'Crypto Payment Discount',
        description: 'Get 5% off when paying with cryptocurrency',
        discountType: 'PERCENTAGE',
        target: 'GLOBAL',
        percentageDiscount: 0.05,
        purchaseTypes: JSON.stringify(['UNLOCK_CODES']),
        isActive: true,
        isStackable: false,
        priority: 10,
        createdBy: 'system'
      }
    });

    // Bulk order discount for unlock codes
    await prisma.discountRule.upsert({
      where: { id: 'bulk-order-discount' },
      update: {
        name: 'Bulk Order Discount',
        description: 'Tiered discounts for large orders',
        discountType: 'TIERED',
        target: 'PURCHASE_TYPE',
        tierBreakpoints: JSON.stringify([
          { min: 100, discount: 0.02 },   // 2% for 100+ codes
          { min: 500, discount: 0.05 },   // 5% for 500+ codes
          { min: 1000, discount: 0.08 },  // 8% for 1000+ codes
          { min: 5000, discount: 0.12 }   // 12% for 5000+ codes
        ]),
        purchaseTypes: JSON.stringify(['UNLOCK_CODES']),
        minQuantity: 100,
        isActive: true,
        isStackable: true,
        priority: 20,
        createdBy: 'system'
      },
      create: {
        id: 'bulk-order-discount',
        name: 'Bulk Order Discount',
        description: 'Tiered discounts for large orders',
        discountType: 'TIERED',
        target: 'PURCHASE_TYPE',
        tierBreakpoints: JSON.stringify([
          { min: 100, discount: 0.02 },   // 2% for 100+ codes
          { min: 500, discount: 0.05 },   // 5% for 500+ codes
          { min: 1000, discount: 0.08 },  // 8% for 1000+ codes
          { min: 5000, discount: 0.12 }   // 12% for 5000+ codes
        ]),
        purchaseTypes: JSON.stringify(['UNLOCK_CODES']),
        minQuantity: 100,
        isActive: true,
        isStackable: true,
        priority: 20,
        createdBy: 'system'
      }
    });

    // First-time buyer discount
    await prisma.discountRule.upsert({
      where: { id: 'first-time-buyer' },
      update: {
        name: 'First-Time Buyer Discount',
        description: '10% off your first unlock code purchase',
        discountType: 'PERCENTAGE',
        target: 'GLOBAL',
        percentageDiscount: 0.10,
        purchaseTypes: JSON.stringify(['UNLOCK_CODES']),
        maxUsagePerUser: 1,
        isActive: true,
        isStackable: false,
        priority: 30,
        createdBy: 'system'
      },
      create: {
        id: 'first-time-buyer',
        name: 'First-Time Buyer Discount',
        description: '10% off your first unlock code purchase',
        discountType: 'PERCENTAGE',
        target: 'GLOBAL',
        percentageDiscount: 0.10,
        purchaseTypes: JSON.stringify(['UNLOCK_CODES']),
        maxUsagePerUser: 1,
        isActive: true,
        isStackable: false,
        priority: 30,
        createdBy: 'system'
      }
    });

    // Large order fixed discount
    await prisma.discountRule.upsert({
      where: { id: 'large-order-fixed' },
      update: {
        name: 'Large Order Fixed Discount',
        description: '$50 off orders over $1000',
        discountType: 'FIXED_AMOUNT',
        target: 'PURCHASE_TYPE',
        fixedAmountDiscount: 50.00,
        purchaseTypes: JSON.stringify(['UNLOCK_CODES']),
        minOrderAmount: 1000.00,
        isActive: true,
        isStackable: false,
        priority: 15,
        createdBy: 'system'
      },
      create: {
        id: 'large-order-fixed',
        name: 'Large Order Fixed Discount',
        description: '$50 off orders over $1000',
        discountType: 'FIXED_AMOUNT',
        target: 'PURCHASE_TYPE',
        fixedAmountDiscount: 50.00,
        purchaseTypes: JSON.stringify(['UNLOCK_CODES']),
        minOrderAmount: 1000.00,
        isActive: true,
        isStackable: false,
        priority: 15,
        createdBy: 'system'
      }
    });

    // Buy 10 Get 1 Free promotion
    await prisma.discountRule.upsert({
      where: { id: 'buy-10-get-1-free' },
      update: {
        name: 'Buy 10 Get 1 Free',
        description: 'Get 1 free code for every 10 codes purchased',
        discountType: 'BUY_X_GET_Y',
        target: 'PURCHASE_TYPE',
        buyQuantity: 10,
        getQuantity: 1,
        purchaseTypes: JSON.stringify(['UNLOCK_CODES']),
        isActive: true,
        isStackable: true,
        priority: 5,
        createdBy: 'system'
      },
      create: {
        id: 'buy-10-get-1-free',
        name: 'Buy 10 Get 1 Free',
        description: 'Get 1 free code for every 10 codes purchased',
        discountType: 'BUY_X_GET_Y',
        target: 'PURCHASE_TYPE',
        buyQuantity: 10,
        getQuantity: 1,
        purchaseTypes: JSON.stringify(['UNLOCK_CODES']),
        isActive: true,
        isStackable: true,
        priority: 5,
        createdBy: 'system'
      }
    });

    // Create payment method specific discounts if payment methods exist
    for (const paymentMethod of paymentMethods) {
      if (paymentMethod.provider === 'CRYPTO_SOL') {
        const discountId = `payment-${paymentMethod.id.toLowerCase()}`;
        
        await prisma.discountRule.upsert({
          where: { id: discountId },
          update: {
            name: `${paymentMethod.name} Discount`,
            description: `Extra discount for using ${paymentMethod.name}`,
            discountType: 'PERCENTAGE',
            target: 'PAYMENT_METHOD',
            percentageDiscount: 0.03, // 3% discount
            paymentMethodId: paymentMethod.id,
            purchaseTypes: JSON.stringify(['UNLOCK_CODES']),
            isActive: true,
            isStackable: true,
            priority: 25,
            createdBy: 'system'
          },
          create: {
            id: discountId,
            name: `${paymentMethod.name} Discount`,
            description: `Extra discount for using ${paymentMethod.name}`,
            discountType: 'PERCENTAGE',
            target: 'PAYMENT_METHOD',
            percentageDiscount: 0.03, // 3% discount
            paymentMethodId: paymentMethod.id,
            purchaseTypes: JSON.stringify(['UNLOCK_CODES']),
            isActive: true,
            isStackable: true,
            priority: 25,
            createdBy: 'system'
          }
        });
      }
    }

    console.log('✅ Discount system seeded successfully!');
    
    // Display summary
    const discountRulesCount = await prisma.discountRule.count();
    const activeRulesCount = await prisma.discountRule.count({
      where: { isActive: true }
    });

    console.log(`\n📊 Discount System Summary:`);
    console.log(`   Total Discount Rules: ${discountRulesCount}`);
    console.log(`   Active Discount Rules: ${activeRulesCount}`);
    console.log(`   Payment Method Discounts: ${paymentMethods.length}`);

  } catch (error) {
    console.error('❌ Error seeding discount system:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedDiscountSystem();
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
