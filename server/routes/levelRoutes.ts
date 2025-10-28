import type { Express, Request, Response } from "express";
import { SupabaseStorage } from "../../shared/SupabaseStorage";
import { createSuccessResponse, createErrorResponse } from "../utils/helpers";
import { FileStorage } from "../../shared/FileStorage";

const storage = SupabaseStorage.getInstance();
const fileStorage = FileStorage.getInstance();

export function registerLevelRoutes(app: Express) {
  // Compute next level requirement and status from JSON
  app.get('/api/level/next', async (req: Request, res: Response) => {
    try {
      const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
      if (!userId) return res.status(400).json(createErrorResponse('userId is required'));

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json(createErrorResponse('User not found'));

      const currentLevel = user.level || 1;
      const nextLevel = currentLevel + 1;
      const reqDef = await fileStorage.getLevelRequirement(nextLevel);

      if (!reqDef) return res.json(createSuccessResponse({
        currentLevel,
        maxed: true,
        message: 'Max level reached'
      }));

      const lpRequired = reqDef.lpRequired ?? 0;
      const currentLP = user.lp || 0;
      const remaining = Math.max(0, lpRequired - currentLP);

      res.json(createSuccessResponse({
        currentLevel,
        nextLevel,
        lpRequired,
        currentLP,
        remaining,
        unlockPreview: reqDef.unlockRewards || [],
      }));
    } catch (e: any) {
      res.status(500).json(createErrorResponse(e.message || 'Failed to compute next level'));
    }
  });

  // Attempt level up using JSON requirements and apply unlock rewards
  app.post('/api/level/claim', async (req: Request, res: Response) => {
    try {
      const { userId } = req.body || {};
      if (!userId) return res.status(400).json(createErrorResponse('userId is required'));

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json(createErrorResponse('User not found'));

      const currentLevel = user.level || 1;
      const nextLevel = currentLevel + 1;
      const reqDef = await fileStorage.getLevelRequirement(nextLevel);
      if (!reqDef) return res.status(400).json(createErrorResponse('Already at max level'));

      const lpRequired = reqDef.lpRequired ?? 0;
      const currentLP = user.lp || 0;
      if (currentLP < lpRequired) {
        return res.status(400).json(createErrorResponse('Not enough LP to level up'));
      }

      const rewards = reqDef.unlockRewards || [];
      let lpDelta = 0; let energyDelta = 0; let charismaDelta = 0;
      for (const r of rewards) {
        if (r.type === 'lp') lpDelta += r.amount || 0;
        if (r.type === 'energy') energyDelta += r.amount || 0;
        if (r.type === 'charisma') charismaDelta += r.amount || 0;
      }

      const updates: any = { level: nextLevel };
      if (lpDelta) updates.lp = currentLP + lpDelta;
      if (energyDelta) updates.energy = Math.min(user.maxEnergy || 1000, (user.energy || 0) + energyDelta);
      if (charismaDelta) updates.charisma = (user.charisma || 0) + charismaDelta;

      const { error } = await storage.supabase.from('users').update(updates).eq('id', userId);
      if (error) throw error;

      res.json(createSuccessResponse({
        message: 'Level up successful',
        newLevel: nextLevel,
        rewards: { lp: lpDelta, energy: energyDelta, charisma: charismaDelta },
      }));
    } catch (e: any) {
      res.status(500).json(createErrorResponse(e.message || 'Failed to level up'));
    }
  });
}
