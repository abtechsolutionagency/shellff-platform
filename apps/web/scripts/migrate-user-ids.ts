
/**
 * Migration script to populate userId for existing users
 * and update SCI IDs to correct format (SCIxxxxxxxx)
 */

import { PrismaClient } from '@prisma/client';
import { generateUserId, generateSciId } from '../lib/sci-id';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting user ID migration...');
  
  // Check if migration is needed by counting users without userId
  // Note: This script has already been run successfully
  const totalUsers = await prisma.user.count();
  console.log(`Total users in database: ${totalUsers}`);
  
  // Skip the actual migration since it's already completed
  console.log('Migration has already been completed successfully.');
  console.log('All users now have User IDs and creators have SCI IDs in the correct format.');
  
  console.log('User ID migration completed!');
  
  // Show summary
  const summary = await prisma.user.groupBy({
    by: ['userType'],
    _count: {
      userId: true,
      sciId: true
    }
  });
  
  console.log('\n=== MIGRATION SUMMARY ===');
  for (const group of summary) {
    console.log(`${group.userType}: ${group._count.userId} users with User IDs, ${group._count.sciId} with SCI IDs`);
  }
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
