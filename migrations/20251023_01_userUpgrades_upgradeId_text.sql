-- migrate:up
ALTER TABLE "userUpgrades" ALTER COLUMN "upgradeId" TYPE text USING "upgradeId"::text;

-- Optional: drop FK if exists to decouple from UUID upgrades table
DO $$ BEGIN
  ALTER TABLE "userUpgrades" DROP CONSTRAINT IF EXISTS "userUpgrades_upgradeId_upgrades_id_fk";
EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- migrate:down
-- Revert to UUID (data loss if non-UUID present)
ALTER TABLE "userUpgrades" ALTER COLUMN "upgradeId" TYPE uuid USING NULL;
