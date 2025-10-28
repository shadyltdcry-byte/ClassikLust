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

  // 🎯 NEW: Initial upload with full metadata support
  app.post('/api/media/upload', async (req: Request, res: Response) => {
    try {
      const metadata = req.body;
      console.log('📤 [UPLOAD] Received metadata:', metadata);

      // Validate required fields
      if (!metadata.fileName || !metadata.filePath || !metadata.fileType) {
        return res.status(400).json(createErrorResponse('fileName, filePath, and fileType are required'));
      }

      // Prepare insert data with all metadata
      const insertData = {
        fileName: metadata.fileName,
        filePath: metadata.filePath,
        fileType: metadata.fileType,
        characterId: metadata.characterId || null,
        name: metadata.name || null,
        mood: metadata.mood || null,
        pose: metadata.pose || null,
        poses: JSON.stringify(metadata.poses || []), // Store poses as JSONB array
        category: metadata.category || 'Character',
        isNsfw: Boolean(metadata.isNsfw),
        isVip: Boolean(metadata.isVip),
        isEvent: Boolean(metadata.isEvent),
        enabledForChat: Boolean(metadata.enabledForChat !== false), // Default true
        randomSendChance: Number(metadata.randomSendChance) || 5,
        requiredLevel: Number(metadata.requiredLevel) || 1,
        animationSequence: Number(metadata.animationSequence) || null,
        autoOrganized: Boolean(metadata.autoOrganized)
      };

      console.log('📤 [UPLOAD] Inserting with data:', insertData);

      // Insert into database
      const { data, error } = await storage.supabase
        .from('mediaFiles')
        .insert(insertData)
        .select('*')
        .single();

      if (error) {
        console.error('❌ [UPLOAD] Insert failed:', error);
        return res.status(500).json(createErrorResponse(`Upload failed: ${error.message}`));
      }

      console.log('✅ [UPLOAD] File inserted successfully:', data.id);

      res.json(createSuccessResponse({
        media: data,
        message: 'File uploaded and metadata saved'
      }));

    } catch (error) {
      console.error('Error uploading media:', error);
      res.status(500).json(createErrorResponse('Upload failed'));
    }
  });

  // 🔄 UPDATED: Media update with poses support
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
        .filter(key => allowedFields.includes(key) || key === 'poses')
        .reduce((obj: any, key) => {
          if (key === 'poses' && Array.isArray(updates[key])) {
            // Store poses as JSONB array, ensure uniqueness
            const uniquePoses = [...new Set(updates[key].filter(Boolean))];
            obj[key] = JSON.stringify(uniquePoses);
          } else {
            obj[key] = updates[key];
          }
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

  // 🔍 UPDATED: Get single media file with poses support
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

      // Parse poses from JSONB
      if (data.poses) {
        try {
          data.poses = JSON.parse(data.poses);
        } catch {
          data.poses = [];
        }
      } else {
        data.poses = [];
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

  // Admin upsert (legacy)
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