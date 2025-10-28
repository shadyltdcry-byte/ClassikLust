-- Fix userUpgrades to use TEXT userId instead of UUID
-- This aligns with your telegram-based auth system

-- Step 1: Drop the foreign key constraint first
ALTER TABLE "userUpgrades" DROP CONSTRAINT IF EXISTS "userUpgrades_userId_users_id_fk";

-- Step 2: Change userId column from UUID to TEXT
ALTER TABLE "userUpgrades" ALTER COLUMN "userId" TYPE TEXT;

-- Step 3: Update any existing records (if any) - this handles edge cases
-- UPDATE "userUpgrades" SET "userId" = 'telegram_' || "userId" WHERE "userId" NOT LIKE 'telegram_%';

-- Step 4: Refresh schema cache
COMMENT ON TABLE "userUpgrades" IS 'userId now TEXT for telegram IDs';

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'userUpgrades' AND column_name = 'userId';