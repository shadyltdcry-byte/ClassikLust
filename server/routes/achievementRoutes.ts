import type { Express, Request, Response } from "express";
import { SupabaseStorage } from "../../shared/SupabaseStorage";
import { createSuccessResponse, createErrorResponse } from "../utils/helpers";
import AITriageService from "../services/AITriageService";
import { FileStorage } from "../../shared/FileStorage";
import type { Achievement } from "../../shared/schema";

const storage = SupabaseStorage.getInstance();
const aiTriage = AITriageService.getInstance();
const fileStorage = FileStorage.getInstance();

export function registerAchievementRoutes(app: Express) {
  // Get all achievements with user progress (JSON-first)
  app.get("/api/achievements", async (req: Request, res: Response) => {
    try {
      const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
      const achievements = await fileStorage.getAllAchievements();

      if (!userId || userId === 'anonymous') {
        return res.json(achievements.map(a => ({ ...a, progress: 0, completed: false, claimed: false })));
      }

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json(createErrorResponse('User not found'));

      const { data: rows } = await storage.supabase
        .from('userAchievements')
        .select('achievementId, progress, completed, claimedAt, currentLevel, lastClaimedLevel')
        .eq('userId', userId);

      const map = new Map<string, any>();
      (rows || []).forEach(r => map.set(r.achievementId, r));

      const enriched = achievements.map((a: any) => {
        const saved = map.get(a.id);
        const requirement = a.baseRequirement?.baseTarget ?? a.baseRequirement?.value ?? 0;
        const progress = saved?.progress || 0;
        const completed = !!saved?.completed || progress >= requirement;
        const claimed = !!saved?.claimedAt;
        return {
          ...a,
          progress,
          progressPercent: requirement ? Math.round((progress / requirement) * 100) : 0,
          completed,
          claimed,
          canClaim: completed && !claimed
        };
      });

      res.json(enriched);
    } catch (error: any) {
      console.error('🏆 [ACHIEVEMENTS] Error:', error);
      aiTriage.addEvent({ id: `achievement_fetch_${Date.now()}`, severity: 'moderate', source: 'server', route: '/api/achievements', method: 'GET', message: error.message, stack: error.stack });
      res.json([]);
    }
  });

  // Claim achievement reward (JSON-first)
  app.post("/api/achievements/:achievementId/claim", async (req: Request, res: Response) => {
    try {
      const { achievementId } = req.params;
      const { userId } = req.body || {};
      if (!userId) return res.status(400).json(createErrorResponse('userId is required'));

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json(createErrorResponse('User not found'));

      const achievement = (await fileStorage.getAllAchievements()).find(a => a.id === achievementId);
      if (!achievement) return res.status(404).json(createErrorResponse('Achievement not found'));

      const { data: saved } = await storage.supabase
        .from('userAchievements')
        .select('progress, completed, claimedAt')
        .eq('userId', userId)
        .eq('achievementId', achievementId)
        .maybeSingle();

      if (saved?.claimedAt) return res.status(400).json(createErrorResponse('Achievement already claimed'));

      const requirement = achievement.baseRequirement?.baseTarget ?? achievement.baseRequirement?.value ?? 0;
      const progress = saved?.progress || 0;
      const completed = progress >= requirement;
      if (!completed) return res.status(400).json(createErrorResponse('Achievement not completed yet'));

      // Apply rewards from JSON levels or top-level reward
      let lpDelta = 0; let energyDelta = 0;
      const levels: any[] = achievement.levels || [];
      if (levels.length > 0) {
        const bestLevel = levels.reduce((acc, lvl) => progress >= (lvl.target ?? lvl.targetValue ?? 0) ? lvl : acc, null as any);
        if (bestLevel?.reward?.amount && bestLevel?.reward?.type === 'lp') lpDelta += bestLevel.reward.amount;
      }
      // Fallback: if top-level reward exists
      if (achievement.reward?.type === 'lp') lpDelta += achievement.reward.amount || 0;

      const newLP = (user.lp || 0) + lpDelta;
      const newEnergy = Math.min(user.maxEnergy || 1000, (user.energy || 0) + energyDelta);

      const { error: uerr } = await storage.supabase
        .from('users')
        .update({ lp: newLP, energy: newEnergy })
        .eq('id', userId);
      if (uerr) throw uerr;

      const { error: aerr } = await storage.supabase
        .from('userAchievements')
        .upsert({ userId, achievementId, completed: true, claimedAt: new Date().toISOString(), progress }, { onConflict: 'userId,achievementId' });
      if (aerr) throw aerr;

      res.json(createSuccessResponse({ message: 'Achievement claimed successfully', rewards: { lp: lpDelta, energy: energyDelta }, newStats: { lp: newLP, energy: newEnergy } }));
    } catch (error: any) {
      console.error('🏆 [ACHIEVEMENT_CLAIM] Error:', error);
      aiTriage.addEvent({ id: `achievement_claim_${Date.now()}`, severity: 'critical', source: 'server', route: '/api/achievements/:achievementId/claim', method: 'POST', message: error.message, stack: error.stack });
      res.status(500).json(createErrorResponse(error.message || 'Failed to claim achievement'));
    }
  });

  console.log('🏆 [ROUTES] Achievement routes wired to FileStorage JSON');
}
