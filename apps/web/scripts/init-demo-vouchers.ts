import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

async function createDemoVouchers() {
  console.log('🎫 Creating demo vouchers...');

  try {
    const existingVouchers = await prisma.voucher.count();
    
    if (existingVouchers === 0) {
      const demoVouchers = [
        {
          code: 'WELCOME10',
          amount: 10,
          currency: 'USD',
          description: 'Welcome bonus - $10 free credits',
          usageLimit: 100,
          isActive: true
        },
        {
          code: 'TESTCODE',
          amount: 25,
          currency: 'USD', 
          description: 'Test voucher - $25 credits',
          usageLimit: 10,
          isActive: true
        },
        {
          code: 'PREMIUM50',
          amount: 50,
          currency: 'USD',
          description: 'Premium voucher - $50 credits', 
          usageLimit: 5,
          isActive: true
        }
      ];

      await prisma.voucher.createMany({
        data: demoVouchers
      });

      console.log('✅ Demo vouchers created:');
      demoVouchers.forEach(v => {
        console.log(`   - ${v.code}: $${v.amount} (${v.usageLimit} uses)`);
      });
    } else {
      console.log('ℹ️  Demo vouchers already exist');
    }
  } catch (error) {
    console.error('❌ Error creating demo vouchers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoVouchers();
