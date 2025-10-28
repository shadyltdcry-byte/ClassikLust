/**
 * Update display picture endpoints to use telegramId column
 */
import type { Express, Request, Response } from "express";
import { SupabaseStorage } from '../../shared/SupabaseStorage';
import { 
  isValidUUID, 
  isValidTelegramId,
  createSuccessResponse, 
  createErrorResponse 
} from '../utils/helpers';

const storage = SupabaseStorage.getInstance();

export function registerDisplayPictureRoutes(app: Express) {
  // Set display picture (supports telegram users)
  app.post('/api/user/set-display-picture', async (req: Request, res: Response) => {
    try {
      const { userId, imagePath } = req.body;
      if (!userId || !imagePath) return res.status(400).json(createErrorResponse('userId and imagePath are required'));

      let queryField = 'id';
      let queryValue: string = userId;

      if (userId.startsWith('telegram_')) {
        queryField = 'telegramId';
        queryValue = userId.replace('telegram_', '');
      } else if (!isValidUUID(userId)) {
        return res.status(400).json(createErrorResponse('Invalid user ID format'));
      }

      const { data, error } = await storage.supabase
        .from('users')
        .update({ displayPicture: imagePath })
        .eq(queryField, queryValue)
        .select()
        .single();

      if (error) return res.status(500).json(createErrorResponse('Failed to update display picture'));
      if (!data) return res.status(404).json(createErrorResponse('User not found'));

      res.json(createSuccessResponse({ displayPicture: imagePath, user: data }));
    } catch (error) {
      res.status(500).json(createErrorResponse('Internal server error'));
    }
  });

  // Reset display picture
  app.post('/api/user/reset-display-picture', async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json(createErrorResponse('userId is required'));

      let queryField = 'id';
      let queryValue: string = userId;

      if (userId.startsWith('telegram_')) {
        queryField = 'telegramId';
        queryValue = userId.replace('telegram_', '');
      } else if (!isValidUUID(userId)) {
        return res.status(400).json(createErrorResponse('Invalid user ID format'));
      }

      const { data, error } = await storage.supabase
        .from('users')
        .update({ displayPicture: null })
        .eq(queryField, queryValue)
        .select()
        .single();

      if (error) return res.status(500).json(createErrorResponse('Failed to reset display picture'));
      if (!data) return res.status(404).json(createErrorResponse('User not found'));

      res.json(createSuccessResponse({ user: data }));
    } catch (error) {
      res.status(500).json(createErrorResponse('Internal server error'));
    }
  });
}
