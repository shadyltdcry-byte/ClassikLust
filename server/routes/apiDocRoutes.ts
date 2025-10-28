import type { Express, Request, Response } from "express";

export function registerApiDocRoutes(app: Express) {
  // API Documentation endpoint
  app.get("/api", (req: Request, res: Response) => {
    const apiDocs = {
      title: "ClassikLust AI Tap Game API",
      version: "1.0.0",
      description: "Complete TypeScript Anime AIGF tap-based interaction game API",
      endpoints: {
        "/api/user": {
          GET: "Get user profile and stats",
          POST: "Create or update user",
          parameters: ["userId", "telegramId"]
        },
        "/api/tap": {
          POST: "Process character tap interaction",
          parameters: ["userId", "tapCount", "energy"]
        },
        "/api/upgrades": {
          GET: "List all available upgrades with user progress",
          parameters: ["userId"]
        },
        "/api/upgrades/:id/purchase": {
          POST: "Purchase specific upgrade",
          parameters: ["userId", "upgradeId"]
        },
        "/api/tasks": {
          GET: "Get all tasks with user progress",
          parameters: ["userId"]
        },
        "/api/tasks/:taskId/claim": {
          POST: "Claim task reward",
          parameters: ["userId", "taskId"]
        },
        "/api/achievements": {
          GET: "List achievements with progress tracking",
          parameters: ["userId"]
        },
        "/api/achievements/:achievementId/claim": {
          POST: "Claim achievement reward",
          parameters: ["userId", "achievementId"]
        },
        "/api/level-requirements": {
          GET: "Get level progression requirements"
        },
        "/api/user/:userId/level": {
          GET: "Calculate user's current level based on LP",
          parameters: ["userId"]
        },
        "/api/characters": {
          GET: "List available characters"
        },
        "/api/characters/:id/select": {
          POST: "Select character for user",
          parameters: ["userId", "characterId"]
        },
        "/api/wheel": {
          GET: "Get wheel configuration and segments"
        },
        "/api/wheel/spin": {
          POST: "Spin the wheel for rewards",
          parameters: ["userId"]
        },
        "/api/chat": {
          POST: "Send message to AI character",
          parameters: ["userId", "message", "characterId"]
        },
        "/api/stats": {
          GET: "Get comprehensive user statistics",
          parameters: ["userId"]
        },
        "/api/debug": {
          GET: "Get debug information and system status"
        },
        "/api/vip": {
          GET: "Get VIP status and benefits",
          POST: "Purchase VIP membership",
          parameters: ["userId"]
        }
      },
      systems: {
        "Upgrade System": "Purchase upgrades to increase LP/tap, LP/hour, and special abilities",
        "Task System": "Complete objectives to earn rewards and progress",
        "Achievement System": "Unlock achievements by reaching milestones for bonus rewards",
        "Level System": "Progress through levels based on total LP earned",
        "Character System": "Collect and interact with different anime characters",
        "Wheel System": "Spin for random rewards and bonuses",
        "Chat System": "AI-powered conversations with characters",
        "VIP System": "Premium membership with exclusive benefits"
      },
      architecture: {
        frontend: "React + TypeScript + Vite + TailwindCSS",
        backend: "Node.js + Express + TypeScript",
        database: "Supabase (PostgreSQL)",
        deployment: "Telegram Web App compatible",
        aiIntegration: "Mistral AI for character interactions"
      },
      status: "Active Development",
      lastUpdated: new Date().toISOString()
    };
    
    res.json(apiDocs);
  });
  
  // Health check endpoint
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0"
    });
  });
  
  console.log('📚 [ROUTES] API documentation routes registered');
}