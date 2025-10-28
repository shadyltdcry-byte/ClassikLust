import type { Express, Request, Response } from "express";
import { SupabaseStorage } from "../../shared/SupabaseStorage";
import { createSuccessResponse, createErrorResponse } from "../utils/helpers";
import AITriageService from "../services/AITriageService";

const storage = SupabaseStorage.getInstance();
const aiTriage = AITriageService.getInstance();

export function registerTaskRoutes(app: Express) {
  // Get all available tasks with user progress
  app.get("/api/tasks", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId || req.headers['x-user-id'];
      console.log(`📋 [TASKS] Fetching tasks for user: ${userId || 'anonymous'}`);
      
      // Default task templates
      const defaultTasks = [
        {
          id: "task_first_tap",
          title: "First Tap",
          description: "Tap your character 5 times",
          maxProgress: 5,
          reward: "50 LP",
          category: "basic",
          icon: "👆",
          type: "counter",
          statKey: "totalTaps"
        },
        {
          id: "task_energy_master",
          title: "Energy Master",
          description: "Reach maximum energy",
          maxProgress: 1000,
          reward: "100 LP + Energy Boost",
          category: "energy",
          icon: "⚡",
          type: "threshold",
          statKey: "energy"
        },
        {
          id: "task_level_up",
          title: "Rising Star",
          description: "Reach level 3",
          maxProgress: 3,
          reward: "200 LP + Upgrade Unlock",
          category: "progression",
          icon: "⬆️",
          type: "level",
          statKey: "level"
        },
        {
          id: "task_lp_collector",
          title: "LP Collector",
          description: "Earn 1000 LP total",
          maxProgress: 1000,
          reward: "Special Character Unlock",
          category: "collection",
          icon: "💰",
          type: "cumulative",
          statKey: "lp"
        },
        {
          id: "task_upgrade_buyer",
          title: "Upgrade Enthusiast",
          description: "Purchase 3 upgrades",
          maxProgress: 3,
          reward: "Premium Upgrade Discount",
          category: "upgrades",
          icon: "🔧",
          type: "counter",
          statKey: "upgradesPurchased"
        }
      ];
      
      if (!userId || userId === 'anonymous') {
        // Return default tasks with 0 progress
        const tasks = defaultTasks.map(task => ({
          ...task,
          progress: 0,
          status: 'active',
          canClaim: false
        }));
        return res.json(tasks);
      }
      
      // Get user data and task progress
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json(createErrorResponse('User not found'));
      }
      
      // Get user task completions
      const { data: userTasks } = await storage.supabase
        .from('userTasks')
        .select('taskId, completed, claimedAt')
        .eq('userId', userId);
      
      const completedTasks = new Set(userTasks?.map(ut => ut.taskId) || []);
      const claimedTasks = new Set(userTasks?.filter(ut => ut.claimedAt).map(ut => ut.taskId) || []);
      
      // Calculate progress for each task
      const tasksWithProgress = defaultTasks.map(task => {
        let progress = 0;
        
        switch (task.statKey) {
          case 'totalTaps':
            progress = Math.min(user.totalTaps || 0, task.maxProgress);
            break;
          case 'energy':
            progress = Math.min(user.energy || 0, task.maxProgress);
            break;
          case 'level':
            progress = Math.min(user.level || 1, task.maxProgress);
            break;
          case 'lp':
            progress = Math.min(user.lp || 0, task.maxProgress);
            break;
          case 'upgradesPurchased':
            progress = Math.min(user.upgradesPurchased || 0, task.maxProgress);
            break;
          default:
            progress = 0;
        }
        
        const isCompleted = progress >= task.maxProgress;
        const isClaimed = claimedTasks.has(task.id);
        const status = isClaimed ? 'claimed' : isCompleted ? 'completed' : 'active';
        
        return {
          ...task,
          progress,
          status,
          canClaim: isCompleted && !isClaimed
        };
      });
      
      console.log(`📋 [TASKS] Returning ${tasksWithProgress.length} tasks (${tasksWithProgress.filter(t => t.canClaim).length} claimable)`);
      res.json(tasksWithProgress);
      
    } catch (error: any) {
      console.error('📋 [TASKS] Error:', error);
      aiTriage.addEvent({
        id: `task_fetch_${Date.now()}`,
        severity: 'moderate',
        source: 'server',
        route: '/api/tasks',
        method: 'GET',
        message: error.message,
        stack: error.stack,
        context: { query: req.query, headers: req.headers }
      });
      res.json([]);
    }
  });

  // Claim task reward
  app.post("/api/tasks/:taskId/claim", async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      const { userId } = req.body || {};
      
      if (!userId) {
        return res.status(400).json(createErrorResponse('userId is required'));
      }
      
      console.log(`🏆 [TASK_CLAIM] User ${userId} claiming task ${taskId}`);
      
      // Get user and verify task exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json(createErrorResponse('User not found'));
      }
      
      // Check if already claimed
      const { data: existingClaim } = await storage.supabase
        .from('userTasks')
        .select('claimedAt')
        .eq('userId', userId)
        .eq('taskId', taskId)
        .maybeSingle();
        
      if (existingClaim?.claimedAt) {
        return res.status(400).json(createErrorResponse('Task already claimed'));
      }
      
      // Parse reward (e.g., "50 LP", "100 LP + Energy Boost")
      const reward = getTaskReward(taskId);
      if (!reward) {
        return res.status(404).json(createErrorResponse('Task not found'));
      }
      
      let lpReward = 0;
      let energyBoost = 0;
      
      // Simple reward parsing
      const rewardText = reward.toLowerCase();
      if (rewardText.includes('50 lp')) lpReward = 50;
      else if (rewardText.includes('100 lp')) lpReward = 100;
      else if (rewardText.includes('200 lp')) lpReward = 200;
      
      if (rewardText.includes('energy boost')) energyBoost = 100;
      
      // Apply rewards
      const newLP = (user.lp || 0) + lpReward;
      const newEnergy = Math.min(1000, (user.energy || 0) + energyBoost);
      
      // Update user and mark task as claimed
      const { error: updateError } = await storage.supabase
        .from('users')
        .update({ 
          lp: newLP,
          energy: newEnergy
        })
        .eq('id', userId);
        
      if (updateError) throw updateError;
      
      const { error: claimError } = await storage.supabase
        .from('userTasks')
        .upsert({
          userId,
          taskId,
          completed: true,
          claimedAt: new Date().toISOString()
        }, { onConflict: 'userId,taskId' });
        
      if (claimError) throw claimError;
      
      console.log(`🏆 [TASK_CLAIM] Success: +${lpReward} LP, +${energyBoost} Energy`);
      
      res.json(createSuccessResponse({
        message: 'Task claimed successfully',
        rewards: {
          lp: lpReward,
          energy: energyBoost
        },
        newStats: {
          lp: newLP,
          energy: newEnergy
        }
      }));
      
    } catch (error: any) {
      console.error('🏆 [TASK_CLAIM] Error:', error);
      aiTriage.addEvent({
        id: `task_claim_${Date.now()}`,
        severity: 'critical',
        source: 'server',
        route: '/api/tasks/claim',
        method: 'POST',
        message: error.message,
        stack: error.stack,
        context: { taskId: req.params.taskId, userId: req.body?.userId }
      });
      
      res.status(500).json(createErrorResponse(error.message || 'Failed to claim task'));
    }
  });
  
  console.log('📋 [ROUTES] Task routes registered with reward system');
}

// Helper to get task reward by ID
function getTaskReward(taskId: string): string | null {
  const rewardMap: Record<string, string> = {
    'task_first_tap': '50 LP',
    'task_energy_master': '100 LP + Energy Boost', 
    'task_level_up': '200 LP + Upgrade Unlock',
    'task_lp_collector': 'Special Character Unlock',
    'task_upgrade_buyer': 'Premium Upgrade Discount'
  };
  
  return rewardMap[taskId] || null;
}