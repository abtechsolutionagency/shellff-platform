DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReleaseAccessSource') THEN
    CREATE TYPE "ReleaseAccessSource" AS ENUM ('UNLOCK_CODE', 'PURCHASE', 'ADMIN_GRANT');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "code_pricing_tiers" (
  "id" TEXT PRIMARY KEY,
  "minQuantity" INTEGER NOT NULL,
  "maxQuantity" INTEGER,
  "pricePerCode" DECIMAL(10,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "createdBy" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "code_pricing_tiers_minQuantity_idx" ON "code_pricing_tiers"("minQuantity");
CREATE INDEX IF NOT EXISTS "code_pricing_tiers_isActive_idx" ON "code_pricing_tiers"("isActive");

CREATE TABLE IF NOT EXISTS "supported_networks" (
  "id" TEXT PRIMARY KEY,
  "networkName" TEXT NOT NULL,
  "networkDisplayName" TEXT NOT NULL,
  "isEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
  "adminWalletAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "supported_networks_networkName_key" ON "supported_networks"("networkName");
CREATE INDEX IF NOT EXISTS "supported_networks_isEnabled_idx" ON "supported_networks"("isEnabled");

CREATE TABLE IF NOT EXISTS "code_payment_transactions" (
  "id" TEXT PRIMARY KEY,
  "creatorId" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "paymentMethod" TEXT NOT NULL,
  "networkType" TEXT,
  "supportedNetworkId" TEXT,
  "amountUsd" DECIMAL(10,2) NOT NULL,
  "paymentAddress" TEXT,
  "transactionHash" TEXT,
  "confirmationStatus" TEXT NOT NULL DEFAULT 'pending',
  "confirmations" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "confirmedAt" TIMESTAMP(3),
  CONSTRAINT "code_payment_transactions_creatorId_fkey"
    FOREIGN KEY ("creatorId") REFERENCES "users"("userId") ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT "code_payment_transactions_supportedNetworkId_fkey"
    FOREIGN KEY ("supportedNetworkId") REFERENCES "supported_networks"("id") ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "code_payment_transactions_batchId_key" ON "code_payment_transactions"("batchId");
CREATE INDEX IF NOT EXISTS "code_payment_transactions_creatorId_idx" ON "code_payment_transactions"("creatorId");
CREATE INDEX IF NOT EXISTS "code_payment_transactions_status_idx" ON "code_payment_transactions"("confirmationStatus");

CREATE TABLE IF NOT EXISTS "group_code_packs" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "releaseId" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "packType" TEXT NOT NULL DEFAULT 'family',
  "maxMembers" INTEGER NOT NULL DEFAULT 5,
  "currentMembers" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "originalPrice" DECIMAL(10,2) NOT NULL,
  "discountedPrice" DECIMAL(10,2) NOT NULL,
  "discountPercentage" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "group_code_packs_releaseId_fkey"
    FOREIGN KEY ("releaseId") REFERENCES "releases"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "group_code_packs_creatorId_fkey"
    FOREIGN KEY ("creatorId") REFERENCES "users"("userId") ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "group_code_packs_releaseId_idx" ON "group_code_packs"("releaseId");
CREATE INDEX IF NOT EXISTS "group_code_packs_creatorId_idx" ON "group_code_packs"("creatorId");
CREATE INDEX IF NOT EXISTS "group_code_packs_packType_idx" ON "group_code_packs"("packType");
CREATE INDEX IF NOT EXISTS "group_code_packs_isActive_idx" ON "group_code_packs"("isActive");

CREATE TABLE IF NOT EXISTS "group_discounts" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "discountType" TEXT NOT NULL,
  "discountValue" DECIMAL(10,2) NOT NULL,
  "minMembers" INTEGER NOT NULL DEFAULT 2,
  "maxMembers" INTEGER,
  "packType" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "validUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "group_discounts_discountType_idx" ON "group_discounts"("discountType");
CREATE INDEX IF NOT EXISTS "group_discounts_minMembers_idx" ON "group_discounts"("minMembers");
CREATE INDEX IF NOT EXISTS "group_discounts_packType_idx" ON "group_discounts"("packType");
CREATE INDEX IF NOT EXISTS "group_discounts_isActive_idx" ON "group_discounts"("isActive");

CREATE TABLE IF NOT EXISTS "unlock_codes" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL,
  "releaseId" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'unused',
  "redeemedBy" TEXT,
  "redeemedAt" TIMESTAMP(3),
  "batchId" TEXT,
  "costPerCode" DECIMAL(10,2),
  "codePaymentTransactionId" TEXT,
  "deviceLockedTo" TEXT,
  "ipLockedTo" TEXT,
  "groupPackId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "unlock_codes_releaseId_fkey"
    FOREIGN KEY ("releaseId") REFERENCES "releases"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "unlock_codes_creatorId_fkey"
    FOREIGN KEY ("creatorId") REFERENCES "users"("userId") ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT "unlock_codes_redeemedBy_fkey"
    FOREIGN KEY ("redeemedBy") REFERENCES "users"("userId") ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "unlock_codes_transaction_fkey"
    FOREIGN KEY ("codePaymentTransactionId") REFERENCES "code_payment_transactions"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "unlock_codes_groupPack_fkey"
    FOREIGN KEY ("groupPackId") REFERENCES "group_code_packs"("id") ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "unlock_codes_code_key" ON "unlock_codes"("code");
CREATE INDEX IF NOT EXISTS "unlock_codes_releaseId_idx" ON "unlock_codes"("releaseId");
CREATE INDEX IF NOT EXISTS "unlock_codes_creatorId_idx" ON "unlock_codes"("creatorId");
CREATE INDEX IF NOT EXISTS "unlock_codes_status_idx" ON "unlock_codes"("status");
CREATE INDEX IF NOT EXISTS "unlock_codes_batchId_idx" ON "unlock_codes"("batchId");
CREATE INDEX IF NOT EXISTS "unlock_codes_deviceLockedTo_idx" ON "unlock_codes"("deviceLockedTo");
CREATE INDEX IF NOT EXISTS "unlock_codes_ipLockedTo_idx" ON "unlock_codes"("ipLockedTo");
CREATE INDEX IF NOT EXISTS "unlock_codes_groupPackId_idx" ON "unlock_codes"("groupPackId");

CREATE TABLE IF NOT EXISTS "code_redemption_logs" (
  "id" TEXT PRIMARY KEY,
  "codeId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "deviceFingerprint" TEXT,
  "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "success" BOOLEAN NOT NULL,
  CONSTRAINT "code_redemption_logs_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "unlock_codes"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "code_redemption_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "code_redemption_logs_codeId_idx" ON "code_redemption_logs"("codeId");
CREATE INDEX IF NOT EXISTS "code_redemption_logs_userId_idx" ON "code_redemption_logs"("userId");
CREATE INDEX IF NOT EXISTS "code_redemption_logs_redeemedAt_idx" ON "code_redemption_logs"("redeemedAt");
CREATE INDEX IF NOT EXISTS "code_redemption_logs_deviceFingerprint_idx" ON "code_redemption_logs"("deviceFingerprint");

CREATE TABLE IF NOT EXISTS "security_configuration" (
  "id" TEXT PRIMARY KEY,
  "deviceLockingEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
  "ipLockingEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
  "allowDeviceChange" BOOLEAN NOT NULL DEFAULT TRUE,
  "deviceChangeLimit" INTEGER NOT NULL DEFAULT 3,
  "maxRedemptionAttempts" INTEGER NOT NULL DEFAULT 10,
  "rateLimitWindowHours" INTEGER NOT NULL DEFAULT 1,
  "fraudDetectionEnabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "suspiciousAttemptThreshold" INTEGER NOT NULL DEFAULT 5,
  "blockSuspiciousIPs" BOOLEAN NOT NULL DEFAULT TRUE,
  "autoBlockDuration" INTEGER NOT NULL DEFAULT 24,
  "updatedBy" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "code_redemption_rate_limits" (
  "id" TEXT PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "identifierType" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 1,
  "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "windowEnd" TIMESTAMP(3) NOT NULL,
  "blocked" BOOLEAN NOT NULL DEFAULT FALSE,
  "blockedUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "code_redemption_rate_limits_identifier_identifierType_key"
  ON "code_redemption_rate_limits"("identifier", "identifierType");
CREATE INDEX IF NOT EXISTS "code_redemption_rate_limits_identifier_idx" ON "code_redemption_rate_limits"("identifier");
CREATE INDEX IF NOT EXISTS "code_redemption_rate_limits_windowEnd_idx" ON "code_redemption_rate_limits"("windowEnd");
CREATE INDEX IF NOT EXISTS "code_redemption_rate_limits_blocked_idx" ON "code_redemption_rate_limits"("blocked");

CREATE TABLE IF NOT EXISTS "fraud_detection_logs" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "ipAddress" TEXT,
  "deviceFingerprint" TEXT,
  "attemptedCodes" TEXT[] NOT NULL,
  "detectionReason" TEXT NOT NULL,
  "flaggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved" BOOLEAN NOT NULL DEFAULT FALSE,
  "resolvedAt" TIMESTAMP(3),
  "resolvedBy" TEXT,
  "notes" TEXT
);

CREATE INDEX IF NOT EXISTS "fraud_detection_logs_userId_idx" ON "fraud_detection_logs"("userId");
CREATE INDEX IF NOT EXISTS "fraud_detection_logs_ipAddress_idx" ON "fraud_detection_logs"("ipAddress");
CREATE INDEX IF NOT EXISTS "fraud_detection_logs_deviceFingerprint_idx" ON "fraud_detection_logs"("deviceFingerprint");
CREATE INDEX IF NOT EXISTS "fraud_detection_logs_flaggedAt_idx" ON "fraud_detection_logs"("flaggedAt");
CREATE INDEX IF NOT EXISTS "fraud_detection_logs_resolved_idx" ON "fraud_detection_logs"("resolved");

CREATE TABLE IF NOT EXISTS "pack_members" (
  "id" TEXT PRIMARY KEY,
  "packId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'member',
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "inviteCode" TEXT,
  "invitedBy" TEXT,
  "hasRedeemed" BOOLEAN NOT NULL DEFAULT FALSE,
  "redeemedAt" TIMESTAMP(3),
  "redeemedCodeId" TEXT,
  CONSTRAINT "pack_members_packId_fkey" FOREIGN KEY ("packId") REFERENCES "group_code_packs"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "pack_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "pack_members_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "users"("userId") ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "pack_members_redeemedCodeId_fkey" FOREIGN KEY ("redeemedCodeId") REFERENCES "unlock_codes"("id") ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "pack_members_packId_userId_key" ON "pack_members"("packId", "userId");
CREATE UNIQUE INDEX IF NOT EXISTS "pack_members_inviteCode_key" ON "pack_members"("inviteCode");
CREATE INDEX IF NOT EXISTS "pack_members_packId_idx" ON "pack_members"("packId");
CREATE INDEX IF NOT EXISTS "pack_members_userId_idx" ON "pack_members"("userId");
CREATE INDEX IF NOT EXISTS "pack_members_role_idx" ON "pack_members"("role");
CREATE INDEX IF NOT EXISTS "pack_members_isActive_idx" ON "pack_members"("isActive");

CREATE TABLE IF NOT EXISTS "release_access" (
  "id" TEXT PRIMARY KEY,
  "releaseId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "source" "ReleaseAccessSource" NOT NULL DEFAULT 'UNLOCK_CODE',
  "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "release_access_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "releases"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "release_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "release_access_releaseId_userId_key" ON "release_access"("releaseId", "userId");
CREATE INDEX IF NOT EXISTS "release_access_userId_idx" ON "release_access"("userId");

ALTER TABLE "purchases"
  ADD COLUMN IF NOT EXISTS "releaseId" TEXT;

DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'purchases_releaseId_fkey'
      AND table_name = 'purchases'
  ) THEN
    ALTER TABLE "purchases"
      ADD CONSTRAINT "purchases_releaseId_fkey"
      FOREIGN KEY ("releaseId") REFERENCES "releases"("id") ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $;

