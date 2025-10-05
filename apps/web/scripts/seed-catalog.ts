import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding music catalog...');

  try {
    // Fallback: tag model doesn't exist
    console.log('⚠️  Tag functionality not available - model does not exist');
    console.log('Music catalog seeding skipped');
    
  } catch (error) {
    console.error('Error seeding catalog:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
    process.exit(1);
  });