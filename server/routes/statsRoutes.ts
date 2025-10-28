/**
 * statsRoutes.ts - Player Statistics and Game Stats Routes
 * Last Edited: 2025-08-28 by Assistant
 * 
 * Handles player statistics, game stats, and mock fallback data
 */

import type { Express, Request, Response } from "express";
import { SupabaseStorage } from '../../shared/SupabaseStorage';
import { isValidUUID, isValidTelegramId, createSuccessResponse, createErrorResponse } from '../utils/helpers';

const storage = SupabaseStorage.getInstance();

export function registerStatsRoutes(app: Express) {

  // Player stats endpoint with mock fallback
  app.get("/api/stats/:playerId", async (req: Request, res: Response) => {
    try {
      const { playerId } = req.params;

      // If playerId is not valid, return error
      if (!isValidUUID(playerId) && !isValidTelegramId(playerId)) {
        return res.status(400).json(createErrorResponse('Invalid player ID format'));
      }

      try {
        // Try to get real stats from database 
        const stats = null; // TODO: Implement getGameStats method
        
        if (stats) {
          return res.json(stats);
        } else {
          // Create default stats for valid user
          const defaultStats = {
            playerId,
            totalTaps: 0,
            totalLpEarned: 0,
            totalEnergyUsed: 0,
            sessionsPlayed: 1,
            timeSpent: 0,
            charactersUnlocked: 1,
            achievementsUnlocked: 0,
            upgradesPurchased: 0,
            wheelSpins: 0,
            chatMessages: 0,
            mediaShared: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          // TODO: Implement createGameStats method
          // Only log when actually creating stats (not every request)
          
          return res.json(defaultStats);
        }
      } catch (dbError) {
        console.error('Database error fetching stats:', dbError);
        return res.status(500).json(createErrorResponse('Database error'));
      }

    } catch (error) {
      console.error('Error in stats endpoint:', error);
      res.status(500).json(createErrorResponse('Failed to get stats'));
    }
  });

  // Game statistics summary endpoint
  app.get("/api/gamestats", (req: Request, res: Response) => {
    // Mock game-wide statistics
    const gameStats = {
      totalPlayers: 1250,
      totalTapsToday: 45600,
      totalLpEarned: 2840000,
      activePlayersToday: 89,
      topPlayer: {
        username: "Player123",
        level: 15,
        totalLp: 125000
      },
      popularCharacter: "Luna",
      averageSessionTime: "12 minutes",
      totalChatMessages: 8945,
      totalMediaShared: 234,
      dailyActiveUsers: 89,
      weeklyActiveUsers: 456,
      monthlyActiveUsers: 1250
    };
    
    res.json(gameStats);
  });

  // Admin stats plugin endpoint
  app.get('/api/admin/plugins/stats', async (req: Request, res: Response) => {
    try {
      // Mock admin plugin statistics
      const pluginStats = {
        tapPlugin: {
          totalTaps: 45600,
          averageLpPerTap: 1.8,
          totalLpGenerated: 82080
        },
        chatPlugin: {
          totalMessages: 8945,
          averageResponseTime: "1.2s",
          aiCallsMade: 4472
        },
        upgradePlugin: {
          totalUpgrades: 234,
          mostPopularUpgrade: "LP Per Tap +1",
          totalLpSpent: 456000
        },
        wheelPlugin: {
          totalSpins: 123,
          totalPrizesWon: 567,
          jackpotsHit: 3
        }
      };
      
      res.json(pluginStats);
    } catch (error) {
      console.error('Error fetching admin plugin stats:', error);
      res.status(500).json(createErrorResponse('Failed to fetch plugin statistics'));
    }
  });

  // Individual plugin stats endpoints
  app.get("/api/plugins/upgrades", (req: Request, res: Response) => {
    // Mock upgrades plugin data
    const upgradesData = {
      available: 15,
      purchased: 234,
      totalSpent: 456000,
      averageLevel: 3.2,
      mostPopular: "LP Per Tap Enhancement"
    };
    
    res.json(upgradesData);
  });

  app.get("/api/plugins/boosters", (req: Request, res: Response) => {
    // Mock boosters plugin data
    const boostersData = {
      available: 8,
      active: 2,
      totalUsed: 89,
      mostUsed: "2x LP Booster",
      averageDuration: "15 minutes"
    };
    
    res.json(boostersData);
  });

  app.get("/api/plugins/achievements", (req: Request, res: Response) => {
    // Mock achievements plugin data
    const achievementsData = {
      total: 50,
      unlocked: 12,
      completionRate: 0.24,
      rarest: "First Million LP",
      mostCommon: "First Tap"
    };
    
    res.json(achievementsData);
  });
}