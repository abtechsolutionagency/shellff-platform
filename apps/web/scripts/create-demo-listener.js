
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Generate User ID
function generateUserId() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `USR${timestamp}${random}`;
}

async function createDemoListener() {
  try {
    console.log('🔍 Checking existing demo users...');
    
    const existingUsers = await prisma.user.findMany({
      where: { 
        email: { contains: 'demo' }
      },
      select: { 
        email: true, 
        firstName: true, 
        lastName: true, 
        userType: true, 
        userId: true, 
        sciId: true,
        username: true 
      }
    });
    
    console.log('Existing demo users:', existingUsers);
    
    // Check if demo listener already exists
    const existingListener = await prisma.user.findUnique({
      where: { email: 'listener@shellff.com' }
    });
    
    if (existingListener) {
      console.log('✅ Demo listener already exists:', existingListener.email);
      return existingListener;
    }

    console.log('🎯 Creating new demo listener...');
    
    // Generate unique User ID
    let userId = generateUserId();
    let attempts = 0;
    
    while (attempts < 10) {
      const existing = await prisma.user.findUnique({
        where: { userId },
      });
      
      if (!existing) break;
      
      userId = generateUserId();
      attempts++;
    }
    
    if (attempts >= 10) {
      throw new Error('Unable to generate unique User ID');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('demo123', 12);

    // Create the demo listener
    const demoListener = await prisma.user.create({
      data: {
        email: 'listener@shellff.com',
        passwordHash: hashedPassword,
        firstName: 'Demo',
        lastName: 'Listener',
        username: 'demo_listener',
        userType: 'LISTENER',
        userId: userId,
        isVerified: true,
        emailVerified: new Date(),
      },
    });

    console.log('✅ Demo listener created successfully!');
    console.log({
      email: demoListener.email,
      password: 'demo123',
      username: demoListener.username,
      userType: demoListener.userType,
      userId: demoListener.userId,
      name: `${demoListener.firstName} ${demoListener.lastName}`
    });

    return demoListener;
    
  } catch (error) {
    console.error('❌ Error creating demo listener:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  createDemoListener()
    .then(() => {
      console.log('🎉 Demo listener creation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to create demo listener:', error);
      process.exit(1);
    });
}

module.exports = { createDemoListener };
