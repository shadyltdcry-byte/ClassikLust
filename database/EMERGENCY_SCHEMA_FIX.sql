-- EMERGENCY SCHEMA FIX
-- This aligns ALL database columns to match what your app expects
-- Run this ONCE to stop ALL column naming hell forever

-- Check current column names first
\echo '=== CURRENT SCHEMA STATUS ===';
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'characters', 'mediaFiles', 'upgrades', 'achievements', 'levelRequirements', 'userUpgrades', 'chatMessages', 'wheelRewards')
ORDER BY table_name, column_name;

\echo '=== APPLYING FIXES ===';

-- Fix users table (telegramid vs telegramId)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'telegramid') THEN
    ALTER TABLE users RENAME COLUMN telegramid TO "telegramId";
    RAISE NOTICE 'Fixed users.telegramid → telegramId';
  END IF;
END $$;

-- Fix mediaFiles table (characterid vs characterId, etc.)
DO $$
BEGIN
  -- characterid → characterId
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mediaFiles' AND column_name = 'characterid') THEN
    ALTER TABLE "mediaFiles" RENAME COLUMN characterid TO "characterId";
    RAISE NOTICE 'Fixed mediaFiles.characterid → characterId';
  END IF;
  
  -- filename → fileName
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mediaFiles' AND column_name = 'filename') THEN
    ALTER TABLE "mediaFiles" RENAME COLUMN filename TO "fileName";
    RAISE NOTICE 'Fixed mediaFiles.filename → fileName';
  END IF;
  
  -- filepath → filePath
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mediaFiles' AND column_name = 'filepath') THEN
    ALTER TABLE "mediaFiles" RENAME COLUMN filepath TO "filePath";
    RAISE NOTICE 'Fixed mediaFiles.filepath → filePath';
  END IF;
  
  -- filetype → fileType
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mediaFiles' AND column_name = 'filetype') THEN
    ALTER TABLE "mediaFiles" RENAME COLUMN filetype TO "fileType";
    RAISE NOTICE 'Fixed mediaFiles.filetype → fileType';
  END IF;
  
  -- isnsfw → isNsfw
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mediaFiles' AND column_name = 'isnsfw') THEN
    ALTER TABLE "mediaFiles" RENAME COLUMN isnsfw TO "isNsfw";
    RAISE NOTICE 'Fixed mediaFiles.isnsfw → isNsfw';
  END IF;
  
  -- isvip → isVip
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mediaFiles' AND column_name = 'isvip') THEN
    ALTER TABLE "mediaFiles" RENAME COLUMN isvip TO "isVip";
    RAISE NOTICE 'Fixed mediaFiles.isvip → isVip';
  END IF;
  
  -- isevent → isEvent
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mediaFiles' AND column_name = 'isevent') THEN
    ALTER TABLE "mediaFiles" RENAME COLUMN isevent TO "isEvent";
    RAISE NOTICE 'Fixed mediaFiles.isevent → isEvent';
  END IF;
  
  -- enabledforchat → enabledForChat
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mediaFiles' AND column_name = 'enabledforchat') THEN
    ALTER TABLE "mediaFiles" RENAME COLUMN enabledforchat TO "enabledForChat";
    RAISE NOTICE 'Fixed mediaFiles.enabledforchat → enabledForChat';
  END IF;
  
  -- randomsendchance → randomSendChance
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mediaFiles' AND column_name = 'randomsendchance') THEN
    ALTER TABLE "mediaFiles" RENAME COLUMN randomsendchance TO "randomSendChance";
    RAISE NOTICE 'Fixed mediaFiles.randomsendchance → randomSendChance';
  END IF;
  
  -- requiredlevel → requiredLevel
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mediaFiles' AND column_name = 'requiredlevel') THEN
    ALTER TABLE "mediaFiles" RENAME COLUMN requiredlevel TO "requiredLevel";
    RAISE NOTICE 'Fixed mediaFiles.requiredlevel → requiredLevel';
  END IF;
  
  -- createdat → createdAt
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mediaFiles' AND column_name = 'createdat') THEN
    ALTER TABLE "mediaFiles" RENAME COLUMN createdat TO "createdAt";
    RAISE NOTICE 'Fixed mediaFiles.createdat → createdAt';
  END IF;
  
  -- updatedat → updatedAt
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mediaFiles' AND column_name = 'updatedat') THEN
    ALTER TABLE "mediaFiles" RENAME COLUMN updatedat TO "updatedAt";
    RAISE NOTICE 'Fixed mediaFiles.updatedat → updatedAt';
  END IF;
END $$;

-- Fix upgrades table (the main culprit!)
DO $$
BEGIN
  -- basecost → baseCost
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'upgrades' AND column_name = 'basecost') THEN
    ALTER TABLE upgrades RENAME COLUMN basecost TO "baseCost";
    RAISE NOTICE 'Fixed upgrades.basecost → baseCost';
  END IF;
  
  -- hourlybonus → hourlyBonus
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'upgrades' AND column_name = 'hourlybonus') THEN
    ALTER TABLE upgrades RENAME COLUMN hourlybonus TO "hourlyBonus";
    RAISE NOTICE 'Fixed upgrades.hourlybonus → hourlyBonus';
  END IF;
  
  -- tapbonus → tapBonus
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'upgrades' AND column_name = 'tapbonus') THEN
    ALTER TABLE upgrades RENAME COLUMN tapbonus TO "tapBonus";
    RAISE NOTICE 'Fixed upgrades.tapbonus → tapBonus';
  END IF;
  
  -- maxlevel → maxLevel
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'upgrades' AND column_name = 'maxlevel') THEN
    ALTER TABLE upgrades RENAME COLUMN maxlevel TO "maxLevel";
    RAISE NOTICE 'Fixed upgrades.maxlevel → maxLevel';
  END IF;
  
  -- requiredlevel → requiredLevel
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'upgrades' AND column_name = 'requiredlevel') THEN
    ALTER TABLE upgrades RENAME COLUMN requiredlevel TO "requiredLevel";
    RAISE NOTICE 'Fixed upgrades.requiredlevel → requiredLevel';
  END IF;
  
  -- createdat → createdAt
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'upgrades' AND column_name = 'createdat') THEN
    ALTER TABLE upgrades RENAME COLUMN createdat TO "createdAt";
    RAISE NOTICE 'Fixed upgrades.createdat → createdAt';
  END IF;
  
  -- updatedat → updatedAt
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'upgrades' AND column_name = 'updatedat') THEN
    ALTER TABLE upgrades RENAME COLUMN updatedat TO "updatedAt";
    RAISE NOTICE 'Fixed upgrades.updatedat → updatedAt';
  END IF;
END $$;

-- Fix levelRequirements table
DO $$
BEGIN
  -- lprequired → lpRequired
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'levelRequirements' AND column_name = 'lprequired') THEN
    ALTER TABLE "levelRequirements" RENAME COLUMN lprequired TO "lpRequired";
    RAISE NOTICE 'Fixed levelRequirements.lprequired → lpRequired';
  END IF;
  
  -- createdat → createdAt
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'levelRequirements' AND column_name = 'createdat') THEN
    ALTER TABLE "levelRequirements" RENAME COLUMN createdat TO "createdAt";
    RAISE NOTICE 'Fixed levelRequirements.createdat → createdAt';
  END IF;
END $$;

-- Fix achievements table
DO $$
BEGIN
  -- rewardtype → rewardType
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'rewardtype') THEN
    ALTER TABLE achievements RENAME COLUMN rewardtype TO "rewardType";
    RAISE NOTICE 'Fixed achievements.rewardtype → rewardType';
  END IF;
  
  -- maxprogress → maxProgress
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'maxprogress') THEN
    ALTER TABLE achievements RENAME COLUMN maxprogress TO "maxProgress";
    RAISE NOTICE 'Fixed achievements.maxprogress → maxProgress';
  END IF;
  
  -- sortorder → sortOrder
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'sortorder') THEN
    ALTER TABLE achievements RENAME COLUMN sortorder TO "sortOrder";
    RAISE NOTICE 'Fixed achievements.sortorder → sortOrder';
  END IF;
  
  -- createdat → createdAt
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'createdat') THEN
    ALTER TABLE achievements RENAME COLUMN createdat TO "createdAt";
    RAISE NOTICE 'Fixed achievements.createdat → createdAt';
  END IF;
  
  -- updatedat → updatedAt
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'updatedat') THEN
    ALTER TABLE achievements RENAME COLUMN updatedat TO "updatedAt";
    RAISE NOTICE 'Fixed achievements.updatedat → updatedAt';
  END IF;
END $$;

-- Fix userUpgrades table
DO $$
BEGIN
  -- userid → userId
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'userUpgrades' AND column_name = 'userid') THEN
    ALTER TABLE "userUpgrades" RENAME COLUMN userid TO "userId";
    RAISE NOTICE 'Fixed userUpgrades.userid → userId';
  END IF;
  
  -- upgradeid → upgradeId
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'userUpgrades' AND column_name = 'upgradeid') THEN
    ALTER TABLE "userUpgrades" RENAME COLUMN upgradeid TO "upgradeId";
    RAISE NOTICE 'Fixed userUpgrades.upgradeid → upgradeId';
  END IF;
  
  -- currentlevel → currentLevel
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'userUpgrades' AND column_name = 'currentlevel') THEN
    ALTER TABLE "userUpgrades" RENAME COLUMN currentlevel TO "currentLevel";
    RAISE NOTICE 'Fixed userUpgrades.currentlevel → currentLevel';
  END IF;
  
  -- totalspent → totalSpent
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'userUpgrades' AND column_name = 'totalspent') THEN
    ALTER TABLE "userUpgrades" RENAME COLUMN totalspent TO "totalSpent";
    RAISE NOTICE 'Fixed userUpgrades.totalspent → totalSpent';
  END IF;
  
  -- lastpurchased → lastPurchased
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'userUpgrades' AND column_name = 'lastpurchased') THEN
    ALTER TABLE "userUpgrades" RENAME COLUMN lastpurchased TO "lastPurchased";
    RAISE NOTICE 'Fixed userUpgrades.lastpurchased → lastPurchased';
  END IF;
END $$;

-- Fix chatMessages table
DO $$
BEGIN
  -- userid → userId
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chatMessages' AND column_name = 'userid') THEN
    ALTER TABLE "chatMessages" RENAME COLUMN userid TO "userId";
    RAISE NOTICE 'Fixed chatMessages.userid → userId';
  END IF;
  
  -- characterid → characterId
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chatMessages' AND column_name = 'characterid') THEN
    ALTER TABLE "chatMessages" RENAME COLUMN characterid TO "characterId";
    RAISE NOTICE 'Fixed chatMessages.characterid → characterId';
  END IF;
  
  -- sendertype → senderType
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chatMessages' AND column_name = 'sendertype') THEN
    ALTER TABLE "chatMessages" RENAME COLUMN sendertype TO "senderType";
    RAISE NOTICE 'Fixed chatMessages.sendertype → senderType';
  END IF;
  
  -- createdat → createdAt
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chatMessages' AND column_name = 'createdat') THEN
    ALTER TABLE "chatMessages" RENAME COLUMN createdat TO "createdAt";
    RAISE NOTICE 'Fixed chatMessages.createdat → createdAt';
  END IF;
END $$;

-- Fix wheelRewards table
DO $$
BEGIN
  -- userid → userId
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wheelRewards' AND column_name = 'userid') THEN
    ALTER TABLE "wheelRewards" RENAME COLUMN userid TO "userId";
    RAISE NOTICE 'Fixed wheelRewards.userid → userId';
  END IF;
  
  -- rewardtype → rewardType
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wheelRewards' AND column_name = 'rewardtype') THEN
    ALTER TABLE "wheelRewards" RENAME COLUMN rewardtype TO "rewardType";
    RAISE NOTICE 'Fixed wheelRewards.rewardtype → rewardType';
  END IF;
  
  -- spunat → spunAt
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wheelRewards' AND column_name = 'spunat') THEN
    ALTER TABLE "wheelRewards" RENAME COLUMN spunat TO "spunAt";
    RAISE NOTICE 'Fixed wheelRewards.spunat → spunAt';
  END IF;
END $$;

-- Add missing columns that might be expected
DO $$
BEGIN
  -- Add costMultiplier to upgrades if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'upgrades' AND column_name = 'costMultiplier') THEN
    ALTER TABLE upgrades ADD COLUMN "costMultiplier" NUMERIC(4,2) DEFAULT 1.5;
    RAISE NOTICE 'Added upgrades.costMultiplier';
  END IF;
  
  -- Add baseEffect to upgrades if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'upgrades' AND column_name = 'baseEffect') THEN
    ALTER TABLE upgrades ADD COLUMN "baseEffect" NUMERIC(8,2) DEFAULT 1;
    RAISE NOTICE 'Added upgrades.baseEffect';
  END IF;
  
  -- Add effectMultiplier to upgrades if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'upgrades' AND column_name = 'effectMultiplier') THEN
    ALTER TABLE upgrades ADD COLUMN "effectMultiplier" NUMERIC(4,2) DEFAULT 1.1;
    RAISE NOTICE 'Added upgrades.effectMultiplier';
  END IF;
  
  -- Add sortOrder to upgrades if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'upgrades' AND column_name = 'sortOrder') THEN
    ALTER TABLE upgrades ADD COLUMN "sortOrder" INTEGER DEFAULT 0;
    RAISE NOTICE 'Added upgrades.sortOrder';
  END IF;
  
  -- Add currentLevel to userUpgrades if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'userUpgrades' AND column_name = 'currentLevel') THEN
    ALTER TABLE "userUpgrades" ADD COLUMN "currentLevel" INTEGER DEFAULT 0;
    RAISE NOTICE 'Added userUpgrades.currentLevel';
  END IF;
  
  -- Add totalSpent to userUpgrades if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'userUpgrades' AND column_name = 'totalSpent') THEN
    ALTER TABLE "userUpgrades" ADD COLUMN "totalSpent" NUMERIC(15,2) DEFAULT 0;
    RAISE NOTICE 'Added userUpgrades.totalSpent';
  END IF;
  
  -- Add lastPurchased to userUpgrades if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'userUpgrades' AND column_name = 'lastPurchased') THEN
    ALTER TABLE "userUpgrades" ADD COLUMN "lastPurchased" TIMESTAMPTZ;
    RAISE NOTICE 'Added userUpgrades.lastPurchased';
  END IF;
END $$;

-- Final schema check
\echo '=== FINAL SCHEMA (should be all camelCase now) ===';
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'characters', 'mediaFiles', 'upgrades', 'achievements', 'levelRequirements', 'userUpgrades', 'chatMessages', 'wheelRewards')
ORDER BY table_name, column_name;

\echo '=== EMERGENCY SCHEMA FIX COMPLETE ===';
\echo 'Restart your application and clear browser cache!';
\echo 'All columns should now match your app expectations!';
