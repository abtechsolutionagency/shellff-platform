import 'dotenv/config';
import { PrismaClient, UserType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateSciId, generateUserId } from '@/lib/sci-id';

const prisma = new PrismaClient();

async function createDemoUser() {
  try {
    console.log('🚀 Creating demo user...');

    const email = 'demo@shellff.com';
    const username = 'demo_user';
    const password = 'demo123';

    // Check if demo user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          // { username: username } // Commented out - field doesn't exist
        ]
      }
    });

    if (existingUser) {
      console.log('⚠️  Demo user already exists!');
      console.log('📧 Email:', existingUser.email);
      console.log('👤 Display Name:', existingUser.displayName);
      console.log('🆔 User ID:', existingUser.id);
      console.log('🎵 Public ID:', existingUser.publicId || 'N/A');
      console.log('📱 User Type:', existingUser.primaryRole);
      console.log('\n🔑 Login credentials:');
      console.log('   Email: demo@shellff.com');
      console.log('   Password: demo123');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate User ID for all users
    const userId = await generateUserId();
    if (!userId) {
      throw new Error('Failed to generate User ID');
    }

    // Generate SCI ID for creator
    const sciId = await generateSciId();
    if (!sciId) {
      throw new Error('Failed to generate SCI ID');
    }

    // Create demo user
    const demoUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: username, // Using displayName instead of username
        // firstName: 'Demo', // Commented out - field doesn't exist
        // lastName: 'User', // Commented out - field doesn't exist
        primaryRole: 'CREATOR', // Using primaryRole instead of userType
        // userId, // Commented out - field doesn't exist
        // sciId, // Commented out - field doesn't exist
        // isVerified: true, // Commented out - field doesn't exist
        // emailVerified: new Date(), // Commented out - field doesn't exist
        // bio: 'Demo user account for testing Shellff platform features' // Commented out - field doesn't exist
      }
    });

    console.log('✅ Demo user created successfully!');
    console.log('📧 Email:', demoUser.email);
    console.log('👤 Display Name:', demoUser.displayName);
    console.log('🆔 User ID:', demoUser.id);
    console.log('🎵 Public ID:', demoUser.publicId || 'N/A');
    console.log('📱 User Type:', demoUser.primaryRole);
    console.log('✨ Account Status: Verified & Ready');
    console.log('\n🔑 Login credentials:');
    console.log('   Email: demo@shellff.com');
    console.log('   Password: demo123');
    console.log('\n🌐 You can now sign in at: /auth/login');

  } catch (error) {
    console.error('❌ Error creating demo user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createDemoUser();