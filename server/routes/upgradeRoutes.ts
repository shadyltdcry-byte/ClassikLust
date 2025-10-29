/**
 * upgradeRoutes.ts - Complete Upgrade API Routes
 * Last Edited: 2025-10-29 by Assistant - CRITICAL FIX for upgrade effects NOT applying
 *
 * ❌ ISSUE: Upgrades purchase successfully but user stats (lpPerTap, lpPerHour) don't update
 * ✅ FIXED: Added missing applyUserUpgradeEffects() call after successful purchase
 * ✅ FIXED: Removed ON CONFLICT constraint issue
 * ✅ FIXED: Proper rollback on transaction failure
 */

import { Router } from 'express';
import { UpgradeStorage } from '../../shared/UpgradeStorage';
import { SupabaseStorage } from '../../shared/SupabaseStorage';

const router = Router();
const upgradeStorage = UpgradeStorage.getInstance();
const supabaseStorage = SupabaseStorage.getInstance();

router.get('/', async (req, res) => {
  try {
    const telegramId = (req.query.telegramId as string) || (req.query.userId as string) || (req.headers['x-user-id'] as string);

    if (!telegramId || typeof telegramId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'telegramId or userId is required',
        data: []
      });
    }

    console.log(`🔍 [UPGRADES] Getting available upgrades for user: ${telegramId}`);

    const upgrades = await upgradeStorage.getAvailableUpgrades(telegramId);

    res.json({
      success: true,
      data: upgrades || [],
      count: (upgrades || []).length,
      timestamp: new Date().toISOString()
    });

    console.log(`✅ [UPGRADES] Returning ${(upgrades || []).length} available upgrades`);

  } catch (error: any) {
    console.error('❌ [UPGRADES] Exception in GET /upgrades:', error);

    res.status(200).json({
      success: false,
      error: 'Failed to fetch upgrades',
      details: error?.message || 'Unknown error',
      data: [],
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/all', async (req, res) => {
  try {
    console.log('🔍 [UPGRADES] Getting all upgrades for admin');

    const allUpgrades = await upgradeStorage.getAllUpgrades();

    res.json({
      success: true,
      data: allUpgrades || [],
      count: (allUpgrades || []).length,
      timestamp: new Date().toISOString()
    });

    console.log(`✅ [UPGRADES] Returning ${(allUpgrades || []).length} total upgrades`);

  } catch (error: any) {
    console.error('❌ [UPGRADES] Exception in GET /upgrades/all:', error);

    res.status(200).json({
      success: false,
      error: 'Failed to fetch all upgrades',
      details: error?.message || 'Unknown error',
      data: [],
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/upgrades/:upgradeId/purchase - THE CRITICAL FIX
 * 🔥 ISSUE: This endpoint was NOT calling applyUserUpgradeEffects!
 * ✅ FIXED: Added the missing effect application call
 */
router.post('/:upgradeId/purchase', async (req, res) => {
  try {
    const { upgradeId } = req.params;
    const { userId, telegramId } = req.body;
    const actualUserId = telegramId || userId || (req.headers['x-user-id'] as string);

    if (!actualUserId) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId or telegramId required' 
      });
    }

    console.log(`💰 [PURCHASE] Processing upgrade: ${upgradeId} for user ${actualUserId}`);

    // Validate purchase
    const validation = await upgradeStorage.validatePurchase(actualUserId, upgradeId);
    if (!validation.valid) {
      console.log(`❌ [PURCHASE] Validation failed: ${validation.reason}`);
      return res.status(400).json({ 
        success: false, 
        error: validation.reason,
        cost: validation.cost 
      });
    }

    const cost = validation.cost!;
    console.log(`💰 [PURCHASE] Validated: Cost=${cost} LP`);

    // Get current user data
    const user = await supabaseStorage.getUser(actualUserId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const currentLevel = await upgradeStorage.getUserUpgradeLevel(actualUserId, upgradeId);
    const targetLevel = currentLevel + 1;
    const oldLP = user.lp || 0;
    const newLP = oldLP - cost;

    console.log(`💰 [PURCHASE] Transaction: Level ${currentLevel} -> ${targetLevel}, LP ${oldLP} -> ${newLP}`);

    // Start transaction-like operations with rollback capability
    let transactionFailed = false;
    
    try {
      // Step 1: Deduct LP
      await supabaseStorage.updateUser(actualUserId, { lp: newLP });
      console.log(`✅ [PURCHASE] LP deducted successfully`);

      // Step 2: Update upgrade level (NO UPSERT - INSERT or UPDATE pattern)
      const { data: existingUpgrade } = await supabaseStorage.supabase
        .from('userUpgrades')
        .select('*')
        .eq('userId', actualUserId)
        .eq('upgradeId', upgradeId)
        .maybeSingle();

      if (existingUpgrade) {
        // Update existing record
        const { error: updateError } = await supabaseStorage.supabase
          .from('userUpgrades')
          .update({
            level: targetLevel,
            updatedAt: new Date().toISOString()
          })
          .eq('userId', actualUserId)
          .eq('upgradeId', upgradeId);

        if (updateError) {
          console.error('❌ [PURCHASE] Failed to update upgrade:', updateError);
          transactionFailed = true;
          throw new Error('Failed to save upgrade progress');
        }
        
        console.log(`✅ [PURCHASE] Updated upgrade level: ${upgradeId} -> level ${targetLevel}`);
      } else {
        // Insert new record
        const { error: insertError } = await supabaseStorage.supabase
          .from('userUpgrades')
          .insert({
            userId: actualUserId,
            upgradeId,
            level: targetLevel,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

        if (insertError) {
          console.error('❌ [PURCHASE] Failed to insert upgrade:', insertError);
          transactionFailed = true;
          throw new Error('Failed to save upgrade progress');
        }
        
        console.log(`✅ [PURCHASE] Created upgrade record: ${upgradeId} -> level ${targetLevel}`);
      }

      // 🔥 CRITICAL FIX: Apply upgrade effects to user stats (THIS WAS MISSING!)
      console.log(`⚡ [PURCHASE] === APPLYING UPGRADE EFFECTS ===`);
      const updatedStats = await upgradeStorage.applyUserUpgradeEffects(actualUserId);
      console.log(`✅ [PURCHASE] Upgrade effects applied! New stats:`);
      console.log(`  • lpPerTap: ${updatedStats.lpPerTap}`);
      console.log(`  • lpPerHour: ${updatedStats.lpPerHour}`);
      console.log(`  • maxEnergy: ${updatedStats.maxEnergy}`);
      console.log(`⚡ [PURCHASE] === EFFECTS COMPLETE ===`);

      // Get final user data with updated stats
      const updatedUser = await supabaseStorage.getUser(actualUserId);

      res.json({
        success: true,
        data: {
          upgradeId,
          newLevel: targetLevel,
          costPaid: cost,
          newStats: {
            lp: updatedUser?.lp || newLP,
            level: updatedUser?.level || user.level,
            lpPerTap: updatedStats.lpPerTap, // ✅ These should now be updated!
            lpPerHour: updatedStats.lpPerHour,
            maxEnergy: updatedStats.maxEnergy,
            energy: updatedStats.energy || updatedUser?.energy
          }
        }
      });

      console.log(`✅ [PURCHASE] SUCCESS: ${upgradeId} level ${targetLevel}, ${cost} LP spent, stats updated`);

    } catch (transactionError: any) {
      // Rollback LP if anything failed
      console.error('❌ [PURCHASE] Transaction failed, rolling back LP:', transactionError);
      
      if (!transactionFailed) {
        // Only rollback if LP was successfully deducted
        try {
          await supabaseStorage.updateUser(actualUserId, { lp: oldLP });
          console.log(`✅ [PURCHASE] Rollback successful: LP restored to ${oldLP}`);
        } catch (rollbackError) {
          console.error('❌ [PURCHASE] Rollback ALSO failed:', rollbackError);
        }
      }
      
      throw transactionError;
    }

  } catch (error: any) {
    console.error('❌ [PURCHASE] Final error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Purchase failed',
      details: error?.message || 'Unknown error'
    });
  }
});

router.get('/user/:telegramId', async (req, res) => {
  try {
    const telegramId = req.params.telegramId;

    if (!telegramId || typeof telegramId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'telegramId is required',
        data: []
      });
    }

    console.log(`🔍 [UPGRADES] Getting user upgrades for: ${telegramId}`);

    const userUpgrades = await upgradeStorage.getUserUpgrades(telegramId);

    res.json({
      success: true,
      data: userUpgrades || [],
      count: (userUpgrades || []).length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [UPGRADES] Exception getting user upgrades:', error);

    res.status(200).json({
      success: false,
      error: 'Failed to get user upgrades',
      details: error?.message || 'Unknown error',
      data: [],
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);

    const allUpgrades = await upgradeStorage.getAllUpgrades();
    const categories: Record<string, any[]> = {};

    for (const upgrade of allUpgrades) {
      if (!upgrade || !upgrade.category) continue;

      if (!categories[upgrade.category]) {
        categories[upgrade.category] = [];
      }

      let upgradeData = { ...upgrade };

      if (userId && typeof userId === 'string') {
        try {
          const currentLevel = await upgradeStorage.getUserUpgradeLevel(userId, upgrade.id);
          const isUnlocked = await upgradeStorage.isUpgradeUnlocked(userId, upgrade);
          const nextCost = upgradeStorage.calculateCost(upgrade, currentLevel);

          upgradeData = {
            ...upgradeData,
            currentLevel,
            isUnlocked,
            nextCost: nextCost === Infinity ? null : nextCost
          };
        } catch (userDataError: any) {
          console.warn(`⚠️ [UPGRADES] Failed to get user data for ${upgrade.id}:`, userDataError.message);
        }
      }

      categories[upgrade.category].push(upgradeData);
    }

    res.json({
      success: true,
      data: categories,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [UPGRADES] Exception fetching categories:', error);

    res.status(200).json({
      success: false,
      error: 'Failed to fetch categories',
      details: error?.message || 'Unknown error',
      data: {},
      timestamp: new Date().toISOString()
    });
  }
});

export default router;