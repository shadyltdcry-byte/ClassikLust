/**
 * debug.ts - Public Debug Endpoints
 * Last Edited: 2025-10-24 by Assistant - Public system monitoring endpoints
 */

import { Router, Request, Response } from 'express';
import { Debugger } from '../../shared/services/DebuggerService';

const router = Router();

/**
 * 🔍 GET /api/debug/status
 * Public system status - safe for monitoring without admin token
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = Debugger.getStatus();
    
    // Return public-safe version of status
    const publicStatus = {
      initialized: status.initialized,
      features: {} as any,
      summary: {
        total: 0,
        enabled: 0,
        disabled: 0
      },
      timestamp: new Date().toISOString()
    };
    
    // Count and sanitize feature status
    for (const [key, feature] of Object.entries(status.features || {})) {
      const featureInfo = feature as any;
      publicStatus.features[key] = {
        enabled: featureInfo.enabled,
        lastCheck: featureInfo.lastCheck,
        // Don't expose sensitive error details publicly
        hasIssue: !featureInfo.enabled
      };
      
      publicStatus.summary.total++;
      if (featureInfo.enabled) {
        publicStatus.summary.enabled++;
      } else {
        publicStatus.summary.disabled++;
      }
    }
    
    res.json({
      success: true,
      status: publicStatus
    });
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Status check failed',
      details: error?.message
    });
  }
});

/**
 * 🔍 GET /api/debug/health
 * Simple health check for monitoring services
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const status = Debugger.getStatus();
    const features = status.features || {};
    
    const totalFeatures = Object.keys(features).length;
    const enabledFeatures = Object.values(features)
      .filter((feature: any) => feature.enabled).length;
    
    const healthPercentage = totalFeatures > 0 
      ? Math.round((enabledFeatures / totalFeatures) * 100) 
      : 100;
    
    const isHealthy = healthPercentage >= 80; // 80% threshold
    
    res.status(isHealthy ? 200 : 503).json({
      success: true,
      healthy: isHealthy,
      percentage: healthPercentage,
      enabled: enabledFeatures,
      total: totalFeatures,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

/**
 * 🔍 GET /api/debug/features
 * List available features and their status
 */
router.get('/features', async (req: Request, res: Response) => {
  try {
    const status = Debugger.getStatus();
    const features = status.features || {};
    
    const featureList = Object.entries(features).map(([name, info]: [string, any]) => ({
      name,
      enabled: info.enabled,
      lastCheck: info.lastCheck,
      category: getCategoryForFeature(name)
    }));
    
    res.json({
      success: true,
      features: featureList,
      categories: {
        core: featureList.filter(f => f.category === 'core'),
        gameplay: featureList.filter(f => f.category === 'gameplay'),
        data: featureList.filter(f => f.category === 'data'),
        infrastructure: featureList.filter(f => f.category === 'infrastructure')
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Feature list failed'
    });
  }
});

/**
 * 🔍 GET /api/debug/uptime
 * System uptime and basic metrics
 */
router.get('/uptime', async (req: Request, res: Response) => {
  try {
    const uptime = process.uptime();
    const memory = process.memoryUsage();
    
    res.json({
      success: true,
      uptime: {
        seconds: Math.floor(uptime),
        formatted: formatUptime(uptime)
      },
      memory: {
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
        external: Math.round(memory.external / 1024 / 1024),
        unit: 'MB'
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Uptime check failed'
    });
  }
});

/**
 * Helper function to categorize features
 */
function getCategoryForFeature(featureName: string): string {
  switch (featureName) {
    case 'core':
    case 'auth':
      return 'core';
    case 'upgrades':
    case 'levels':
    case 'tasks':
    case 'achievements':
      return 'gameplay';
    case 'media':
      return 'data';
    default:
      return 'infrastructure';
  }
}

/**
 * Helper function to format uptime
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

export default router;