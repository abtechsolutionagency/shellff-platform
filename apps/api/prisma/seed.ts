import {
  FeatureFlagEnvironment,
  FeatureFlagRolloutType,
  PrismaClient,
  RoleType,
} from '@prisma/client';
import { randomBytes } from 'node:crypto';

import { hashPassword } from '../src/auth/password.util';

const prisma = new PrismaClient();

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
          userId: null,
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
      },
    });

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
