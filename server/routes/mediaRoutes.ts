import type { Express, Request, Response } from 'express';
import { createErrorResponse, createSuccessResponse } from '../utils/helpers';
import { SupabaseStorage } from '../../shared/SupabaseStorage';
import { MediaStorage } from '../../shared/MediaStorage';

const media = MediaStorage.getInstance();
const storage = SupabaseStorage.getInstance();

export function registerMediaRoutes(app: Express) {
  // List media for a character with filters
  app.get('/api/media/:characterId', async (req: Request, res: Response) => {
    try {
      const { characterId } = req.params;
      const { tags, nsfw, vip, enabledForChat, enabledForRandomSend, limit } = req.query as any;
      const list = await media.getMediaByCharacter(characterId, {
        tags: tags ? String(tags).split(',').filter(Boolean) : undefined,
        nsfw: nsfw !== undefined ? nsfw === 'true' : undefined,
        vip: vip !== undefined ? vip === 'true' : undefined,
        enabledForChat: enabledForChat !== undefined ? enabledForChat === 'true' : undefined,
        enabledForRandomSend: enabledForRandomSend !== undefined ? enabledForRandomSend === 'true' : undefined,
        limit: limit ? Number(limit) : undefined
      });
      res.json(list);
    } catch (e: any) {
      res.status(500).json(createErrorResponse(e.message || 'Failed to list media'));
    }
  });

  // Random media selection (logs history)
  app.post('/api/media/:characterId/random', async (req: Request, res: Response) => {
    try {
      const { characterId } = req.params;
      const { userId } = req.body || {};
      if (!userId) return res.status(400).json(createErrorResponse('userId is required'));

      // TODO: leverage userMediaHistory for cooldown; basic random for now
      const item = await media.getRandomMedia(characterId, { enabledForRandomSend: true });
      if (!item) return res.status(404).json(createErrorResponse('No eligible media found'));

      // Optional: log send for cooldown analytics (requires userMediaHistory table in DB)
      // await storage.supabase.from('userMediaHistory').insert({ userId, characterId, mediaId: item.id, sentAt: new Date().toISOString() });

      res.json(createSuccessResponse({ item }));
    } catch (e: any) {
      res.status(500).json(createErrorResponse(e.message || 'Failed to select random media'));
    }
  });

  // Admin upsert
  app.post('/api/media/:characterId', async (req: Request, res: Response) => {
    try {
      const { characterId } = req.params;
      const item = await media.upsertMedia(characterId, req.body);
      res.json(createSuccessResponse(item));
    } catch (e: any) {
      res.status(500).json(createErrorResponse(e.message || 'Failed to upsert media'));
    }
  });

  // Admin delete
  app.delete('/api/media/:characterId/:id', async (req: Request, res: Response) => {
    try {
      const { characterId, id } = req.params;
      const ok = await media.deleteMedia(characterId, id);
      if (!ok) return res.status(404).json(createErrorResponse('Not found'));
      res.json(createSuccessResponse({ deleted: true }));
    } catch (e: any) {
      res.status(500).json(createErrorResponse(e.message || 'Failed to delete media'));
    }
  });
}
