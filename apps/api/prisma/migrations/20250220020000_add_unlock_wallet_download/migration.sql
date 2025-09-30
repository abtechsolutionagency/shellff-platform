-- Adds wallet, download, release, and unlock tables plus supporting enums
-- Extends User with a publicId for cross-application identifiers.

CREATE TYPE "ReleaseType" AS ENUM ('DIGITAL', 'PHYSICAL', 'HYBRID');
CREATE TYPE "UnlockCodeStatus" AS ENUM ('UNUSED', 'REDEEMED', 'REVOKED');
CREATE TYPE "ReleaseAccessSource" AS ENUM ('PURCHASE', 'UNLOCK_CODE', 'ADMIN_GRANT');
CREATE TYPE "WalletType" AS ENUM ('PURCHASES', 'EARNINGS');
CREATE TYPE "TransactionType" AS ENUM (
  'DEPOSIT',
  'WITHDRAWAL',
  'PURCHASE',
  'EARNING',
  'TRANSFER',
  'FEE',
  'REFUND',
  'VOUCHER_REDEMPTION'
);
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED');
CREATE TYPE "PaymentProvider" AS ENUM ('PAYSTACK', 'OPAY', 'STRIPE', 'MYFATOORAH', 'CRYPTO_SOL', 'VOUCHER', 'ADMIN_CREDIT');
CREATE TYPE "DownloadStatus" AS ENUM ('PENDING', 'PREPARING', 'READY', 'FAILED');
CREATE TYPE "DownloadFormat" AS ENUM ('MP3', 'FLAC', 'WAV');

ALTER TABLE "User" ADD COLUMN "publicId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_publicId_key" ON "User"("publicId");

CREATE TABLE "Release" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "creatorId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "coverArt" TEXT,
  "releaseType" "ReleaseType" NOT NULL DEFAULT 'DIGITAL',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Release_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Release_creatorId_title_key" ON "Release"("creatorId", "title");
CREATE INDEX "Release_creatorId_idx" ON "Release"("creatorId");

CREATE TABLE "ReleaseTrack" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "releaseId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "duration" INTEGER,
  "position" INTEGER NOT NULL DEFAULT 0,
  "audioUrl" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ReleaseTrack_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ReleaseTrack_releaseId_idx" ON "ReleaseTrack"("releaseId");

CREATE TABLE "UnlockCode" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL UNIQUE,
  "releaseId" UUID NOT NULL,
  "creatorId" UUID NOT NULL,
  "status" "UnlockCodeStatus" NOT NULL DEFAULT 'UNUSED',
  "redeemedBy" UUID,
  "redeemedAt" TIMESTAMPTZ,
  "batchId" TEXT,
  "deviceLockedTo" TEXT,
  "ipLockedTo" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "UnlockCode_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UnlockCode_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UnlockCode_redeemedBy_fkey" FOREIGN KEY ("redeemedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "UnlockCode_releaseId_idx" ON "UnlockCode"("releaseId");
CREATE INDEX "UnlockCode_creatorId_idx" ON "UnlockCode"("creatorId");
CREATE INDEX "UnlockCode_status_idx" ON "UnlockCode"("status");
CREATE INDEX "UnlockCode_batchId_idx" ON "UnlockCode"("batchId");

CREATE TABLE "CodeRedemptionLog" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "codeId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "deviceFingerprint" TEXT,
  "success" BOOLEAN NOT NULL DEFAULT FALSE,
  "redeemedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "CodeRedemptionLog_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "UnlockCode"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CodeRedemptionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "CodeRedemptionLog_codeId_idx" ON "CodeRedemptionLog"("codeId");
CREATE INDEX "CodeRedemptionLog_userId_idx" ON "CodeRedemptionLog"("userId");
CREATE INDEX "CodeRedemptionLog_redeemedAt_idx" ON "CodeRedemptionLog"("redeemedAt");

CREATE TABLE "ReleaseAccess" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "releaseId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "source" "ReleaseAccessSource" NOT NULL DEFAULT 'UNLOCK_CODE',
  "grantedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "expiresAt" TIMESTAMPTZ,
  CONSTRAINT "ReleaseAccess_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ReleaseAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ReleaseAccess_releaseId_userId_key" ON "ReleaseAccess"("releaseId", "userId");
CREATE INDEX "ReleaseAccess_userId_idx" ON "ReleaseAccess"("userId");

CREATE TABLE "Wallet" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "type" "WalletType" NOT NULL,
  "balance" NUMERIC(20,8) NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Wallet_userId_type_key" ON "Wallet"("userId", "type");
CREATE INDEX "Wallet_userId_idx" ON "Wallet"("userId");

CREATE TABLE "WalletTransaction" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "walletId" UUID NOT NULL,
  "type" "TransactionType" NOT NULL,
  "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
  "amount" NUMERIC(20,8) NOT NULL,
  "currency" TEXT NOT NULL,
  "description" TEXT,
  "reference" TEXT UNIQUE,
  "paymentProvider" "PaymentProvider",
  "metadata" JSONB DEFAULT '{}'::jsonb,
  "fee" NUMERIC(20,8),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "completedAt" TIMESTAMPTZ,
  CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "WalletTransaction_walletId_idx" ON "WalletTransaction"("walletId");
CREATE INDEX "WalletTransaction_status_idx" ON "WalletTransaction"("status");
CREATE INDEX "WalletTransaction_type_idx" ON "WalletTransaction"("type");
CREATE INDEX "WalletTransaction_createdAt_idx" ON "WalletTransaction"("createdAt");

CREATE TABLE "PaymentMethod" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "provider" "PaymentProvider" NOT NULL UNIQUE,
  "displayName" TEXT NOT NULL,
  "isEnabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "settings" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "DownloadBundle" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "releaseId" UUID NOT NULL,
  "status" "DownloadStatus" NOT NULL DEFAULT 'PENDING',
  "requestedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "completedAt" TIMESTAMPTZ,
  "expiresAt" TIMESTAMPTZ,
  CONSTRAINT "DownloadBundle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DownloadBundle_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "DownloadBundle_userId_idx" ON "DownloadBundle"("userId");
CREATE INDEX "DownloadBundle_releaseId_idx" ON "DownloadBundle"("releaseId");

CREATE TABLE "DownloadAsset" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "bundleId" UUID NOT NULL,
  "trackId" UUID,
  "format" "DownloadFormat" NOT NULL,
  "quality" TEXT,
  "sizeBytes" INTEGER,
  "checksum" TEXT,
  "downloadUrl" TEXT,
  "status" "DownloadStatus" NOT NULL DEFAULT 'PREPARING',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "DownloadAsset_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "DownloadBundle"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DownloadAsset_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "ReleaseTrack"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "DownloadAsset_bundleId_idx" ON "DownloadAsset"("bundleId");
CREATE INDEX "DownloadAsset_trackId_idx" ON "DownloadAsset"("trackId");

CREATE TRIGGER set_release_updated_at
BEFORE UPDATE ON "Release"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_unlock_code_updated_at
BEFORE UPDATE ON "UnlockCode"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_wallet_updated_at
BEFORE UPDATE ON "Wallet"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_wallet_transaction_updated_at
BEFORE UPDATE ON "WalletTransaction"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
