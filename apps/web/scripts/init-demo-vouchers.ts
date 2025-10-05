import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Initializing demo vouchers...');

  try {
    // Fallback: voucher model doesn't exist
    console.log('⚠️  Voucher functionality not available - model does not exist');
    console.log('Demo vouchers initialization skipped');
    
  } catch (error) {
    console.error('Error initializing demo vouchers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});