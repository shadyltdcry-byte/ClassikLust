-- Fix Duplicate Upgrades Migration
-- Removes duplicate "Passive Income" upgrade entries
-- Run this migration to clean up duplicate upgrades

-- First, let's see what we have
SELECT id, name, category, description 
FROM upgrades 
WHERE name ILIKE '%passive%income%' 
OR name ILIKE '%offline%' 
ORDER BY name, id;

-- Remove duplicate Passive Income upgrades (keep the first one)
WITH duplicate_upgrades AS (
  SELECT 
    id,
    name,
    category,
    ROW_NUMBER() OVER (PARTITION BY name, category ORDER BY id) as rn
  FROM upgrades 
  WHERE name ILIKE '%passive%income%'
)
DELETE FROM upgrades 
WHERE id IN (
  SELECT id FROM duplicate_upgrades WHERE rn > 1
);

-- Verify the cleanup
SELECT id, name, category, description 
FROM upgrades 
WHERE name ILIKE '%passive%income%' 
OR name ILIKE '%offline%' 
ORDER BY name, id;

-- Update the remaining Passive Income upgrade to be more specific
UPDATE upgrades 
SET 
  name = 'Offline Passive Income',
  description = 'Generate LP automatically while offline (3 hour cap)',
  category = 'passive'
WHERE name ILIKE '%passive%income%'
AND category = 'passive';

-- Ensure we have the proper unique constraint
ALTER TABLE upgrades 
ADD CONSTRAINT unique_upgrade_name_category 
UNIQUE (name, category) 
ON CONFLICT DO NOTHING;