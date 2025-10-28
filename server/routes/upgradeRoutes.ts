import { Router } from 'express';
import { UpgradeStorage } from '../../shared/UpgradeStorage';
import { SupabaseStorage } from '../../shared/SupabaseStorage';

const router = Router();
const upgradeStorage = UpgradeStorage.getInstance();
const supabaseStorage = SupabaseStorage.getInstance();

// GET /api/upgrades - List available upgrades with user-specific data
router.get('/', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string) || 'demo';
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId required' });
    }

    console.log(`📈 [UPGRADES] Getting available upgrades for user: ${userId}`);

    const availableUpgrades = await upgradeStorage.getAvailableUpgrades(userId);
    
    console.log(`📈 [UPGRADES] Returning ${availableUpgrades.length} available upgrades`);

    res.json({
      success: true,
      data: availableUpgrades
    });

  } catch (error) {
    console.error('Error fetching upgrades:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch upgrades' });
  }
});

// POST /api/upgrades/:upgradeId/purchase - Purchase an upgrade
router.post('/:upgradeId/purchase', async (req, res) => {
  try {
    const { upgradeId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId required' });
    }

    console.log(`💰 [PURCHASE] Starting upgrade ${upgradeId} for user ${userId}`);

    // Validate purchase
    const validation = await upgradeStorage.validatePurchase(userId, upgradeId);
    if (!validation.valid) {
      console.log(`❌ [PURCHASE] Validation failed: ${validation.reason}`);
      return res.status(400).json({ 
        success: false, 
        error: validation.reason,
        cost: validation.cost 
      });
    }

    const cost = validation.cost!;
    console.log(`💰 [PURCHASE] Processing: Level 0 → 1, Cost: ${cost} LP`);

    // Get current user data
    const user = await supabaseStorage.getUser(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Get current upgrade level
    const currentLevel = await upgradeStorage.getUserUpgradeLevel(userId, upgradeId);

    // Start transaction-like operations
    try {
      // Deduct LP
      const newLP = (user.lp || 0) - cost;
      await supabaseStorage.updateUser(userId, { lp: newLP });

      // Update upgrade level - SIMPLIFIED: Direct telegram ID usage
      console.log(`🔄 [PURCHASE] Updating upgrade progress for user ${userId}, upgrade ${upgradeId}`);
      
      // Try to update existing record first
      const { data: existingUpgrade } = await supabaseStorage.supabase
        .from('userUpgrades')
        .select('id, level')
        .eq('userId', userId) // Direct telegram ID - no conversion needed!
        .eq('upgradeId', upgradeId)
        .single();

      let upgradeError;
      if (existingUpgrade) {
        // Update existing record
        console.log(`🔄 [PURCHASE] Updating existing upgrade record`);
        const { error } = await supabaseStorage.supabase
          .from('userUpgrades')
          .update({
            level: currentLevel + 1,
            purchasedAt: new Date().toISOString()
          })
          .eq('id', existingUpgrade.id);
        upgradeError = error;
      } else {
        // Insert new record
        console.log(`🔄 [PURCHASE] Creating new upgrade record`);
        const { error } = await supabaseStorage.supabase
          .from('userUpgrades')
          .insert({
            userId: userId, // Direct telegram ID usage!
            upgradeId,
            level: currentLevel + 1,
            purchasedAt: new Date().toISOString()
          });
        upgradeError = error;
      }

      if (upgradeError) {
        console.error('❌ [PURCHASE] Failed to update upgrade:', upgradeError);
        throw new Error(`Failed to save upgrade progress: ${upgradeError.message}`);
      }

      // Get updated user stats
      const updatedUser = await supabaseStorage.getUser(userId);

      console.log(`✅ [PURCHASE] Success: ${upgradeId} level ${currentLevel + 1}, LP: ${newLP}`);

      res.json({
        success: true,
        data: {
          upgradeId,
          newLevel: currentLevel + 1,
          costPaid: cost,
          newStats: {
            lp: updatedUser?.lp || newLP,
            level: updatedUser?.level || user.level
          }
        }
      });

    } catch (transactionError) {
      // Rollback LP if upgrade save failed
      console.error('❌ [PURCHASE] Transaction failed, attempting rollback:', transactionError);
      await supabaseStorage.updateUser(userId, { lp: user.lp });
      throw transactionError;
    }

  } catch (error) {
    console.error('❌ [PURCHASE] Error purchasing upgrade:', error);
    res.status(500).json({ success: false, error: 'Purchase failed' });
  }
});

// GET /api/upgrades/categories - Get upgrades grouped by category
router.get('/categories', async (req, res) => {
  try {
    const userId = req.query.userId as string || req.headers['x-user-id'] as string;

    const allUpgrades = await upgradeStorage.getAllUpgrades();
    const categories: Record<string, any[]> = {};

    for (const upgrade of allUpgrades) {
      if (!categories[upgrade.category]) {
        categories[upgrade.category] = [];
      }

      let upgradeData = { ...upgrade };

      if (userId) {
        const currentLevel = await upgradeStorage.getUserUpgradeLevel(userId, upgrade.id);
        const isUnlocked = await upgradeStorage.isUpgradeUnlocked(userId, upgrade);
        const nextCost = upgradeStorage.calculateCost(upgrade, currentLevel);

        upgradeData = {
          ...upgradeData,
          currentLevel,
          isUnlocked,
          nextCost: nextCost === Infinity ? null : nextCost
        };
      }

      categories[upgrade.category].push(upgradeData);
    }

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Error fetching upgrade categories:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

export default router;