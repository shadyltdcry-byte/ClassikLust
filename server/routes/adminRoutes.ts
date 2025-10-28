import type { Express, Request, Response } from "express";
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import crypto from 'crypto';
import { SupabaseStorage } from '../../shared/SupabaseStorage';
import {
  createSuccessResponse,
  createErrorResponse,
  isValidMediaType,
  getFileExtension
} from '../utils/helpers';

// Initialize storage instance
const storage = SupabaseStorage.getInstance();

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const __dirname = path.dirname(new URL(import.meta.url).pathname);
      const uploadsDir = path.join(__dirname, '../../public/uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const fileName = `uploaded_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`;
      cb(null, fileName);
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, isValidMediaType(file.mimetype));
  }
});

// UNIVERSAL NORMALIZERS - handle ALL column naming variations
function normalizeUpgradeWrite(u: any) {
  const n = {
    name: u.name,
    description: u.description,
    category: u.category,
    icon: u.icon,
    // Handle ALL variations of numeric fields
    baseCost: Number(u.baseCost ?? u.basecost ?? u['base-cost'] ?? 100),
    hourlyBonus: Number(u.hourlyBonus ?? u.hourlybonus ?? u['hourly-bonus'] ?? 0),
    tapBonus: Number(u.tapBonus ?? u.tapbonus ?? u['tap-bonus'] ?? 0),
    currentLevel: Number(u.currentLevel ?? u.currentlevel ?? u['current-level'] ?? 0),
    maxLevel: Number(u.maxLevel ?? u.maxlevel ?? u['max-level'] ?? 10),
    sortOrder: Number(u.sortOrder ?? u.sortorder ?? u['sort-order'] ?? 0),
    costMultiplier: Number(u.costMultiplier ?? u.costmultiplier ?? u['cost-multiplier'] ?? 1.5),
    baseEffect: Number(u.baseEffect ?? u.baseeffect ?? u['base-effect'] ?? 1),
    effectMultiplier: Number(u.effectMultiplier ?? u.effectmultiplier ?? u['effect-multiplier'] ?? 1.1),
    requiredLevel: Number(u.requiredLevel ?? u.requiredlevel ?? u['required-level'] ?? 1),
  };
  // Remove undefined/NaN values
  Object.keys(n).forEach(k => {
    const val = (n as any)[k];
    if (val === undefined || (typeof val === 'number' && isNaN(val))) {
      delete (n as any)[k];
    }
  });
  console.log('🔧 [NORMALIZE-UPGRADE]', { input: Object.keys(u), output: Object.keys(n) });
  return n;
}

function normalizeMediaWrite(m: any) {
  const n = {
    characterId: m.characterId ?? m.characterid ?? m['character-id'],
    fileName: m.fileName ?? m.filename ?? m['file-name'],
    filePath: m.filePath ?? m.filepath ?? m['file-path'],
    fileType: m.fileType ?? m.filetype ?? m['file-type'],
    isNsfw: Boolean(m.isNsfw ?? m.isnsfw ?? m['is-nsfw'] ?? false),
    isVip: Boolean(m.isVip ?? m.isvip ?? m['is-vip'] ?? false),
    isEvent: Boolean(m.isEvent ?? m.isevent ?? m['is-event'] ?? false),
    enabledForChat: Boolean(m.enabledForChat ?? m.enabledforchat ?? m['enabled-for-chat'] ?? true),
    randomSendChance: Number(m.randomSendChance ?? m.randomsendchance ?? m['random-send-chance'] ?? 5),
    requiredLevel: Number(m.requiredLevel ?? m.requiredlevel ?? m['required-level'] ?? 1),
    mood: m.mood,
    pose: m.pose,
    animationSequence: m.animationSequence ?? m.animationsequence,
    category: m.category,
    autoOrganized: Boolean(m.autoOrganized ?? m.autoorganized ?? false),
  };
  // Remove undefined/null
  Object.keys(n).forEach(k => {
    const val = (n as any)[k];
    if (val === undefined || (typeof val === 'number' && isNaN(val))) {
      delete (n as any)[k];
    }
  });
  console.log('🔧 [NORMALIZE-MEDIA]', { input: Object.keys(m), output: Object.keys(n) });
  return n;
}

function normalizeLevelReqWrite(l: any) {
  const n = {
    level: Number(l.level ?? 1),
    lpRequired: Number(l.lpRequired ?? l.lprequired ?? l['lp-required'] ?? 100),
    name: l.name || `Level ${l.level ?? 1}`,
    description: l.description || 'Level up requirement',
  };
  Object.keys(n).forEach(k => {
    const val = (n as any)[k];
    if (val === undefined || (typeof val === 'number' && isNaN(val))) {
      delete (n as any)[k];
    }
  });
  console.log('🔧 [NORMALIZE-LEVEL]', { input: Object.keys(l), output: Object.keys(n) });
  return n;
}

export function registerAdminRoutes(app: Express) {

  // Admin Upgrades - WITH PERSISTENCE VERIFICATION
  app.get('/api/admin/upgrades', async (req: Request, res: Response) => {
    try {
      const upgrades = await storage.getAllUpgrades();
      console.log(`📦 [ADMIN] Returning ${(upgrades || []).length} upgrades`);
      res.json(upgrades);
    } catch (error) {
      console.error('Error fetching admin upgrades:', error);
      res.status(500).json(createErrorResponse('Failed to fetch upgrades'));
    }
  });

  app.post('/api/admin/upgrades', async (req: Request, res: Response) => {
    try {
      const upgradeData = normalizeUpgradeWrite(req.body || {});
      console.log('🆕 [ADMIN] Creating upgrade:', upgradeData);
      const newUpgrade = await storage.createUpgrade(upgradeData);
      console.log('✅ [ADMIN] Created upgrade:', newUpgrade?.id);
      res.json(createSuccessResponse(newUpgrade));
    } catch (error) {
      console.error('❌ [ADMIN] Error creating upgrade:', error);
      res.status(500).json(createErrorResponse('Failed to create upgrade'));
    }
  });

  app.put('/api/admin/upgrades/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = normalizeUpgradeWrite(req.body || {});
      console.log('🔄 [ADMIN] Updating upgrade:', id, 'with:', updates);
      
      // Get BEFORE values for comparison
      const beforeUpgrade = await storage.getUpgrade(id);
      console.log('📋 [ADMIN] Before update:', beforeUpgrade);
      
      const updatedUpgrade = await storage.updateUpgrade(id, updates);
      console.log('📋 [ADMIN] After update:', updatedUpgrade);
      
      // DETECT NO-OP UPDATES
      if (beforeUpgrade && updatedUpgrade) {
        const changed = Object.keys(updates).some(key => 
          String(beforeUpgrade[key]) !== String(updatedUpgrade[key])
        );
        if (!changed) {
          console.warn('⚠️ [ADMIN] UPDATE NO-OP: No fields actually changed!');
          console.warn('⚠️ [ADMIN] This suggests column name mismatch!');
        }
      }
      
      res.json(createSuccessResponse(updatedUpgrade));
    } catch (error) {
      console.error('❌ [ADMIN] Error updating upgrade:', error);
      res.status(500).json(createErrorResponse('Failed to update upgrade'));
    }
  });

  app.delete('/api/admin/upgrades/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteUpgrade(id);
      res.json(createSuccessResponse({ message: 'Upgrade deleted successfully' }));
    } catch (error) {
      console.error('Error deleting upgrade:', error);
      res.status(500).json(createErrorResponse('Failed to delete upgrade'));
    }
  });

  // Admin Characters
  app.get('/api/admin/characters', async (req: Request, res: Response) => {
    try {
      const characters = await storage.getAllCharacters();
      res.json(characters);
    } catch (error) {
      console.error('Error fetching characters:', error);
      res.status(500).json(createErrorResponse('Failed to fetch characters'));
    }
  });

  app.post('/api/admin/characters', async (req: Request, res: Response) => {
    try {
      const characterData = req.body;
      const newCharacter = await storage.createCharacter(characterData);
      res.json(createSuccessResponse(newCharacter));
    } catch (error) {
      console.error('Error creating character:', error);
      res.status(500).json(createErrorResponse('Failed to create character'));
    }
  });

  app.put('/api/admin/characters/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedCharacter = await storage.updateCharacter(id, updates);
      res.json(createSuccessResponse(updatedCharacter));
    } catch (error) {
      console.error('Error updating character:', error);
      res.status(500).json(createErrorResponse('Failed to update character'));
    }
  });

  app.delete('/api/admin/characters/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteCharacter(id);
      res.json(createSuccessResponse({ message: 'Character deleted successfully' }));
    } catch (error) {
      console.error('Error deleting character:', error);
      res.status(500).json(createErrorResponse('Failed to delete character'));
    }
  });

  // Admin Media - WITH FULL FIELD NORMALIZATION
  app.get('/api/media', async (req: Request, res: Response) => {
    try {
      const mediaFiles = await storage.getAllMedia();
      res.json(mediaFiles || []);
    } catch (error) {
      console.error('Error fetching media:', error);
      res.json([]);
    }
  });

  app.post('/api/media/upload', upload.array('files'), async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json(createErrorResponse('No files uploaded'));
      }
      const uploadedFiles = [];
      for (const file of files) {
        const mediaEntry = normalizeMediaWrite({
          mood: null,
          isNsfw: req.body.isNsfw === 'true' || false,
          isVip: req.body.isVip === 'true' || false,
          isEvent: req.body.isEvent === 'true' || false,
          characterId: req.body.characterId || null,
          fileName: file.originalname,
          filePath: `/uploads/${file.filename}`,
          fileType: file.mimetype?.startsWith('image/') ? 'image' : file.mimetype?.startsWith('video/') ? 'video' : 'file',
          pose: null,
          animationSequence: null,
          randomSendChance: parseInt(req.body.randomSendChance) || 5,
          requiredLevel: parseInt(req.body.requiredLevel) || 1,
          enabledForChat: true,
          autoOrganized: false,
          category: req.body.category || 'Character'
        });
        console.log('📎 [MEDIA] Creating:', mediaEntry);
        const created = await storage.createMedia(mediaEntry);
        uploadedFiles.push(created);
      }
      res.json(createSuccessResponse({ message: `Successfully uploaded ${uploadedFiles.length} files`, files: uploadedFiles }));
    } catch (error) {
      console.error('❌ [MEDIA] Upload error:', error);
      res.status(500).json(createErrorResponse('Failed to upload files'));
    }
  });

  app.put('/api/media/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = normalizeMediaWrite(req.body || {});
      console.log('🔄 [MEDIA] Updating:', id, 'with:', updates);
      
      const updatedMedia = await storage.updateMedia(id, updates);
      console.log('✅ [MEDIA] Updated result:', updatedMedia?.id);
      res.json(createSuccessResponse(updatedMedia));
    } catch (error) {
      console.error('❌ [MEDIA] Update error:', error);
      res.status(500).json(createErrorResponse('Failed to update media'));
    }
  });

  app.delete('/api/media/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteMedia(id);
      res.json(createSuccessResponse({ message: 'Media deleted successfully' }));
    } catch (error) {
      console.error('Error deleting media:', error);
      res.status(500).json(createErrorResponse('Failed to delete media'));
    }
  });

  // Admin Tasks
  app.get('/api/admin/tasks', async (req: Request, res: Response) => {
    try {
      const tasks: any[] = [];
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json(createErrorResponse('Failed to fetch tasks'));
    }
  });

  app.post('/api/admin/tasks', async (req: Request, res: Response) => {
    try {
      const taskData = {
        id: crypto.randomUUID(),
        name: req.body.name || 'New Task',
        description: req.body.description || 'Task description',
        category: req.body.category || 'general',
        reward: req.body.reward || 100,
        rewardType: req.body.rewardType || 'lp',
        completed: false,
        progress: 0,
        maxProgress: req.body.maxProgress || 1,
        createdAt: new Date().toISOString()
      };
      console.log('Task created (mock):', taskData);
      res.json(createSuccessResponse(taskData));
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json(createErrorResponse('Failed to create task'));
    }
  });

  app.put('/api/admin/tasks/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedTask = { id, ...updates, updatedAt: new Date().toISOString() };
      console.log('Task updated (mock):', updatedTask);
      res.json(createSuccessResponse(updatedTask));
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json(createErrorResponse('Failed to update task'));
    }
  });

  app.delete('/api/admin/tasks/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      res.json(createSuccessResponse({ message: 'Task deleted successfully' }));
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json(createErrorResponse('Failed to delete task'));
    }
  });

  // Admin Achievements
  app.get('/api/admin/achievements', async (req: Request, res: Response) => {
    try {
      const achievements = await storage.getAchievements();
      res.json(achievements || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      res.json([]);
    }
  });

  app.post('/api/admin/achievements', async (req: Request, res: Response) => {
    try {
      const achievementData = {
        id: crypto.randomUUID(),
        name: req.body.name || 'New Achievement',
        description: req.body.description || 'Achievement description',
        category: req.body.category || 'general',
        reward: Number(req.body.reward ?? 500),
        rewardType: req.body.rewardType || 'lp',
        icon: req.body.icon || '🏆',
        completed: false,
        progress: 0,
        maxProgress: Number(req.body.maxProgress ?? 1),
        sortOrder: Number(req.body.sortOrder ?? 0),
        createdAt: new Date().toISOString()
      };
      const newAchievement = await storage.createAchievement(achievementData);
      res.json(createSuccessResponse(newAchievement));
    } catch (error) {
      console.error('Error creating achievement:', error);
      res.status(500).json(createErrorResponse('Failed to create achievement'));
    }
  });

  app.put('/api/admin/achievements/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedAchievement = await storage.updateAchievement(id, updates);
      res.json(createSuccessResponse(updatedAchievement));
    } catch (error) {
      console.error('Error updating achievement:', error);
      res.status(500).json(createErrorResponse('Failed to update achievement'));
    }
  });

  app.delete('/api/admin/achievements/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteAchievement(id);
      res.json(createSuccessResponse({ message: 'Achievement deleted successfully' }));
    } catch (error) {
      console.error('Error deleting achievement:', error);
      res.status(500).json(createErrorResponse('Failed to delete achievement'));
    }
  });

  // Admin Level Requirements - WITH FULL NORMALIZATION
  app.get('/api/admin/level-requirements', async (req: Request, res: Response) => {
    try {
      const levelRequirements = await storage.getLevelRequirements();
      console.log(`📊 [ADMIN] Returning ${(levelRequirements || []).length} level requirements`);
      res.json(levelRequirements || []);
    } catch (error) {
      console.error('❌ [ADMIN] Error fetching level requirements:', error);
      res.json([]);
    }
  });

  app.post('/api/admin/level-requirements', async (req: Request, res: Response) => {
    try {
      const levelReqData = {
        id: crypto.randomUUID(),
        ...normalizeLevelReqWrite(req.body || {}),
        createdAt: new Date().toISOString()
      };
      console.log('🆕 [ADMIN] Creating level requirement:', levelReqData);
      const newLevelReq = await storage.createLevelRequirement(levelReqData);
      console.log('✅ [ADMIN] Created level requirement:', newLevelReq?.id);
      res.json(createSuccessResponse(newLevelReq));
    } catch (error) {
      console.error('❌ [ADMIN] Error creating level requirement:', error);
      res.status(500).json(createErrorResponse(`Failed to create level requirement: ${error.message}`));
    }
  });

  app.put('/api/admin/level-requirements/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = normalizeLevelReqWrite(req.body || {});
      console.log('🔄 [ADMIN] Updating level requirement:', id, 'with:', updates);
      const updatedLevelReq = await storage.updateLevelRequirement(id, updates);
      console.log('✅ [ADMIN] Updated level requirement:', updatedLevelReq?.id);
      res.json(createSuccessResponse(updatedLevelReq));
    } catch (error) {
      console.error('❌ [ADMIN] Error updating level requirement:', error);
      res.status(500).json(createErrorResponse(`Failed to update level requirement: ${error.message}`));
    }
  });

  app.delete('/api/admin/level-requirements/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteLevelRequirement(id);
      res.json(createSuccessResponse({ message: 'Level requirement deleted successfully' }));
    } catch (error) {
      console.error('Error deleting level requirement:', error);
      res.status(500).json(createErrorResponse('Failed to delete level requirement'));
    }
  });

  console.log('✅ Admin routes registered with FULL field normalization and update verification');
}
