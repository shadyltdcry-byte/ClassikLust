/**
 * admin.ts - Token-Protected Admin Control Panel
 * Last Edited: 2025-10-24 by Assistant - Complete admin API for DebuggerService
 */

import { Router, Request, Response } from 'express';
import { Debugger, FeatureKey } from '../../shared/services/DebuggerService';

const router = Router();

/**
 * 🔐 ADMIN TOKEN MIDDLEWARE
 * Protects all admin endpoints with ADMIN_TOKEN
 */
function requireAdminToken(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminToken) {
    return res.status(500).json({
      success: false,
      error: 'ADMIN_TOKEN not configured on server'
    });
  }

  if (!token || token !== adminToken) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or missing admin token'
    });
  }

  next();
}

// Apply admin token protection to all routes
router.use(requireAdminToken);

/**
 * 🔍 GET /api/admin/status
 * System status dashboard - show health of all features
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = Debugger.getStatus();
    const uptime = process.uptime();
    const memory = process.memoryUsage();

    res.json({
      success: true,
      system: {
        uptime: Math.floor(uptime),
        memory: {
          heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + 'MB',
          heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + 'MB',
          external: Math.round(memory.external / 1024 / 1024) + 'MB'
        },
        nodeVersion: process.version,
        platform: process.platform
      },
      debugger: status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error?.message || 'Status check failed'
    });
  }
});

/**
 * 🔍 GET /api/admin/health
 * Simple health check endpoint for monitoring
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const status = Debugger.getStatus();
    const healthyFeatures = Object.values(status.features || {})
      .filter((feature: any) => feature.enabled).length;
    const totalFeatures = Object.keys(status.features || {}).length;
    
    const isHealthy = healthyFeatures >= totalFeatures * 0.8; // 80% threshold
    
    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      healthy: healthyFeatures,
      total: totalFeatures,
      percentage: totalFeatures > 0 ? Math.round((healthyFeatures / totalFeatures) * 100) : 100,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error?.message || 'Health check failed'
    });
  }
});

/**
 * 🔄 POST /api/admin/recheck-all
 * Re-run all system health checks
 */
router.post('/recheck-all', async (req: Request, res: Response) => {
  try {
    console.log('🔄 [ADMIN] Recheck all systems requested');
    await Debugger.recheckAll();
    
    const status = Debugger.getStatus();
    res.json({
      success: true,
      message: 'All systems rechecked',
      status: status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ [ADMIN] Recheck all failed:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Recheck failed'
    });
  }
});

/**
 * 🔄 POST /api/admin/recheck/:feature
 * Re-run health check for specific feature
 */
router.post('/recheck/:feature', async (req: Request, res: Response) => {
  try {
    const feature = req.params.feature as FeatureKey;
    const validFeatures: FeatureKey[] = ['upgrades', 'levels', 'tasks', 'achievements', 'media', 'auth', 'core'];
    
    if (!validFeatures.includes(feature)) {
      return res.status(400).json({
        success: false,
        error: `Invalid feature. Must be one of: ${validFeatures.join(', ')}`
      });
    }
    
    console.log(`🔄 [ADMIN] Recheck ${feature} requested`);
    const result = await Debugger.recheckFeature(feature);
    
    res.json({
      success: true,
      message: `Feature ${feature} rechecked`,
      result: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error(`❌ [ADMIN] Recheck ${req.params.feature} failed:`, error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Feature recheck failed'
    });
  }
});

/**
 * 🧹 POST /api/admin/clear-cache
 * Clear all system caches
 */
router.post('/clear-cache', async (req: Request, res: Response) => {
  try {
    console.log('🧹 [ADMIN] Clear all caches requested');
    await Debugger.clearAllCaches();
    
    res.json({
      success: true,
      message: 'All caches cleared',
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ [ADMIN] Clear cache failed:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Cache clear failed'
    });
  }
});

/**
 * 🔄 POST /api/admin/reload-json
 * Refresh game data from JSON files without restart
 */
router.post('/reload-json', async (req: Request, res: Response) => {
  try {
    console.log('🔄 [ADMIN] JSON hot-reload requested');
    
    // Clear caches to force re-read from files
    await Debugger.clearAllCaches();
    
    // Force recheck of data-dependent features
    await Debugger.recheckFeature('upgrades');
    await Debugger.recheckFeature('levels');
    await Debugger.recheckFeature('tasks');
    await Debugger.recheckFeature('achievements');
    
    res.json({
      success: true,
      message: 'JSON data reloaded successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ [ADMIN] JSON reload failed:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'JSON reload failed'
    });
  }
});

/**
 * 🔧 POST /api/admin/fix-schema
 * Manual schema repair for database issues
 */
router.post('/fix-schema', async (req: Request, res: Response) => {
  try {
    console.log('🔧 [ADMIN] Manual schema repair requested');
    
    // Force schema reinitialization by rechecking upgrades
    const result = await Debugger.recheckFeature('upgrades');
    
    res.json({
      success: result.ok,
      message: result.ok ? 'Schema repaired successfully' : 'Schema repair failed',
      details: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ [ADMIN] Schema repair failed:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Schema repair failed'
    });
  }
});

/**
 * 🚨 POST /api/admin/emergency-reset
 * Nuclear option - reset all systems (use with caution)
 */
router.post('/emergency-reset', async (req: Request, res: Response) => {
  try {
    console.log('🚨 [ADMIN] EMERGENCY RESET requested - clearing everything');
    
    // Clear all caches
    await Debugger.clearAllCaches();
    
    // Force recheck all systems
    await Debugger.recheckAll();
    
    res.json({
      success: true,
      message: '🚨 Emergency reset complete - all systems reinitialized',
      warning: 'This cleared all caches and forced system reinitialization',
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ [ADMIN] Emergency reset failed:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Emergency reset failed'
    });
  }
});

/**
 * 📊 GET /api/admin/logs
 * Get recent system logs (if implemented)
 */
router.get('/logs', async (req: Request, res: Response) => {
  try {
    // For now, return basic system info
    // Could be extended to return actual log files
    const logs = {
      message: 'Log viewing not yet implemented',
      suggestion: 'Check server console for real-time logs',
      systemInfo: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        features: Debugger.getStatus()
      }
    };
    
    res.json({
      success: true,
      logs: logs,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error?.message || 'Log retrieval failed'
    });
  }
});

export default router;