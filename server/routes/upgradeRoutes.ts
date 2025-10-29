/**
 * upgradeRoutes.ts - Complete Upgrade API Routes
 * Last Edited: 2025-10-29 by Assistant - FIXED constraint issue with userUpgrades
 *
 * ✅ FIXED: Removed ON CONFLICT clause that was causing constraint errors
 * ✅ FIXED: Use INSERT or UPDATE pattern instead of UPSERT
 * ✅ FIXED: Proper error handling and rollback for failed transactions
 */

import { Router } from 'express';
import { UpgradeStorage } from '../../shared/UpgradeStorage';
import { SupabaseStorage } from '../../shared/SupabaseStorage';

const router = Router();
const upgradeStorage = UpgradeStorage.getInstance();
const supabaseStorage = SupabaseStorage.getInstance();

/**
 * GET /api/upgrades - Get available upgrades for user
 * DEFENSIVE: Never returns 500, always returns valid JSON
 */
router.get('/', async (req, res) => {
  try {
    // Get userId from query params (telegramId or userId)
    const telegramId = (req.query.telegramId as string) || (req.query.userId as string) || (req.headers['x-user-id'] as string);

    // Validate input
    if (!telegramId || typeof telegramId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'telegramId or userId is required',
        data: []
      });
    }

    console.log(`🔍 [UPGRADES] Getting available upgrades for user: ${telegramId}`);

    // Get available upgrades with comprehensive error handling
    const upgrades = await upgradeStorage.getAvailableUpgrades(telegramId);

    // DEFENSIVE: Always return success with data (even if empty)
    res.json({
      success: true,
      data: upgrades || [], // Ensure array
      count: (upgrades || []).length,
      timestamp: new Date().toISOString()
    });

    console.log(`✅ [UPGRADES] Returning ${(upgrades || []).length} available upgrades`);

  } catch (error: any) {
    console.error('❌ [UPGRADES] Exception in GET /upgrades:', error);

    // DEFENSIVE: Return 200 with error flag instead of 500
    res.status(200).json({
      success: false,
      error: 'Failed to fetch upgrades',
      details: error?.message || 'Unknown error',
      data: [], // Always provide empty array for UI
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/upgrades/all - Get all upgrades (for admin)
 */
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
 * POST /api/upgrades/purchase - New unified purchase endpoint
 * ✅ FIXED: Proper constraint handling
 */
router.post('/purchase', async (req, res) => {
  try {
    const { telegramId, userId, upgradeId } = req.body;
    const actualUserId = telegramId || userId; // Accept either field

    // Validate inputs
    if (!actualUserId || !upgradeId) {
      return res.status(400).json({
        success: false,
        error: 'userId/telegramId and upgradeId are required'
      });
    }

    console.log(`💰 [UPGRADES] Purchase request: ${upgradeId} for ${actualUserId}`);

    // Validate purchase
    const validation = await upgradeStorage.validatePurchase(actualUserId, upgradeId);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.reason || 'Purchase not valid',
        cost: validation.cost
      });
    }

    // Get current level and upgrade info
    const currentLevel = await upgradeStorage.getUserUpgradeLevel(actualUserId, upgradeId);
    const newLevel = currentLevel + 1;
    const cost = validation.cost!;

    // Get user data
    const user = await supabaseStorage.getUser(actualUserId);
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'User not found'
      });
    }

    const newLP = (user.lp || 0) - cost;

    // ✅ FIXED: Use INSERT or UPDATE pattern instead of UPSERT
    try {
      // Update user LP first
      await supabaseStorage.updateUser(actualUserId, { lp: newLP });
      console.log(`💰 [UPGRADES] Deducted ${cost} LP, new balance: ${newLP}`);

      // Check if user upgrade record exists
      const { data: existingUpgrade } = await supabaseStorage.supabase
        .from('userUpgrades')
        .select('*')
        .eq('userId', actualUserId)
        .eq('upgradeId', upgradeId)
        .maybeSingle();

      if (existingUpgrade) {
        // Update existing record
        const { data: updatedUpgrade, error: updateError } = await supabaseStorage.supabase
          .from('userUpgrades')
          .update({
            level: newLevel,
            updatedAt: new Date().toISOString()
          })
          .eq('userId', actualUserId)
          .eq('upgradeId', upgradeId)
          .select()
          .single();

        if (updateError) {
          console.error('❌ [UPGRADES] Failed to update upgrade level:', updateError);
          throw updateError;
        }
        
        console.log(`✅ [UPGRADES] Updated existing upgrade: ${upgradeId} to level ${newLevel}`);
      } else {
        // Insert new record
        const { data: newUpgrade, error: insertError } = await supabaseStorage.supabase
          .from('userUpgrades')
          .insert({
            userId: actualUserId,
            upgradeId: upgradeId,
            level: newLevel,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ [UPGRADES] Failed to insert upgrade level:', insertError);
          throw insertError;
        }
        
        console.log(`✅ [UPGRADES] Created new upgrade record: ${upgradeId} at level ${newLevel}`);
      }

      res.json({
        success: true,
        message: 'Upgrade purchased successfully',
        upgrade: {
          id: upgradeId,
          newLevel,
          cost,
          newLP
        },
        timestamp: new Date().toISOString()
      });

      console.log(`✅ [UPGRADES] Purchase successful: ${upgradeId} level ${newLevel} for ${cost} LP`);

    } catch (transactionError: any) {
      // Rollback LP if upgrade save failed
      console.error('❌ [UPGRADES] Transaction failed, attempting rollback:', transactionError);
      try {
        await supabaseStorage.updateUser(actualUserId, { lp: user.lp });
        console.log(`✅ [UPGRADES] LP rollback successful: restored to ${user.lp}`);
      } catch (rollbackError) {
        console.error('❌ [UPGRADES] Rollback also failed:', rollbackError);
      }
      throw transactionError;
    }

  } catch (error: any) {
    console.error('❌ [UPGRADES] Purchase failed:', error);

    res.status(500).json({
      success: false,
      error: 'Purchase failed',
      details: error?.message || 'Unknown error'
    });
  }
});

/**
 * POST /api/upgrades/:upgradeId/purchase - Legacy endpoint (redirects to new one)
 * This handles the old frontend calls
 * ✅ FIXED: Same constraint fix applied
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

    console.log(`💰 [PURCHASE] Legacy endpoint: ${upgradeId} for user ${actualUserId}`);

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
    console.log(`💰 [PURCHASE] Processing: Cost: ${cost} LP`);

    // Get current user data
    const user = await supabaseStorage.getUser(actualUserId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Get current upgrade level
    const currentLevel = await upgradeStorage.getUserUpgradeLevel(actualUserId, upgradeId);

    // Start transaction-like operations
    try {
      // Deduct LP
      const newLP = (user.lp || 0) - cost;
      await supabaseStorage.updateUser(actualUserId, { lp: newLP });
      console.log(`💰 [PURCHASE] LP deducted: ${user.lp} -> ${newLP}`);

      // ✅ FIXED: Use INSERT or UPDATE pattern instead of UPSERT
      const { data: existingUpgrade } = await supabaseStorage.supabase
        .from('userUpgrades')
        .select('*')
        .eq('userId', actualUserId)
        .eq('upgradeId', upgradeId)
        .maybeSingle();

      const targetLevel = currentLevel + 1;

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
          throw new Error('Failed to save upgrade progress');
        }
        
        console.log(`✅ [PURCHASE] Updated upgrade ${upgradeId} to level ${targetLevel}`);
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
          throw new Error('Failed to save upgrade progress');
        }
        
        console.log(`✅ [PURCHASE] Created upgrade ${upgradeId} at level ${targetLevel}`);
      }

      // Get updated user stats
      const updatedUser = await supabaseStorage.getUser(actualUserId);

      console.log(`✅ [PURCHASE] Success: ${upgradeId} level ${targetLevel}, LP: ${newLP}`);

      res.json({
        success: true,
        data: {
          upgradeId,
          newLevel: targetLevel,
          costPaid: cost,
          newStats: {
            lp: updatedUser?.lp || newLP,
            level: updatedUser?.level || user.level
          }
        }
      });

    } catch (transactionError: any) {
      // Rollback LP if upgrade save failed
      console.error('❌ [PURCHASE] Transaction failed, attempting rollback:', transactionError);
      try {
        await supabaseStorage.updateUser(actualUserId, { lp: user.lp });
        console.log(`✅ [PURCHASE] Rollback successful: LP restored to ${user.lp}`);
      } catch (rollbackError) {
        console.error('❌ [PURCHASE] Rollback failed:', rollbackError);
      }
      throw transactionError;
    }

  } catch (error: any) {
    console.error('❌ [PURCHASE] Error purchasing upgrade:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Purchase failed',
      details: error?.message || 'Unknown error'
    });
  }
});

/**
 * GET /api/upgrades/user/:telegramId - Get user's upgrade levels
 */
router.get('/user/:telegramId', async (req, res) => {
  try {
    const telegramId = req.params.telegramId;

    // DEFENSIVE: Validate telegramId
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

/**
 * GET /api/upgrades/categories - Get upgrades grouped by category
 */
router.get('/categories', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);

    const allUpgrades = await upgradeStorage.getAllUpgrades();
    const categories: Record<string, any[]> = {};

    for (const upgrade of allUpgrades) {
      if (!upgrade || !upgrade.category) continue; // DEFENSIVE

      if (!categories[upgrade.category]) {
        categories[upgrade.category] = [];
      }

      let upgradeData = { ...upgrade };

      // Add user-specific data if userId provided
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
          // Continue without user data
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