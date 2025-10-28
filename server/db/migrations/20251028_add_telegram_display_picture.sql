/**
 * migration.sql - Apply schema updates
 * - Ensure users table has telegramId column (text)
 */

-- Add telegramId if missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS "telegramId" text;
CREATE INDEX IF NOT EXISTS idx_users_telegramId ON users("telegramId");

-- Add displayPicture if missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS "displayPicture" text;
CREATE INDEX IF NOT EXISTS idx_users_displayPicture ON users("displayPicture");
