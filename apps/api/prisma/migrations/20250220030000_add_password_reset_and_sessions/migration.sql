-- Adds password reset tokens plus session and device metadata tables
-- Extends RefreshToken to reference user sessions for device-aware audits.

CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED', 'TERMINATED');

ALTER TABLE "RefreshToken" ADD COLUMN "sessionId" UUID;

DROP INDEX IF EXISTS "RefreshToken_tokenHash_idx";
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

CREATE TABLE "PasswordResetToken" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "consumedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "createdByIp" TEXT,
  "consumedByIp" TEXT,
  "userAgent" TEXT,
  CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");
CREATE INDEX "PasswordResetToken_userId_consumedAt_idx" ON "PasswordResetToken"("userId", "consumedAt");

CREATE TABLE "UserDevice" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "fingerprint" TEXT,
  "deviceName" TEXT,
  "deviceType" TEXT,
  "platform" TEXT,
  "osVersion" TEXT,
  "appVersion" TEXT,
  "pushToken" TEXT,
  "trusted" BOOLEAN NOT NULL DEFAULT TRUE,
  "firstSeenAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "lastSeenAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "UserDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "UserDevice_userId_idx" ON "UserDevice"("userId");
CREATE INDEX "UserDevice_fingerprint_idx" ON "UserDevice"("fingerprint");
CREATE INDEX "UserDevice_pushToken_idx" ON "UserDevice"("pushToken");
CREATE INDEX "UserDevice_userId_trusted_idx" ON "UserDevice"("userId", "trusted");

CREATE TABLE "UserSession" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "deviceId" UUID,
  "sessionTokenHash" TEXT NOT NULL,
  "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "location" JSONB,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "lastSeenAt" TIMESTAMPTZ,
  "signedOutAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserSession_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "UserDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "UserSession_sessionTokenHash_key" ON "UserSession"("sessionTokenHash");
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");
CREATE INDEX "UserSession_deviceId_idx" ON "UserSession"("deviceId");
CREATE INDEX "UserSession_status_idx" ON "UserSession"("status");
CREATE INDEX "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");
CREATE INDEX "UserSession_userId_status_expiresAt_idx" ON "UserSession"("userId", "status", "expiresAt");

ALTER TABLE "RefreshToken"
  ADD CONSTRAINT "RefreshToken_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "UserSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "RefreshToken_sessionId_idx" ON "RefreshToken"("sessionId");

CREATE TRIGGER set_password_reset_token_updated_at
BEFORE UPDATE ON "PasswordResetToken"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_user_device_updated_at
BEFORE UPDATE ON "UserDevice"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_user_session_updated_at
BEFORE UPDATE ON "UserSession"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
