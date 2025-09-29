
import { PrismaClient, UserType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateUserId, generateSciId } from '../lib/sci-id';
import { generateUniqueCode } from '../lib/utils/codeGenerator';

const prisma = new PrismaClient();

async function main() {
  console.log('ðŸŒ± Starting database seeding...');

  // Clear existing data first (handle foreign key constraints)
  console.log('ðŸ§¹ Clearing existing data...');
  await prisma.unlockCode.deleteMany({});
  await prisma.releaseTrack.deleteMany({});
  await prisma.release.deleteMany({});
  await prisma.codePricingTier.deleteMany({});
  await prisma.user.deleteMany({});

  // Create main admin account
  const adminPassword = await bcrypt.hash('admin123', 12);
  
  const mainAdmin = await prisma.user.create({
    data: {
      email: 'admin@shellff.com',
      passwordHash: adminPassword,
      username: 'admin_shellff',
      firstName: 'Admin',
      lastName: 'User',
      userType: UserType.ADMIN,
      userId: await generateUserId(),
      bio: 'Main administrator for Shellff platform',
      isVerified: true,
    },
  });

  // Create demo listener account
  const listenerPassword = await bcrypt.hash('listener123', 12);
  
  const demoListener = await prisma.user.create({
    data: {
      email: 'listener@shellff.com',
      passwordHash: listenerPassword,
      username: 'demo_listener',
      firstName: 'Demo',
      lastName: 'Listener',
      userType: UserType.LISTENER,
      userId: await generateUserId(),
      bio: 'Demo listener account for testing Shellff platform',
      isVerified: true,
    },
  });

  // Create demo creator account
  const creatorPassword = await bcrypt.hash('creator123', 12);
  
  const demoCreator = await prisma.user.create({
    data: {
      email: 'creator@shellff.com',
      passwordHash: creatorPassword,
      username: 'demo_creator',
      firstName: 'Demo',
      lastName: 'Creator',
      userType: UserType.CREATOR,
      userId: await generateUserId(),
      sciId: await generateSciId(),
      bio: 'Demo creator account for testing Shellff platform',
      isVerified: true,
    },
  });

  // Seed pricing tiers for unlock codes
  console.log('ðŸŽ« Creating unlock code pricing tiers...');
  
  // Create default pricing tiers
  const pricingTiers = [
    {
      minQuantity: 1,
      maxQuantity: 999,
      pricePerCode: 50.00, // $50 each
      currency: 'USD',
      createdBy: mainAdmin.userId, // Admin user
      isActive: true,
    },
    {
      minQuantity: 1000,
      maxQuantity: 4999,
      pricePerCode: 30.00, // $30 each
      currency: 'USD', 
      createdBy: mainAdmin.userId, // Admin user
      isActive: true,
    },
    {
      minQuantity: 5000,
      maxQuantity: null, // No upper limit
      pricePerCode: 20.00, // $20 each
      currency: 'USD',
      createdBy: mainAdmin.userId, // Admin user
      isActive: true,
    }
  ];

  for (const tier of pricingTiers) {
    await prisma.codePricingTier.create({ data: tier });
  }

  // Create sample releases and unlock codes for testing
  console.log('ðŸŽµ Creating sample releases and unlock codes...');
  
  // Create a sample release
  const sampleRelease = await prisma.release.create({
    data: {
      title: "Midnight Reflections",
      description: "A collection of ambient electronic tracks perfect for late night listening",
      releaseType: "ALBUM",
      physicalUnlockEnabled: true,
      creatorId: demoCreator.id,
      releaseDate: new Date(),
      publishingFee: 100.00,
      publishingFeeStatus: "PAID",
      status: "PUBLISHED",
      coverArt: "https://images.unsplash.com/photo-1629923759854-156b88c433aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpYyUyMGFsYnVtJTIwY292ZXIlMjB2aW55bHxlbnwxfHx8fDE3NTc5OTg0MzB8MA&ixlib=rb-4.1.0&q=80&w=1080",
      totalTracks: 1,
      totalDuration: 240,
    }
  });

  // Create sample tracks for the releases
  await prisma.releaseTrack.create({
    data: {
      title: "Starlight Dreams",
      duration: 240,
      trackNumber: 1,
      releaseId: sampleRelease.id,
      audioFile: "/audio/starlight-dreams.mp3",
    }
  });

  // Create sample unlock codes
  const sampleCodes = Array.from({ length: 3 }, () => ({
    code: generateUniqueCode(),
    releaseId: sampleRelease.id,
  }));

  for (const codeData of sampleCodes) {
    await prisma.unlockCode.create({
      data: {
        code: codeData.code,
        releaseId: codeData.releaseId,
        creatorId: demoCreator.userId,
        status: "unused",
      }
    });
  }

  console.log('âœ… Seeding completed successfully');
  console.log('ðŸ“Š Created demo users:');
  console.log('\nðŸ”‘ ADMIN ACCOUNT:');
  console.log(`   - Admin: ${mainAdmin.email} (${mainAdmin.userType}) - Password: admin123`);
  
  console.log('\nðŸŽ§ LISTENER ACCOUNT:');
  console.log(`   - Listener: ${demoListener.email} (${demoListener.userType}) - Password: listener123`);
  
  console.log('\nðŸŽµ CREATOR ACCOUNT:');
  console.log(`   - Creator: ${demoCreator.email} (${demoCreator.userType}) - Password: creator123`);
}

main()
  .catch((e) => {
    console.error('âŒ Seeding failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });






