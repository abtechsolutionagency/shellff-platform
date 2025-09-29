-- Prisma migration for Shellff Slice 0 baseline
-- Establishes identity, role management, audit logging, and feature flag tables.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "RoleType" AS ENUM ('LISTENER', 'CREATOR', 'ADMIN', 'MODERATOR');
CREATE TYPE "FeatureFlagRolloutType" AS ENUM ('STATIC', 'PERCENTAGE', 'TARGETED');
CREATE TYPE "FeatureFlagEnvironment" AS ENUM ('LOCAL', 'STAGING', 'PRODUCTION');

CREATE TABLE "User" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL UNIQUE,
    "phone" TEXT UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "primaryRole" "RoleType" NOT NULL DEFAULT 'LISTENER',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "Role" (
    "id" SERIAL PRIMARY KEY,
    "name" "RoleType" NOT NULL UNIQUE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "UserRole" (
    "userId" UUID NOT NULL,
    "roleId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId", "roleId"),
    CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

CREATE TABLE "Creator" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL UNIQUE,
    "creatorCode" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "Creator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AuditLog" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "actorUserId" UUID,
    "actorType" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "target" TEXT,
    "metadata" JSONB,
    "requestId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");
CREATE INDEX "AuditLog_event_idx" ON "AuditLog"("event");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

CREATE TABLE "FeatureFlag" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT FALSE,
    "rolloutType" "FeatureFlagRolloutType" NOT NULL DEFAULT 'STATIC',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "FeatureFlagOverride" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "flagId" UUID NOT NULL,
    "userId" UUID,
    "environment" "FeatureFlagEnvironment" NOT NULL DEFAULT 'LOCAL',
    "value" BOOLEAN NOT NULL DEFAULT FALSE,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "FeatureFlagOverride_flagId_fkey" FOREIGN KEY ("flagId") REFERENCES "FeatureFlag"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeatureFlagOverride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "FeatureFlagOverride_flagId_idx" ON "FeatureFlagOverride"("flagId");
CREATE INDEX "FeatureFlagOverride_userId_idx" ON "FeatureFlagOverride"("userId");
CREATE UNIQUE INDEX "FeatureFlagOverride_unique_scope" ON "FeatureFlagOverride"("flagId", "environment", "userId");

-- Trigger to maintain updatedAt columns
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_user_updated_at
BEFORE UPDATE ON "User"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_role_updated_at
BEFORE UPDATE ON "Role"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_feature_flag_updated_at
BEFORE UPDATE ON "FeatureFlag"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
