import { FeatureFlagRolloutType, PrismaClient, RoleType } from '@prisma/client';

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
}

async function main() {
  await seedRoles();
  await seedFeatureFlags();
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
