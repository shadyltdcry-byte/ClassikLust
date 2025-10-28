import type { Express, Request, Response } from "express";
import { SupabaseStorage } from "../../shared/SupabaseStorage";

const storage = SupabaseStorage.getInstance();

export function registerAdminRoutes(app: Express) {
  // Achievements
  app.get('/api/admin/achievements', async (req: Request, res: Response) => {
    try {
      const items = await storage.getAchievements();
      res.json(items);
    } catch (e:any) {
      res.status(500).json({ error: e.message || 'Failed to fetch achievements' });
    }
  });

  app.post('/api/admin/achievements', async (req: Request, res: Response) => {
    try {
      const created = await storage.createAchievement(req.body);
      res.json({ success: true, data: created });
    } catch (e:any) {
      res.status(500).json({ error: e.message || 'Failed to create achievement' });
    }
  });

  app.put('/api/admin/achievements/:id', async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateAchievement(req.params.id, req.body);
      res.json({ success: true, data: updated });
    } catch (e:any) {
      res.status(500).json({ error: e.message || 'Failed to update achievement' });
    }
  });

  app.delete('/api/admin/achievements/:id', async (req: Request, res: Response) => {
    try {
      await storage.deleteAchievement(req.params.id);
      res.json({ success: true });
    } catch (e:any) {
      res.status(500).json({ error: e.message || 'Failed to delete achievement' });
    }
  });

  // Level requirements
  app.get('/api/admin/level-requirements', async (req: Request, res: Response) => {
    try {
      const items = await storage.getLevelRequirements();
      res.json(items);
    } catch (e:any) {
      res.status(500).json({ error: e.message || 'Failed to fetch level requirements' });
    }
  });

  app.post('/api/admin/level-requirements', async (req: Request, res: Response) => {
    try {
      const created = await storage.createLevelRequirement(req.body);
      res.json({ success: true, data: created });
    } catch (e:any) {
      res.status(500).json({ error: e.message || 'Failed to create level requirement' });
    }
  });

  app.put('/api/admin/level-requirements/:id', async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateLevelRequirement(req.params.id, req.body);
      res.json({ success: true, data: updated });
    } catch (e:any) {
      res.status(500).json({ error: e.message || 'Failed to update level requirement' });
    }
  });

  app.delete('/api/admin/level-requirements/:id', async (req: Request, res: Response) => {
    try {
      await storage.deleteLevelRequirement(req.params.id);
      res.json({ success: true });
    } catch (e:any) {
      res.status(500).json({ error: e.message || 'Failed to delete level requirement' });
    }
  });
}
