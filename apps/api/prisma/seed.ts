import {
  DownloadFormat,
  DownloadStatus,
  FeatureFlagEnvironment,
  FeatureFlagRolloutType,
  PaymentProvider,
  PrismaClient,
  ReleaseAccessSource,
  ReleaseType,
  RoleType,
  TransactionStatus,
  TransactionType,
  UnlockCodeStatus,
  WalletType,
} from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';

import { hashPassword } from '../src/auth/password.util';

const prisma = new PrismaClient();

function generatePublicId(seed: string): string {
  const normalized = seed.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const digest = createHash('sha1').update(seed).digest('hex').toUpperCase();
  const prefix = (normalized || 'SHELLF').slice(0, 6).padEnd(6, 'X');
  const suffix = digest.slice(0, 4);
  return `USR-${prefix}-${suffix}`;
}

async function seedRoles() {
  const roles = [
    RoleType.LISTENER,
    RoleType.CREATOR,
    RoleType.ADMIN,
    RoleType.MODERATOR,
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role },
      update: {},
      create: { name: role },
    });
  }
}

async function seedFeatureFlags() {
  const flags = [
    {
      key: 'auth.signup',
      description: 'Enables public user registration.',
      enabled: true,
      rolloutType: FeatureFlagRolloutType.STATIC,
    },
    {
      key: 'creators.onboarding',
      description:
        'Allows listeners to request creator access and generates creator IDs.',
      enabled: false,
      rolloutType: FeatureFlagRolloutType.TARGETED,
    },
    {
      key: 'pwa.offline-shell',
      description: 'Serves offline-ready resources for the web PWA shell.',
      enabled: false,
      rolloutType: FeatureFlagRolloutType.PERCENTAGE,
    },
  ];

  for (const flag of flags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {
        description: flag.description,
        enabled: flag.enabled,
        rolloutType: flag.rolloutType,
      },
      create: flag,
    });
  }

  const onboardingFlag = await prisma.featureFlag.findUnique({
    where: { key: 'creators.onboarding' },
  });

  if (onboardingFlag) {
    await prisma.featureFlagOverride.upsert({
      where: {
        flagId_environment_userId: {
          flagId: onboardingFlag.id,
          environment: FeatureFlagEnvironment.LOCAL,
          userId: 'system',
        },
      },
      update: { value: true },
      create: {
        flagId: onboardingFlag.id,
        environment: FeatureFlagEnvironment.LOCAL,
        value: true,
        notes: 'Enable creator onboarding locally for development',
      },
    });
  }
}

async function seedUsers() {
  const users = [
    {
      email: 'listener@example.com',
      displayName: 'Listener Example',
      password: 'listenerPass123!',
      primaryRole: RoleType.LISTENER,
      roles: [RoleType.LISTENER],
    },
    {
      email: 'creator@example.com',
      displayName: 'Creator Example',
      password: 'creatorPass123!',
      primaryRole: RoleType.CREATOR,
      roles: [RoleType.LISTENER, RoleType.CREATOR],
    },
    {
      email: 'admin@example.com',
      displayName: 'Admin Example',
      password: 'adminPass123!',
      primaryRole: RoleType.ADMIN,
      roles: [RoleType.LISTENER, RoleType.ADMIN],
    },
  ];

  for (const entry of users) {
    const passwordHash = hashPassword(entry.password);

    const user = await prisma.user.upsert({
      where: { email: entry.email },
      update: {
        displayName: entry.displayName,
        passwordHash,
        primaryRole: entry.primaryRole,
      },
      create: {
        email: entry.email,
        displayName: entry.displayName,
        passwordHash,
        primaryRole: entry.primaryRole,
        publicId: generatePublicId(entry.email),
      },
    });

    if (!user.publicId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { publicId: generatePublicId(entry.email) },
      });
    }

    const roleRecords = await prisma.role.findMany({
      where: { name: { in: entry.roles } },
    });

    for (const role of roleRecords) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: role.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          roleId: role.id,
        },
      });
    }

    if (entry.roles.includes(RoleType.CREATOR)) {
      await prisma.creator.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          creatorCode: await generateCreatorCode(),
        },
      });
    }
  }
}

async function seedPaymentMethods() {
  const methods = [
    { provider: PaymentProvider.PAYSTACK, displayName: 'Paystack (NGN)' },
    { provider: PaymentProvider.OPAY, displayName: 'OPay Wallet' },
    { provider: PaymentProvider.STRIPE, displayName: 'Stripe (USD)' },
    { provider: PaymentProvider.MYFATOORAH, displayName: 'MyFatoorah (MENA)' },
    { provider: PaymentProvider.VOUCHER, displayName: 'Shellff Voucher' },
    { provider: PaymentProvider.ADMIN_CREDIT, displayName: 'Admin Credit' },
  ];

  for (const method of methods) {
    await prisma.paymentMethod.upsert({
      where: { provider: method.provider },
      update: { displayName: method.displayName, isEnabled: true },
      create: {
        provider: method.provider,
        displayName: method.displayName,
      },
    });
  }
}

async function seedReleaseArtifacts() {
  const creator = await prisma.user.findUnique({
    where: { email: 'creator@example.com' },
  });

  if (!creator) {
    return;
  }

  const release = await prisma.release.upsert({
    where: {
      creatorId_title: {
        creatorId: creator.id,
        title: 'Midnight Reflections',
      },
    },
    update: {
      description: 'Demo hybrid release used for unlock and download flows',
      coverArt:
        'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=640&q=80',
    },
    create: {
      creatorId: creator.id,
      title: 'Midnight Reflections',
      description: 'Demo hybrid release used for unlock and download flows',
      coverArt:
        'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=640&q=80',
      releaseType: ReleaseType.HYBRID,
    },
  });

  const existingTrack = await prisma.releaseTrack.findFirst({
    where: { releaseId: release.id, title: 'Aurora Skies' },
  });

  const track =
    existingTrack ??
    (await prisma.releaseTrack.create({
      data: {
        releaseId: release.id,
        title: 'Aurora Skies',
        duration: 215,
        position: 1,
        audioUrl: 'https://cdn.shellff.dev/audio/demo-aurora-skies.mp3',
      },
    }));

  const demoCodes = ['SHF-DEMO-0001', 'SHF-DEMO-0002', 'SHF-DEMO-0003'];

  for (const [index, code] of demoCodes.entries()) {
    await prisma.unlockCode.upsert({
      where: { code },
      update: {
        releaseId: release.id,
        creatorId: creator.id,
      },
      create: {
        code,
        releaseId: release.id,
        creatorId: creator.id,
        status: index === 0 ? UnlockCodeStatus.REDEEMED : UnlockCodeStatus.UNUSED,
        redeemedAt: index === 0 ? new Date() : null,
        redeemedBy: null,
      },
    });
  }

  const listener = await prisma.user.findUnique({
    where: { email: 'listener@example.com' },
  });

  if (!listener) {
    return;
  }

  const redeemedCode = await prisma.unlockCode.findUnique({
    where: { code: demoCodes[0] },
  });

  if (redeemedCode && redeemedCode.redeemedBy !== listener.id) {
    await prisma.unlockCode.update({
      where: { id: redeemedCode.id },
      data: {
        status: UnlockCodeStatus.REDEEMED,
        redeemedBy: listener.id,
        redeemedAt: new Date(),
      },
    });
  }

  await prisma.releaseAccess.upsert({
    where: {
      releaseId_userId: {
        releaseId: release.id,
        userId: listener.id,
      },
    },
    update: { source: ReleaseAccessSource.UNLOCK_CODE },
    create: {
      releaseId: release.id,
      userId: listener.id,
      source: ReleaseAccessSource.UNLOCK_CODE,
    },
  });

  if (redeemedCode) {
    const existingLog = await prisma.codeRedemptionLog.findFirst({
      where: {
        codeId: redeemedCode.id,
        userId: listener.id,
      },
    });

    if (!existingLog) {
      await prisma.codeRedemptionLog.create({
        data: {
          codeId: redeemedCode.id,
          userId: listener.id,
          success: true,
          redeemedAt: new Date(),
        },
      });
    }
  }

  await seedDownloadArtifacts({ releaseId: release.id, trackId: track.id, listenerId: listener.id });
}

async function seedWallets(
  seedUsers?: Array<{ id: string; email: string; publicId: string | null }>,
) {
  const targets =
    seedUsers ??
    (await prisma.user.findMany({
      select: { id: true, email: true, publicId: true },
    }));

  for (const user of targets) {
    const purchaseWallet = await prisma.wallet.upsert({
      where: {
        userId_type: {
          userId: user.id,
          type: WalletType.PURCHASES,
        },
      },
      update: {},
      create: {
        userId: user.id,
        type: WalletType.PURCHASES,
        balance: 25,
        currency: 'USD',
      },
    });

    await prisma.walletTransaction.upsert({
      where: {
        reference: `SEED-${purchaseWallet.id}`,
      },
      update: {},
      create: {
        walletId: purchaseWallet.id,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.COMPLETED,
        amount: 25,
        currency: 'USD',
        description: 'Seed purchase balance',
        reference: `SEED-${purchaseWallet.id}`,
        paymentProvider: PaymentProvider.ADMIN_CREDIT,
      },
    });

    await prisma.wallet.upsert({
      where: {
        userId_type: {
          userId: user.id,
          type: WalletType.EARNINGS,
        },
      },
      update: {},
      create: {
        userId: user.id,
        type: WalletType.EARNINGS,
        balance: 5,
        currency: 'SHC',
      },
    });
  }
}

async function seedDownloadArtifacts(options: {
  releaseId: string;
  trackId: string;
  listenerId: string;
}) {
  const existingBundle = await prisma.downloadBundle.findFirst({
    where: {
      releaseId: options.releaseId,
      userId: options.listenerId,
    },
  });

  const bundle =
    existingBundle ??
    (await prisma.downloadBundle.create({
      data: {
        releaseId: options.releaseId,
        userId: options.listenerId,
        status: DownloadStatus.READY,
        requestedAt: new Date(),
        completedAt: new Date(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
    }));

  const existingAsset = await prisma.downloadAsset.findFirst({
    where: {
      bundleId: bundle.id,
      trackId: options.trackId,
    },
  });

  if (!existingAsset) {
    await prisma.downloadAsset.create({
      data: {
        bundleId: bundle.id,
        trackId: options.trackId,
        format: DownloadFormat.MP3,
        quality: '320kbps',
        sizeBytes: 8_388_608,
        checksum: randomBytes(8).toString('hex'),
        downloadUrl: 'https://cdn.shellff.dev/downloads/demo-aurora-skies.mp3',
        status: DownloadStatus.READY,
      },
    });
  }
}

async function generateCreatorCode() {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const segments = Array.from({ length: 2 }, () =>
      randomBytes(2).toString('hex').toUpperCase(),
    );
    const code = `SHF-${segments[0]}-${segments[1]}`;

    const existing = await prisma.creator.findUnique({
      where: { creatorCode: code },
    });

    if (!existing) {
      return code;
    }
  }
}

async function main() {
  await seedRoles();
  await seedFeatureFlags();
  await seedUsers();
  await seedPaymentMethods();
  await seedWallets();
  await seedReleaseArtifacts();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Seed failed', error);
    await prisma.$disconnect();
    process.exit(1);
  });
