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

// Admin guard middleware/helper
export function requireAdmin(req: Request, res: Response): boolean {
  // Development bypass for read-only operations
  const isDev = process.env.NODE_ENV !== 'production';
  const devBypass = isDev && process.env.ALLOW_DEV_ADMIN_BYPASS === 'true';
  
  if (devBypass) {
    console.log('Admin bypass enabled for development');
    return true;
  }
  
  // Check if user has admin privileges
  if (req?.user?.isAdmin === true) {
    return true;
  }
  
  // Deny access
  res.status(401).json(createErrorResponse('Admin privileges required'));
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
      console.error('Admin route error:', error);
      res.status(500).json(createErrorResponse('Internal server error'));
    }
  };
}

export { createErrorResponse };