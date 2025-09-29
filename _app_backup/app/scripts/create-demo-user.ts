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
          { username: username }
        ]
      }
    });

    if (existingUser) {
      console.log('⚠️  Demo user already exists!');
      console.log('📧 Email:', existingUser.email);
      console.log('👤 Username:', existingUser.username);
      console.log('🆔 User ID:', existingUser.userId);
      console.log('🎵 SCI ID:', existingUser.sciId || 'N/A (Listener)');
      console.log('📱 User Type:', existingUser.userType);
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
        username,
        firstName: 'Demo',
        lastName: 'User',
        userType: UserType.CREATOR,
        userId,
        sciId,
        isVerified: true,
        emailVerified: new Date(),
        bio: 'Demo user account for testing Shellff platform features'
      }
    });

    console.log('✅ Demo user created successfully!');
    console.log('📧 Email:', demoUser.email);
    console.log('👤 Username:', demoUser.username);
    console.log('🆔 User ID:', demoUser.userId);
    console.log('🎵 SCI ID:', demoUser.sciId);
    console.log('📱 User Type:', demoUser.userType);
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