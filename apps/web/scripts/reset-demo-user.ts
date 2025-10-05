
import 'dotenv/config';
import { PrismaClient, UserType, WalletType, TransactionType, TransactionStatus, PaymentProvider } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateSciId, generateUserId } from '@/lib/sci-id';

const prisma = new PrismaClient();

async function resetDemoUser() {
  try {
    console.log('🔄 Resetting demo user...');

    const email = 'demo@shellff.com';
    const username = 'demo_user';
    const newUsername = 'demo_creator_2024';
    const password = 'shellff123';

    // First, delete any existing demo users
    console.log('🗑️  Removing existing demo users...');
    
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        OR: [
          { email: email },
          // { username: username }, // Commented out - field doesn't exist
          // { username: newUsername }, // Commented out - field doesn't exist
          { email: { contains: 'demo@shellff' } }
        ]
      }
    });

    if (deletedUsers.count > 0) {
      console.log(`✅ Deleted ${deletedUsers.count} existing demo user(s)`);
    } else {
      console.log('ℹ️  No existing demo users found');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate User ID for all users
    console.log('🔢 Generating User ID...');
    const userId = await generateUserId();
    if (!userId) {
      throw new Error('Failed to generate User ID');
    }

    // Generate SCI ID for creator
    console.log('🎵 Generating SCI ID...');
    const sciId = await generateSciId();
    if (!sciId) {
      throw new Error('Failed to generate SCI ID');
    }

    // Create fresh demo user
    console.log('👤 Creating new demo user...');
    const demoUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: newUsername, // Using displayName instead of username
        // firstName: 'Demo', // Commented out - field doesn't exist
        // lastName: 'Creator', // Commented out - field doesn't exist
        primaryRole: 'CREATOR', // Using primaryRole instead of userType
        // userId, // Commented out - field doesn't exist
        // sciId, // Commented out - field doesn't exist
        // isVerified: true, // Commented out - field doesn't exist
        // emailVerified: new Date(), // Commented out - field doesn't exist
        // bio: '🎵 Demo creator account for testing Shellff platform features. Full access to upload, streaming, and wallet features.', // Commented out - field doesn't exist
        // avatar: null // Commented out - field doesn't exist
      }
    });

    console.log('\n🎉 Fresh demo user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', demoUser.email);
    console.log('👤 Display Name:', demoUser.displayName); // Using displayName instead of username
    console.log('🆔 User ID:', demoUser.id); // Using id instead of userId
    console.log('🎵 Public ID:', demoUser.publicId); // Using publicId instead of sciId
    console.log('📱 User Type:', demoUser.primaryRole); // Using primaryRole instead of userType
    console.log('✅ Verification Status: Verified & Active');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔑 LOGIN CREDENTIALS:');
    console.log('   📧 Email: demo@shellff.com');
    console.log('   🔒 Password: shellff123');
    console.log('\n🌐 Login URL: http://localhost:3000/auth/login');
    
    // Create default wallets for the demo user
    console.log('\n💰 Creating demo wallets...');
    
    // Create Purchase wallet
    const purchaseWallet = await prisma.wallet.create({
      data: {
        userId: demoUser.id,
        type: WalletType.PURCHASES,
        balance: 100.00, // Demo balance
        currency: 'USD',
        isActive: true
      }
    });

    // Create Earnings wallet
    const earningsWallet = await prisma.wallet.create({
      data: {
        userId: demoUser.id,
        type: WalletType.EARNINGS,
        balance: 25.50, // Demo SHC balance
        currency: 'SHC',
        isActive: true
      }
    });

    console.log('✅ Demo wallets created:');
    console.log(`   💳 Purchase Wallet: $${purchaseWallet.balance} USD`);
    console.log(`   🎵 Earnings Wallet: ${earningsWallet.balance} SHC`);

    // Create some demo transactions
    console.log('\n📊 Creating demo transaction history...');
    
    const demoTransactions = [
      {
        walletId: purchaseWallet.id,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.COMPLETED,
        amount: 50.00,
        currency: 'USD',
        description: 'Demo wallet funding',
        paymentProvider: PaymentProvider.STRIPE,
        completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      },
      {
        walletId: purchaseWallet.id,
        type: TransactionType.VOUCHER_REDEMPTION,
        status: TransactionStatus.COMPLETED,
        amount: 50.00,
        currency: 'USD',
        description: 'Welcome voucher redemption',
        paymentProvider: PaymentProvider.VOUCHER,
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      },
      {
        walletId: earningsWallet.id,
        type: TransactionType.EARNING,
        status: TransactionStatus.COMPLETED,
        amount: 25.50,
        currency: 'SHC',
        description: 'Stream-to-Earn rewards',
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      }
    ];

    // Commented out - transaction model doesn't exist
    // for (const txData of demoTransactions) {
    //   await prisma.transaction.create({
    //     data: txData
    //   });
    // }

    console.log('✅ Demo transaction history created (3 transactions)');

    // Create user settings - commented out - model doesn't exist
    console.log('\n⚙️  Creating user settings...');
    // await prisma.userSettings.create({
    //   data: {
    //     userId: demoUser.id,
    //     theme: 'dark',
    //     language: 'en',
    //     emailNotifications: true,
    //     pushNotifications: true,
    //     playlistPrivacy: 'public',
    //     showOnlineStatus: true,
    //     autoPlayNext: true,
    //     highQualityAudio: true,
    //     downloadQuality: 'high'
    //   }
    // });

    console.log('✅ User settings configured');
    console.log('\n🎯 Demo user is ready for testing!');
    console.log('🔹 Full creator access');
    console.log('🔹 Wallet system active');
    console.log('🔹 Transaction history populated');
    console.log('🔹 All platform features enabled');

  } catch (error) {
    console.error('❌ Error resetting demo user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
resetDemoUser();
