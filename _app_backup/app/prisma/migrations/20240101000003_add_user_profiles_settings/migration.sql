
-- Add user settings and profile fields
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "settings" JSONB DEFAULT '{}';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profilePicture" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "cloudStoragePath" TEXT;

-- Create user_settings table for more structured settings
CREATE TABLE IF NOT EXISTS "user_settings" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "theme" TEXT DEFAULT 'system',
  "language" TEXT DEFAULT 'en',
  "emailNotifications" BOOLEAN DEFAULT true,
  "pushNotifications" BOOLEAN DEFAULT true,
  "playlistPrivacy" TEXT DEFAULT 'public',
  "showOnlineStatus" BOOLEAN DEFAULT true,
  "autoPlayNext" BOOLEAN DEFAULT true,
  "highQualityAudio" BOOLEAN DEFAULT false,
  "downloadQuality" TEXT DEFAULT 'standard',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- Create index
CREATE UNIQUE INDEX IF NOT EXISTS "user_settings_userId_key" ON "user_settings"("userId");

-- Add foreign key constraint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create media table for file management
CREATE TABLE IF NOT EXISTS "media" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "cloudStoragePath" TEXT NOT NULL,
  "purpose" TEXT NOT NULL, -- 'avatar', 'track', 'album_art', etc.
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint for media
ALTER TABLE "media" ADD CONSTRAINT "media_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create index for media queries
CREATE INDEX IF NOT EXISTS "media_userId_purpose_idx" ON "media"("userId", "purpose");
CREATE INDEX IF NOT EXISTS "media_cloudStoragePath_idx" ON "media"("cloudStoragePath");
