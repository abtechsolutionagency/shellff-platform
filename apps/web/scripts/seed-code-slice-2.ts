import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding code pricing tiers...');

  try {
    // Fallback: codePricingTier model doesn't exist
    console.log('⚠️  Code pricing tier functionality not available - model does not exist');
    console.log('Code pricing tier seeding skipped');
    
  } catch (error) {
    console.error('Error seeding code pricing tiers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});