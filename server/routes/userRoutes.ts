/**
 * userRoutes.ts - User Management and Telegram Authentication Routes  
 * Last Edited: 2025-10-28 by Assistant - Fixed UUID validation for display picture
 * 
 * Handles user creation, Telegram authentication, and user data management
 * FIXED: Display picture selection now works with telegram user IDs
 */

import type { Express, Request, Response } from "express";
import { SupabaseStorage } from '../../shared/SupabaseStorage';
import { 
  isValidUUID, 
  isValidTelegramId, 
  verifyTelegramAuth, 
  generateJWT,
  createSuccessResponse, 
  createErrorResponse 
} from '../utils/helpers';
import { reportToLuna } from '../services/LunaErrorMonitor';

const storage = SupabaseStorage.getInstance();

// Global auth cache to avoid repeated database calls
declare global {
  var recentTelegramAuth: Map<string, {
    user: any,
    token: string,
    timestamp: number
  }> | undefined;
}

// Initialize auth cache
if (!global.recentTelegramAuth) {
  global.recentTelegramAuth = new Map();
}

export function registerUserRoutes(app: Express) {

  // 🇮🇳 FIXED: Set display picture from character gallery (handles telegram IDs)
  app.post('/api/user/set-display-picture', async (req: Request, res: Response) => {
    try {
      const { userId, imagePath } = req.body;
      
      if (!userId || !imagePath) {
        return res.status(400).json(createErrorResponse('userId and imagePath are required'));
      }
      
      console.log(`🖼️ [USER] Setting display picture for user ${userId}: ${imagePath}`);
      
      // 🔧 FIXED: Handle telegram user IDs properly
      let queryUserId = userId;
      let queryField = 'id';
      
      if (userId.startsWith('telegram_')) {
        // For telegram users, query by telegram field instead of UUID id
        const telegramId = userId.replace('telegram_', '');
        queryUserId = telegramId;
        queryField = 'telegram';
        console.log(`📱 [USER] Using telegram query: ${queryField} = ${queryUserId}`);
      } else if (!isValidUUID(userId)) {
        console.error('❌ [USER] Invalid user ID format:', userId);
        return res.status(400).json(createErrorResponse('Invalid user ID format'));
      }
      
      // Update user's displayPicture field in database
      const { data, error } = await storage.supabase
        .from('users')
        .update({ displayPicture: imagePath })
        .eq(queryField, queryUserId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ [USER] Database error setting display picture:', error);
        return res.status(500).json(createErrorResponse('Failed to update display picture'));
      }
      
      if (!data) {
        console.error('❌ [USER] User not found:', userId);
        return res.status(404).json(createErrorResponse('User not found'));
      }
      
      console.log('✅ [USER] Display picture updated successfully for user:', data.id);
      
      res.json(createSuccessResponse({
        message: 'Display picture updated successfully',
        displayPicture: imagePath,
        user: data
      }));
      
    } catch (error) {
      console.error('❌ [USER] Error setting display picture:', error);
      res.status(500).json(createErrorResponse('Internal server error'));
    }
  });
  
  // 🔄 FIXED: Reset display picture to default (handles telegram IDs)
  app.post('/api/user/reset-display-picture', async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json(createErrorResponse('userId is required'));
      }
      
      console.log(`🔄 [USER] Resetting display picture for user ${userId}`);
      
      // 🔧 FIXED: Handle telegram user IDs properly
      let queryUserId = userId;
      let queryField = 'id';
      
      if (userId.startsWith('telegram_')) {
        const telegramId = userId.replace('telegram_', '');
        queryUserId = telegramId;
        queryField = 'telegram';
        console.log(`📱 [USER] Using telegram query: ${queryField} = ${queryUserId}`);
      } else if (!isValidUUID(userId)) {
        console.error('❌ [USER] Invalid user ID format:', userId);
        return res.status(400).json(createErrorResponse('Invalid user ID format'));
      }

      const { data, error } = await storage.supabase
        .from('users')
        .update({ displayPicture: null })
        .eq(queryField, queryUserId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ [USER] Database error resetting display picture:', error);
        return res.status(500).json(createErrorResponse('Failed to reset display picture'));
      }
      
      if (!data) {
        console.error('❌ [USER] User not found:', userId);
        return res.status(404).json(createErrorResponse('User not found'));
      }
      
      console.log('✅ [USER] Display picture reset to default for user:', data.id);
      
      res.json(createSuccessResponse({
        message: 'Display picture reset to default',
        user: data
      }));
      
    } catch (error) {
      console.error('❌ [USER] Error resetting display picture:', error);
      res.status(500).json(createErrorResponse('Internal server error'));
    }
  });

  // User initialization endpoint
  app.post("/api/user/init", async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json(createErrorResponse('User ID required'));
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json(createErrorResponse('User not found'));
      }
      
      res.json(createSuccessResponse({ user }));
    } catch (error) {
      console.error('Error initializing user:', error);
      res.status(500).json(createErrorResponse('Failed to initialize user'));
    }
  });

  // Get user data (supports both UUID and Telegram ID formats)
  app.get("/api/user/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      // Check if userId is valid UUID or telegram format
      if (!isValidUUID(userId) && !isValidTelegramId(userId)) {
        return res.status(400).json(createErrorResponse('Invalid user ID format'));
      }

      // Try to get user from storage
      const user = await storage.getUser(userId);
      if (user) {
        return res.json(user);
      }

      // User not found
      return res.status(404).json(createErrorResponse('User not found'));

    } catch (error) {
      console.error('Error in user endpoint:', error);
      res.status(500).json(createErrorResponse('Failed to get user'));
    }
  });

  // Get user profile with display picture (handles telegram IDs)
  app.get('/api/user/:userId/profile', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      // 🔧 FIXED: Handle telegram user IDs properly
      let queryUserId = userId;
      let queryField = 'id';
      
      if (userId.startsWith('telegram_')) {
        const telegramId = userId.replace('telegram_', '');
        queryUserId = telegramId;
        queryField = 'telegram';
      } else if (!isValidUUID(userId)) {
        return res.status(400).json(createErrorResponse('Invalid user ID format'));
      }
      
      const { data, error } = await storage.supabase
        .from('users')
        .select('id, username, displayName, displayPicture, level, lp, xp, energy, maxEnergy, telegram')
        .eq(queryField, queryUserId)
        .single();
      
      if (error) {
        console.error('❌ [USER] Database error fetching profile:', error);
        return res.status(404).json(createErrorResponse('User not found'));
      }
      
      res.json(createSuccessResponse(data));
      
    } catch (error) {
      console.error('❌ [USER] Error fetching user profile:', error);
      res.status(500).json(createErrorResponse('Internal server error'));
    }
  });

  // Player endpoint (similar to user but with different logic)
  app.get("/api/player/:playerId", async (req: Request, res: Response) => {
    try {
      const { playerId } = req.params;

      // Get real user ID if telegram format
      let realUserId = playerId;
      if (playerId.startsWith('telegram_')) {
        const telegramId = playerId.replace('telegram_', '');
        try {
          const user = await storage.getUser(`telegram_${telegramId}`);
          if (user?.id) {
            // Keep telegram format for API consistency 
            realUserId = `telegram_${telegramId}`;
          } else {
            // Create real database user for authenticated Telegram user
            const existingCheck = await storage.getUser(`telegram_${telegramId}`);
            if (!existingCheck) {
              console.log(`Creating database user for authenticated Telegram user: ${playerId}`);
              const newUser = await storage.createUser({
                telegramId: telegramId,
                username: `Player${telegramId}`,
                password: 'telegramAuth',
                level: 1,
                lp: 5000,
                lpPerHour: 250,
                lpPerTap: 2,
                energy: 1000,
                maxEnergy: 1000,
                charisma: 0,
                vipStatus: false,
                nsfwConsent: false
              });
              return res.json(newUser);
            }
          }
        } catch (dbError) {
          console.error('Database lookup error:', dbError);
          return res.status(404).json(createErrorResponse('Player not found'));
        }
      }

      let user = await storage.getUser(realUserId);
      
      // Ensure response uses telegram format for consistency
      if (user && realUserId.startsWith('telegram_')) {
        user.id = realUserId;
      }

      if (!user) {
        // Create default user if not exists - using timestamp-based username to avoid duplicates
        user = await storage.createUser({
          username: `Player${Date.now()}`,
          password: 'telegramAuth',
          level: 1,
          lp: 5000,
          lpPerHour: 250,
          lpPerTap: 2,
          energy: 1000,
          maxEnergy: 1000,
          charisma: 0,
          vipStatus: false,
          nsfwConsent: false
        });
      }

      res.json(user);
    } catch (error) {
      console.error('Error fetching player:', error as Error);
      res.status(500).json(createErrorResponse('Failed to fetch player data'));
    }
  });

  // Player update endpoint
  app.put("/api/player/:playerId", async (req: Request, res: Response) => {
    try {
      const { playerId } = req.params;
      const requestData = req.body;

      // If playerId is not a valid UUID, return error
      if (!isValidUUID(playerId) && !isValidTelegramId(playerId)) {
        return res.status(400).json(createErrorResponse('Invalid player ID format'));
      }

      // Filter out invalid fields that don't exist in users table
      // Only allow valid user table columns to prevent PGRST204 errors
      const validUserFields = [
        'username', 'level', 'lp', 'energy', 'maxEnergy', 'charisma', 
        'lpPerHour', 'lpPerTap', 'vipStatus', 'nsfwConsent', 'lastTick', 'lastWheelSpin',
        'displayPicture' // 🆕 Allow displayPicture updates
      ];
      
      const updates = Object.keys(requestData)
        .filter(key => validUserFields.includes(key))
        .reduce((obj: any, key) => {
          obj[key] = requestData[key];
          return obj;
        }, {});

      // Handle achievements separately if present (they go to user_achievements table)
      if (requestData.achievements) {
        console.log(`[UPDATE] Achievements data received but filtered out - should use separate achievements API`);
        // TODO: Process achievements via user_achievements table in future
      }

      const updatedUser = await storage.updateUser(playerId, updates);
      if (!updatedUser) {
        reportToLuna('error', 'User API', `Player update failed: User ${playerId} not found`, undefined, playerId);
        return res.status(404).json(createErrorResponse('User not found'));
      }

      res.json(createSuccessResponse({
        user: updatedUser,
        message: 'Player updated successfully'
      }));
    } catch (error) {
      console.error('Error updating player:', error);
      reportToLuna('error', 'User API', 'Player update failed with server error', error as Error, playerId);
      res.status(500).json(createErrorResponse('Failed to update player'));
    }
  });

  // Telegram authentication status check
  app.get('/api/auth/telegram/status/:telegramId', async (req: Request, res: Response) => {
    const telegramId = req.params.telegramId;
    
    try {
      // Check cache first to avoid repeated database calls
      const cached = global.recentTelegramAuth?.get(telegramId);
      if (cached && (Date.now() - cached.timestamp) < 30000) { // 30 second cache
        console.log(`[DEBUG] Found recent auth for ${telegramId}`);
        return res.json({
          authenticated: true,
          user: cached.user,
          token: cached.token
        });
      }
      
      // Check if user exists in database
      const user = await storage.getUser(`telegram_${telegramId}`);
      if (user) {
        const token = generateJWT(`telegram_${telegramId}`);
        
        // Cache the result
        global.recentTelegramAuth?.set(telegramId, {
          user: {
            id: `telegram_${telegramId}`,
            telegramId: telegramId,
            username: user.username || `User${telegramId}`,
            name: user.username || `User${telegramId}`
          },
          token,
          timestamp: Date.now()
        });
        
        return res.json({
          authenticated: true,
          user: {
            id: `telegram_${telegramId}`,
            telegramId: telegramId,
            username: user.username || `User${telegramId}`,
            name: user.username || `User${telegramId}`
          },
          token
        });
      }
      
      res.json({ authenticated: false });
    } catch (error) {
      console.error('Auth status check error:', error);
      res.json({ authenticated: false });
    }
  });

  // Telegram authentication endpoint
  app.post('/api/auth/telegram', async (req: Request, res: Response) => {
    try {
      const telegramData = req.body;
      
      // For development, we'll create a simple auth without full verification
      const telegramId = telegramData.id || telegramData.telegramId;
      const username = telegramData.username || `User${telegramId}`;
      
      if (!telegramId) {
        return res.status(400).json(createErrorResponse('Telegram ID is required'));
      }
      
      // Check if user already exists
      let user = await storage.getUser(`telegram_${telegramId}`);
      
      if (!user) {
        // Create new user for Telegram auth
        user = await storage.createUser({
          telegramId: String(telegramId),
          username: username,
          password: 'telegramAuth',
          level: 1,
          lp: 5000,
          lpPerHour: 250,
          lpPerTap: 2,
          energy: 1000,
          maxEnergy: 1000,
          charisma: 0,
          vipStatus: false,
          nsfwConsent: false
        });
      }
      
      const token = generateJWT(`telegram_${telegramId}`);
      
      // Cache the authentication
      global.recentTelegramAuth?.set(String(telegramId), {
        user: {
          id: `telegram_${telegramId}`,
          telegramId: String(telegramId),
          username: user.username,
          name: user.username
        },
        token,
        timestamp: Date.now()
      });
      
      res.json(createSuccessResponse({
        user: {
          id: `telegram_${telegramId}`,
          telegramId: String(telegramId),
          username: user.username,
          name: user.username
        },
        token,
        authenticated: true
      }));
      
    } catch (error) {
      console.error('Telegram auth error:', error);
      res.status(500).json(createErrorResponse('Authentication failed'));
    }
  });

  // Legacy telegram verification endpoint
  app.get("/api/auth/telegram/verify", (req: Request, res: Response) => {
    // Simple verification response
    res.json(createSuccessResponse({
      verified: true,
      message: 'Telegram authentication verified'
    }));
  });

  console.log('✅ User routes registered with display picture functionality and telegram ID support');
}