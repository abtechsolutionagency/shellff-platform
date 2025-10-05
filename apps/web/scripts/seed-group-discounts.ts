import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding group discounts...');

  try {
    // Fallback: groupDiscount model doesn't exist
    console.log('⚠️  Group discount functionality not available - model does not exist');
    console.log('Group discount seeding skipped');
    
  } catch (error) {
    console.error('Error seeding group discounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});