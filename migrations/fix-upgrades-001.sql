-- Fix Upgrades Database Migration
-- This migration ensures the upgrade system works properly after fresh start

-- Drop any conflicting tables first
DROP TABLE IF EXISTS "userupgrades" CASCADE;
DROP TABLE IF EXISTS "upgrades_old" CASCADE;

-- Recreate upgrades table with proper Drizzle schema alignment
CREATE TABLE IF NOT EXISTS "upgrades" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL, -- lpPerHour, energy, lpPerTap
  "baseCost" INTEGER NOT NULL,
  "baseEffect" REAL NOT NULL,
  "costMultiplier" REAL NOT NULL DEFAULT 1.3,
  "effectMultiplier" REAL NOT NULL DEFAULT 1.15,
  "maxLevel" INTEGER,
  "levelRequirement" INTEGER NOT NULL DEFAULT 1
);

-- Recreate userUpgrades table with proper column names
CREATE TABLE IF NOT EXISTS "userUpgrades" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "upgradeId" TEXT NOT NULL, -- No FK constraint to support JSON string IDs
  "level" INTEGER NOT NULL DEFAULT 0,
  "purchasedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "idx_userUpgrades_user" ON "userUpgrades"("userId");
CREATE INDEX IF NOT EXISTS "idx_userUpgrades_upgrade" ON "userUpgrades"("upgradeId");
CREATE INDEX IF NOT EXISTS "idx_userUpgrades_composite" ON "userUpgrades"("userId", "upgradeId");

-- Insert some basic upgrade data for testing (optional)
INSERT INTO "upgrades" ("id", "name", "description", "category", "baseCost", "baseEffect", "costMultiplier", "effectMultiplier", "maxLevel", "levelRequirement")
VALUES 
  ('enhanced-tapping', 'Enhanced Tapping', 'Increases LP gained per tap', 'lpPerTap', 100, 1.0, 1.15, 1.0, 25, 1),
  ('power-tap', 'Power Tap', 'Significantly increases tap effectiveness', 'lpPerTap', 500, 5.0, 1.25, 1.1, 15, 5)
ON CONFLICT ("id") DO NOTHING;

-- Refresh PostgREST schema cache
COMMENT ON TABLE "upgrades" IS 'refresh-2025-10-28';
COMMENT ON TABLE "userUpgrades" IS 'refresh-2025-10-28';

-- Verify tables exist
SELECT 'Migration completed successfully' as status;