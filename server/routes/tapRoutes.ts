/**
 * tapRoutes.ts - Tap Game Logic Routes
 * Last Edited: 2025-08-28 by Assistant
 * 
 * Handles all tap-related functionality including LP calculations and energy management
 */

import type { Express, Request, Response } from "express";
import { SupabaseStorage } from '../../shared/SupabaseStorage';
import { parseLP, calculateLPPerTap, createSuccessResponse, createErrorResponse } from '../utils/helpers';
import { requireAuthenticatedUser, validateUserId } from '../middleware/authGuards';

const storage = SupabaseStorage.getInstance();

export function registerTapRoutes(app: Express) {
  
  // Main tap endpoint - optimized for performance
  app.post('/api/tap', validateUserId(), requireAuthenticatedUser(), async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json(createErrorResponse('User ID required'));
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json(createErrorResponse('User not found'));
      }

      // Check if user has energy
      if (user.energy <= 0) {
        return res.status(400).json(createErrorResponse('No energy left'));
      }

      // Calculate LP per tap (use user's lpPerTap stat)
      const lpPerTap = Math.floor(user.lpPerTap || 2);
      
      // Update user stats - Use whole numbers for LP calculations
      const currentLp = Math.floor(parseLP(user.lp));
      const newLp = currentLp + lpPerTap;
      const newEnergy = Math.max(0, user.energy - 1);
      
      console.log(`💥 TAP: ${currentLp} + ${lpPerTap} = ${newLp}`);

      // Fast single database update
      const updatedUser = await storage.updateUser(userId, {
        lp: newLp,
        energy: newEnergy
      });

      // Game stats tracking skipped - method not implemented

      console.log(`💥 TAP! ${userId} gained ${lpPerTap} LP, energy: ${newEnergy}`);
      
      res.json({
        success: true,
        lpGain: lpPerTap,
        energyUsed: 1,
        newLp,
        newEnergy,
        user: updatedUser
      });
    } catch (error) {
      console.error('Tap error:', error);
      res.status(500).json(createErrorResponse('Failed to process tap'));
    }
  });

  // Alternative tap endpoint (legacy support)
  app.post("/api/game/tap", async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json(createErrorResponse('User ID required'));
      }

      // Get user from storage
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json(createErrorResponse('User not found'));
      }

      // Check energy
      if (user.energy <= 0) {
        return res.status(400).json({
          success: false,
          error: 'No energy remaining',
          currentEnergy: 0
        });
      }

      // Calculate LP gain (using whole numbers only)
      const lpGain = user.lpPerTap || 2;
      const currentLp = parseLP(user.lp);
      const newLp = currentLp + lpGain;
      const newEnergy = Math.max(0, user.energy - 1);

      // Update user in database
      const updatedUser = await storage.updateUser(userId, {
        lp: newLp,
        energy: newEnergy
      });

      // Game stats tracking skipped - method not implemented

      res.json({
        success: true,
        lpGain,
        energyUsed: 1,
        newLp,
        newEnergy,
        user: updatedUser
      });
    } catch (error) {
      console.error('Error processing tap:', error);
      // Report to Luna if monitoring is enabled
      if ((global as any).lunaMonitorEnabled) {
        const { reportToLuna } = await import('../services/LunaErrorMonitor.js');
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        reportToLuna('error', 'Tap System', `Tap processing failed: ${errorMessage}`, error as Error, userId);
      }
      res.status(500).json(createErrorResponse('Failed to process tap'));
    }
  });

  // Track claimed rewards to prevent spam (simple in-memory cache)
  const claimedRewards = new Map<string, Set<string>>();

  // Rewards claiming endpoint
  app.post('/api/rewards/claim', validateUserId(), requireAuthenticatedUser(), async (req: Request, res: Response) => {
    try {
      const { rewardId, rewardType, userId } = req.body;
      
      if (!userId) {
        return res.status(400).json(createErrorResponse('User ID required'));
      }

      // Prevent multiple claims of the same reward
      const userClaimed = claimedRewards.get(userId) || new Set();
      const rewardKey = `${rewardType}_${rewardId}`;
      
      if (userClaimed.has(rewardKey)) {
        return res.status(400).json(createErrorResponse('Reward already claimed'));
      }

      // Reward values (fixed "LP LP" duplication - removed "LP" from values)
      const rewards: Record<string, Record<string, number>> = {
        'task': { 
          'task_1': 100, 
          'task_2': 50, 
          'task_3': 200, 
          'task_4': 75 
        },
        'achievement': { 
          'achievement_1': 50, 
          'achievement_2': 100, 
          'achievement_3': 500, 
          'achievement_4': 1000 
        }
      };

      const lpAmount = rewards[rewardType]?.[rewardId];
      if (!lpAmount) {
        return res.status(404).json(createErrorResponse('Reward not found'));
      }

      // Get user from storage
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json(createErrorResponse('User not found'));
      }

      // Mark reward as claimed BEFORE processing
      userClaimed.add(rewardKey);
      claimedRewards.set(userId, userClaimed);

      // Add LP to user's balance
      const currentLp = parseLP(user.lp);
      const newLp = currentLp + lpAmount;

      // Update user in database
      const updatedUser = await storage.updateUser(userId, {
        lp: newLp
      });

      console.log(`🎁 ${userId} claimed ${rewardType} reward: ${lpAmount} LP - Balance: ${currentLp} → ${newLp}`);
      
      res.json(createSuccessResponse({
        reward: `${lpAmount} LP`,
        message: `Successfully claimed ${lpAmount} LP!`,
        lpAdded: lpAmount,
        newLp: newLp,
        user: updatedUser
      }));
    } catch (error) {
      console.error('Reward claiming error:', error);
      // Report to Luna if monitoring is enabled
      if ((global as any).lunaMonitorEnabled) {
        const { reportToLuna } = await import('../services/LunaErrorMonitor.js');
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        reportToLuna('error', 'Rewards System', `Reward claiming failed: ${errorMessage}`, error as Error, userId);
      }
      res.status(500).json(createErrorResponse('Failed to claim reward'));
    }
  });
}