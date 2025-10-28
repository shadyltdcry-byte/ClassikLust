import type { Express, Request, Response } from 'express';
import { SupabaseStorage } from '../../shared/SupabaseStorage';
import { createErrorResponse, createSuccessResponse } from '../utils/helpers';

const storage = SupabaseStorage.getInstance();

/**
 * ⚡ ENERGY REGENERATION SYSTEM
 * Critical gameplay mechanic - regenerates energy over time
 * Rate: 2-5 energy every 5 seconds (configurable per user based on upgrades)
 */

// Energy regeneration rate per 5-second tick
const BASE_ENERGY_REGEN = 3; // Base: 3 energy per 5 seconds
const REGEN_INTERVAL_MS = 5000; // 5 seconds

// In-memory tracking for energy regen
const energyRegenTimers = new Map<string, NodeJS.Timeout>();

export function registerEnergyRoutes(app: Express) {
  
  // Start energy regeneration for a user
  app.post('/api/energy/start-regen/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      // Stop existing timer if running
      if (energyRegenTimers.has(userId)) {
        clearInterval(energyRegenTimers.get(userId)!);
      }

      console.log(`⚡ [ENERGY] Starting regeneration for user: ${userId}`);

      // Start regeneration timer
      const timer = setInterval(async () => {
        try {
          await regenerateUserEnergy(userId);
        } catch (error) {
          console.error(`❌ [ENERGY] Regen failed for ${userId}:`, error);
        }
      }, REGEN_INTERVAL_MS);

      energyRegenTimers.set(userId, timer);

      res.json(createSuccessResponse({
        message: 'Energy regeneration started',
        regenRate: BASE_ENERGY_REGEN,
        intervalMs: REGEN_INTERVAL_MS
      }));

    } catch (error) {
      console.error('Error starting energy regen:', error);
      res.status(500).json(createErrorResponse('Failed to start energy regeneration'));
    }
  });

  // Stop energy regeneration for a user  
  app.post('/api/energy/stop-regen/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      if (energyRegenTimers.has(userId)) {
        clearInterval(energyRegenTimers.get(userId)!);
        energyRegenTimers.delete(userId);
        console.log(`⚡ [ENERGY] Stopped regeneration for user: ${userId}`);
      }

      res.json(createSuccessResponse({ message: 'Energy regeneration stopped' }));

    } catch (error) {
      console.error('Error stopping energy regen:', error);
      res.status(500).json(createErrorResponse('Failed to stop energy regeneration'));
    }
  });

  // Get energy regeneration status
  app.get('/api/energy/regen-status/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const isActive = energyRegenTimers.has(userId);
      
      res.json(createSuccessResponse({
        userId,
        regenActive: isActive,
        regenRate: BASE_ENERGY_REGEN,
        intervalMs: REGEN_INTERVAL_MS
      }));

    } catch (error) {
      console.error('Error getting energy regen status:', error);
      res.status(500).json(createErrorResponse('Failed to get regen status'));
    }
  });

  // Manual energy regeneration (for testing)
  app.post('/api/energy/regen/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const result = await regenerateUserEnergy(userId);
      
      if (!result.success) {
        return res.status(400).json(createErrorResponse(result.reason || 'Regeneration failed'));
      }

      res.json(createSuccessResponse({
        message: 'Energy regenerated',
        energyAdded: result.energyAdded,
        newEnergy: result.newEnergy,
        maxEnergy: result.maxEnergy
      }));

    } catch (error) {
      console.error('Error regenerating energy:', error);
      res.status(500).json(createErrorResponse('Failed to regenerate energy'));
    }
  });
}

/**
 * ⚡ CORE REGENERATION LOGIC
 * Adds energy to user based on regen rate and max capacity
 */
async function regenerateUserEnergy(userId: string): Promise<{
  success: boolean;
  energyAdded?: number;
  newEnergy?: number;
  maxEnergy?: number;
  reason?: string;
}> {
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      return { success: false, reason: 'User not found' };
    }

    const currentEnergy = user.energy || 0;
    const maxEnergy = user.maxEnergy || 1000;

    // Don't regen if already at max
    if (currentEnergy >= maxEnergy) {
      return { success: false, reason: 'Energy already at maximum' };
    }

    // Calculate energy to add (base + potential upgrade bonuses)
    let energyToAdd = BASE_ENERGY_REGEN;
    
    // TODO: Add energy regen upgrade bonuses here
    // const regenBonus = await getEnergyRegenBonus(userId);
    // energyToAdd += regenBonus;

    const newEnergy = Math.min(maxEnergy, currentEnergy + energyToAdd);
    const actualEnergyAdded = newEnergy - currentEnergy;

    if (actualEnergyAdded <= 0) {
      return { success: false, reason: 'No energy to add' };
    }

    // Update user energy
    await storage.updateUser(userId, { energy: newEnergy });

    console.log(`⚡ [REGEN] ${userId}: ${currentEnergy} + ${actualEnergyAdded} = ${newEnergy}/${maxEnergy}`);

    return {
      success: true,
      energyAdded: actualEnergyAdded,
      newEnergy,
      maxEnergy
    };

  } catch (error) {
    console.error('Energy regen error:', error);
    return { success: false, reason: 'Internal error' };
  }
}

// Auto-start energy regen for active users (called when they join/return)
export function startEnergyRegenForUser(userId: string) {
  if (!energyRegenTimers.has(userId)) {
    const timer = setInterval(async () => {
      try {
        await regenerateUserEnergy(userId);
      } catch (error) {
        console.error(`❌ [ENERGY] Auto-regen failed for ${userId}:`, error);
      }
    }, REGEN_INTERVAL_MS);

    energyRegenTimers.set(userId, timer);
    console.log(`⚡ [ENERGY] Auto-started regeneration for: ${userId}`);
  }
}

// Stop energy regen when user goes inactive (optional cleanup)
export function stopEnergyRegenForUser(userId: string) {
  if (energyRegenTimers.has(userId)) {
    clearInterval(energyRegenTimers.get(userId)!);
    energyRegenTimers.delete(userId);
    console.log(`⚡ [ENERGY] Stopped regeneration for: ${userId}`);
  }
}