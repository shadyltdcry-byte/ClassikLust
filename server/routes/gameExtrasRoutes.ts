import { Router } from 'express';
import { UpgradeStorage } from '../../shared/UpgradeStorage';
import { SupabaseStorage } from '../../shared/SupabaseStorage';
import { createErrorResponse, createSuccessResponse } from '../utils/helpers';

const router = Router();
const upgrades = UpgradeStorage.getInstance();
const storage = SupabaseStorage.getInstance();

// Claim offline LP with 3h base cap + upgrade bonus
router.post('/api/offline/claim', async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json(createErrorResponse('userId required'));

    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json(createErrorResponse('User not found'));

    const now = new Date();
    const last = user.lastTick ? new Date(user.lastTick) : new Date(now.getTime() - 5 * 60 * 1000);
    const offlineMinutes = Math.max(0, Math.floor((now.getTime() - last.getTime()) / 60000));

    const baseCap = 180; // 3 hours
    const bonusCap = await (async () => {
      try {
        const level = await upgrades.getUserUpgradeLevel(userId, 'offline-cap');
        if (level === 0) return 0;
        const up = await upgrades.getUpgrade('offline-cap');
        if (!up) return 0;
        return upgrades.calculateTotalEffect(up, level); // minutes
      } catch {
        return 0;
      }
    })();

    const capMinutes = baseCap + bonusCap;
    const minutesApplied = Math.min(offlineMinutes, capMinutes);

    const lpPerHour = Math.max(0, Math.floor(user.lpPerHour || 0));
    const claimedLp = Math.max(0, Math.floor((minutesApplied / 60) * lpPerHour));

    if (claimedLp <= 0) {
      await storage.updateUser(userId, { lastTick: now });
      return res.json(createSuccessResponse({
        claimedLp: 0,
        minutesApplied,
        capMinutes,
        lpPerHour,
        newLp: user.lp
      }, 'Nothing to claim'));
    }

    const newLp = Math.floor((user.lp || 0)) + claimedLp;
    await storage.updateUser(userId, { lp: newLp, lastTick: now });

    return res.json(createSuccessResponse({
      claimedLp,
      minutesApplied,
      capMinutes,
      lpPerHour,
      newLp
    }, 'Offline LP claimed'));
  } catch (e) {
    console.error('Offline claim error:', e);
    res.status(500).json(createErrorResponse('Failed to claim offline LP'));
  }
});

// Admin: list upgrades (optionally decorated with user state)
router.get('/api/admin/upgrades', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || '';
    const list = await upgrades.getAllUpgrades();

    if (!userId) return res.json(createSuccessResponse(list));

    const decorated = await Promise.all(list.map(async u => {
      const level = await upgrades.getUserUpgradeLevel(userId, u.id);
      const nextCost = upgrades.calculateCost(u, level);
      return { ...u, currentLevel: level, nextCost };
    }));

    res.json(createSuccessResponse(decorated));
  } catch (e) {
    console.error('Admin upgrades error:', e);
    res.status(500).json(createErrorResponse('Failed to load upgrades'));
  }
});

export default router;
