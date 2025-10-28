import { Router } from 'express';
import { UpgradeStorage } from '../../shared/UpgradeStorage';
import { SupabaseStorage } from '../../shared/SupabaseStorage';
import { createErrorResponse, createSuccessResponse } from '../utils/helpers';

const router = Router();
const upgrades = UpgradeStorage.getInstance();
const storage = SupabaseStorage.getInstance();

// Claim offline LP with 3h base cap + upgrade bonus
router.post('/offline/claim', async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json(createErrorResponse('userId required'));

    console.log(`⏰ [OFFLINE] Claim request for user: ${userId}`);

    const user = await storage.getUser(userId);
    if (!user) {
      console.log(`❌ [OFFLINE] User not found: ${userId}`);
      return res.status(404).json(createErrorResponse('User not found'));
    }

    const now = new Date();
    const last = user.lastTick ? new Date(user.lastTick) : new Date(now.getTime() - 5 * 60 * 1000);
    const offlineMinutes = Math.max(0, Math.floor((now.getTime() - last.getTime()) / 60000));

    console.log(`⏰ [OFFLINE] User offline for ${offlineMinutes} minutes`);

    const baseCap = 180; // 3 hours
    const bonusCap = await (async () => {
      try {
        const level = await upgrades.getUserUpgradeLevel(userId, 'offline-cap');
        if (level === 0) return 0;
        const up = await upgrades.getUpgrade('offline-cap');
        if (!up) return 0;
        return upgrades.calculateTotalEffect(up, level); // minutes
      } catch (error) {
        console.log(`⚠️ [OFFLINE] Could not get offline-cap bonus:`, error);
        return 0;
      }
    })();

    const capMinutes = baseCap + bonusCap;
    const minutesApplied = Math.min(offlineMinutes, capMinutes);

    const lpPerHour = Math.max(0, Math.floor(user.lpPerHour || 250));
    const claimedLp = Math.max(0, Math.floor((minutesApplied / 60) * lpPerHour));

    console.log(`⏰ [OFFLINE] Cap: ${capMinutes}min, Applied: ${minutesApplied}min, Rate: ${lpPerHour}/h, Claimed: ${claimedLp} LP`);

    if (claimedLp <= 0) {
      await storage.updateUser(userId, { lastTick: now });
      console.log(`⏰ [OFFLINE] Nothing to claim for ${userId}`);
      return res.json(createSuccessResponse({
        claimedLp: 0,
        minutesApplied,
        capMinutes,
        lpPerHour,
        newLp: user.lp || 0
      }, 'Nothing to claim'));
    }

    const newLp = Math.floor((user.lp || 0)) + claimedLp;
    await storage.updateUser(userId, { lp: newLp, lastTick: now });

    console.log(`✅ [OFFLINE] Claimed ${claimedLp} LP for ${userId}. New balance: ${newLp}`);

    return res.json(createSuccessResponse({
      claimedLp,
      minutesApplied,
      capMinutes,
      lpPerHour,
      newLp
    }, 'Offline LP claimed'));
  } catch (e) {
    console.error('❌ [OFFLINE] Claim error:', e);
    res.status(500).json(createErrorResponse('Failed to claim offline LP'));
  }
});

// Admin: list upgrades (optionally decorated with user state)
router.get('/admin/upgrades', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || '';
    console.log(`📊 [ADMIN] Fetching upgrades${userId ? ` for user: ${userId}` : ' (global view)'}`);

    const list = await upgrades.getAllUpgrades();
    console.log(`📊 [ADMIN] Found ${list.length} upgrades in storage`);

    if (!userId) {
      console.log(`📊 [ADMIN] Returning global view`);
      return res.json(createSuccessResponse(list));
    }

    // Decorate with user-specific data
    const decorated = await Promise.all(list.map(async u => {
      try {
        const level = await upgrades.getUserUpgradeLevel(userId, u.id);
        const nextCost = upgrades.calculateCost(u, level);
        return { 
          ...u, 
          currentLevel: level, 
          nextCost: nextCost === Infinity ? null : nextCost 
        };
      } catch (error) {
        console.warn(`⚠️ [ADMIN] Could not get user level for ${u.id}:`, error);
        return { ...u, currentLevel: 0, nextCost: u.baseCost };
      }
    }));

    console.log(`📊 [ADMIN] Returning ${decorated.length} decorated upgrades`);
    res.json(createSuccessResponse(decorated));
  } catch (e) {
    console.error('❌ [ADMIN] Upgrades fetch error:', e);
    res.status(500).json(createErrorResponse('Failed to load upgrades'));
  }
});

export default router;