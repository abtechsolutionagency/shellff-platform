import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding discount system...');

  try {
    // Fallback: adminDiscountConfiguration model doesn't exist
    console.log('⚠️  Discount system functionality not available - model does not exist');
    console.log('Discount system seeding skipped');
    
  } catch (error) {
    console.error('Error seeding discount system:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});