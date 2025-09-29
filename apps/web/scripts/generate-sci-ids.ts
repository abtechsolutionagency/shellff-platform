
/**
 * Script to generate SCI IDs for existing users who don't have one
 */

import { PrismaClient } from '@prisma/client';
import { generateSciId } from '../lib/sci-id';

const prisma = new PrismaClient();

async function main() {
  console.log('Generating SCI IDs for existing users...');
  
  // Find users without SCI IDs
  const usersWithoutSciId = await prisma.user.findMany({
    where: {
      sciId: null
    },
    select: {
      id: true,
      email: true,
      username: true
    }
  });
  
  console.log(`Found ${usersWithoutSciId.length} users without SCI IDs`);
  
  // Generate and assign SCI IDs
  for (const user of usersWithoutSciId) {
    try {
      const sciId = await generateSciId();
      
      await prisma.user.update({
        where: { id: user.id },
        data: { sciId }
      });
      
      console.log(`✓ Generated SCI ID ${sciId} for ${user.email}`);
    } catch (error) {
      console.error(`✗ Failed to generate SCI ID for ${user.email}:`, error);
    }
  }
  
  console.log('SCI ID generation completed!');
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
