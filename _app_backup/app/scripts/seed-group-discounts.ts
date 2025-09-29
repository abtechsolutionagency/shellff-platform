
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedGroupDiscounts() {
  console.log('🌱 Seeding default group discounts...');

  const defaultDiscounts = [
    {
      name: 'Family Pack 15% Off',
      discountType: 'percentage',
      discountValue: 15,
      minMembers: 2,
      maxMembers: 6,
      packType: 'family',
      isActive: true
    },
    {
      name: 'Friends Pack 10% Off',
      discountType: 'percentage',
      discountValue: 10,
      minMembers: 3,
      maxMembers: 10,
      packType: 'friends',
      isActive: true
    },
    {
      name: 'Bulk Purchase 25% Off',
      discountType: 'percentage',
      discountValue: 25,
      minMembers: 20,
      maxMembers: 50,
      packType: 'bulk',
      isActive: true
    },
    {
      name: 'Corporate Volume Discount',
      discountType: 'percentage',
      discountValue: 30,
      minMembers: 50,
      maxMembers: null,
      packType: 'corporate',
      isActive: true
    },
    {
      name: 'Early Bird 20% Off',
      discountType: 'percentage',
      discountValue: 20,
      minMembers: 2,
      maxMembers: null,
      packType: null, // Applies to all pack types
      isActive: true,
      validUntil: new Date('2025-12-31') // Example expiration
    },
    {
      name: 'Small Group $5 Off',
      discountType: 'fixed_amount',
      discountValue: 5,
      minMembers: 2,
      maxMembers: 5,
      packType: null,
      isActive: true
    }
  ];

  for (const discount of defaultDiscounts) {
    try {
      const existingDiscount = await prisma.groupDiscount.findFirst({
        where: { name: discount.name }
      });

      if (!existingDiscount) {
        await prisma.groupDiscount.create({
          data: {
            ...discount,
            discountValue: discount.discountValue
          }
        });
        console.log(`✅ Created discount: ${discount.name}`);
      } else {
        console.log(`⏭️  Skipped existing discount: ${discount.name}`);
      }
    } catch (error) {
      console.error(`❌ Error creating discount ${discount.name}:`, error);
    }
  }

  console.log('🌱 Group discounts seeding completed!');
}

async function main() {
  try {
    await seedGroupDiscounts();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export default seedGroupDiscounts;
