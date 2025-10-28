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

  // 🆕 NEW: Update media file metadata (for Edit functionality)
  app.put('/api/media/:mediaId', async (req: Request, res: Response) => {
    try {
      const { mediaId } = req.params;
      const updates = req.body;

      console.log(`📝 [MEDIA] Updating media ${mediaId} with:`, updates);

      // Define allowed fields that can be updated
      const allowedFields = [
        'characterId', 'name', 'mood', 'pose', 'category', 'fileType',
        'isNsfw', 'isVip', 'isEvent', 'randomSendChance', 'requiredLevel',
        'animationSequence', 'enabledForChat', 'autoOrganized'
      ];

      // Filter updates to only allowed fields
      const filteredUpdates = Object.keys(updates)
        .filter(key => allowedFields.includes(key))
        .reduce((obj: any, key) => {
          obj[key] = updates[key];
          return obj;
        }, {});

      console.log(`📝 [MEDIA] Filtered updates:`, filteredUpdates);

      // Perform the update
      const { data, error } = await storage.supabase
        .from('mediaFiles')
        .update(filteredUpdates)
        .eq('id', mediaId)
        .select('*')
        .single();

      if (error) {
        console.error('❌ [MEDIA] Update failed:', error);
        return res.status(500).json(createErrorResponse(`Failed to update media: ${error.message}`));
      }

      if (!data) {
        return res.status(404).json(createErrorResponse('Media file not found'));
      }

      console.log(`✅ [MEDIA] Successfully updated media ${mediaId}`);

      res.json(createSuccessResponse({
        media: data,
        message: 'Media updated successfully'
      }));

    } catch (error) {
      console.error('Error updating media:', error);
      res.status(500).json(createErrorResponse('Failed to update media'));
    }
  });

  // 🆕 NEW: Get single media file (for editing form prefill)
  app.get('/api/media/file/:mediaId', async (req: Request, res: Response) => {
    try {
      const { mediaId } = req.params;

      const { data, error } = await storage.supabase
        .from('mediaFiles')
        .select('*')
        .eq('id', mediaId)
        .single();

      if (error) {
        return res.status(404).json(createErrorResponse('Media file not found'));
      }

      res.json(createSuccessResponse(data));
    } catch (error) {
      console.error('Error fetching media file:', error);
      res.status(500).json(createErrorResponse('Failed to fetch media'));
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