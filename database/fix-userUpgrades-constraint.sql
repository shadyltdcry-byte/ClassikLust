-- Fix for userUpgrades constraint issue
-- This resolves the "no unique or exclusion constraint matching the ON CONFLICT specification" error
-- Run this SQL in your Supabase SQL editor to fix upgrade purchase errors

-- 1. First, check if the constraint already exists
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
  AND table_name = 'userUpgrades' 
  AND constraint_type = 'UNIQUE';

-- 2. Add the missing unique constraint for userId + upgradeId
-- This allows UPSERT operations (INSERT ... ON CONFLICT) to work properly
ALTER TABLE "userUpgrades" 
ADD CONSTRAINT "userUpgrades_userId_upgradeId_unique" 
UNIQUE ("userId", "upgradeId");

-- 3. Verify the constraint was created
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public' 
  AND tc.table_name = 'userUpgrades'
  AND tc.constraint_type = 'UNIQUE'
ORDER BY tc.constraint_name, kcu.ordinal_position;

-- Expected result: You should see a constraint with both userId and upgradeId columns

/*
NOTE: This fix is essential because:
1. The upgradeRoutes.ts uses UPSERT with ON CONFLICT (userId, upgradeId)
2. PostgreSQL requires a UNIQUE constraint to exist for ON CONFLICT to work
3. Without this constraint, all upgrade purchases fail with constraint error
4. Once added, users can successfully purchase and upgrade items
*/