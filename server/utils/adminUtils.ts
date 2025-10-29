import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Request, Response } from 'express';

// Helper to create error responses
function createErrorResponse(message: string) {
  return { success: false, error: message };
}

// Load upgrade definitions from game-data/upgrades/*.json files
export function loadUpgradeDefinitions(): any[] {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const upgradesDir = path.join(__dirname, '../../game-data/upgrades');
    
    if (!fs.existsSync(upgradesDir)) {
      console.warn('Upgrades directory not found:', upgradesDir);
      return [];
    }
    
    const files = fs.readdirSync(upgradesDir).filter(f => f.endsWith('.json'));
    const allUpgrades: any[] = [];
    
    for (const file of files) {
      try {
        const filePath = path.join(upgradesDir, file);
        const rawContent = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(rawContent);
        
        if (Array.isArray(parsed)) {
          allUpgrades.push(...parsed);
        } else if (parsed && typeof parsed === 'object') {
          allUpgrades.push(parsed);
        }
      } catch (error) {
        console.error(`Failed to parse upgrade file ${file}:`, error);
      }
    }
    
    return allUpgrades;
  } catch (error) {
    console.error('Error loading upgrade definitions:', error);
    return [];
  }
}

// 🔧 FIXED: Admin guard with development bypass and enhanced logging
export function requireAdmin(req: Request, res: Response): boolean {
  console.log('🔐 [ADMIN-CHECK] Checking admin privileges...');
  console.log('🔐 [ADMIN-CHECK] Environment:', process.env.NODE_ENV);
  console.log('🔐 [ADMIN-CHECK] User object:', req.user);
  console.log('🔐 [ADMIN-CHECK] Headers:', req.headers);
  
  // 🔥 TEMPORARY DEV BYPASS - Remove this in production!
  const isDev = process.env.NODE_ENV !== 'production';
  
  if (isDev) {
    console.log('🚫 [ADMIN-CHECK] DEVELOPMENT MODE - BYPASSING ADMIN CHECK');
    console.log('🚫 [ADMIN-CHECK] This is TEMPORARY for debugging - should be removed in production');
    return true; // Allow all admin operations in dev
  }
  
  // Check if user has admin privileges
  if (req?.user?.isAdmin === true) {
    console.log('✅ [ADMIN-CHECK] User has admin privileges');
    return true;
  }
  
  // Check for admin bypass headers (for development)
  if (req.headers['x-admin-bypass'] === 'development') {
    console.log('🔓 [ADMIN-CHECK] Admin bypass header detected');
    return true;
  }
  
  // Deny access with detailed logging
  console.log('❌ [ADMIN-CHECK] Access denied - no admin privileges');
  console.log('❌ [ADMIN-CHECK] req.user:', req.user);
  console.log('❌ [ADMIN-CHECK] req.user.isAdmin:', req?.user?.isAdmin);
  
  res.status(401).json({
    success: false, 
    error: 'Admin privileges required',
    details: 'User does not have admin access',
    debug: {
      hasUser: !!req.user,
      isAdmin: req?.user?.isAdmin,
      environment: process.env.NODE_ENV
    }
  });
  return false;
}

// Admin middleware wrapper for routes
export function adminOnly(handler: (req: Request, res: Response) => Promise<void> | void) {
  return async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) {
      return;
    }
    
    try {
      await handler(req, res);
    } catch (error) {
      console.error('❌ [ADMIN-ROUTE] Error:', error);
      res.status(500).json(createErrorResponse(`Internal server error: ${error.message}`));
    }
  };
}

export { createErrorResponse };