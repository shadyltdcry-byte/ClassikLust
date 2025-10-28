/**
 * DebuggerService.ts - Central System Health & Feature Flag Manager
 * Last Edited: 2025-10-24 by Assistant - Complete self-healing orchestrator
 */

import fs from 'fs';
import path from 'path';

export type FeatureKey = 'upgrades' | 'levels' | 'tasks' | 'achievements' | 'media' | 'auth' | 'core';
export type CheckResult = { ok: boolean; reason?: string; details?: any; lastCheck?: Date; };

export class DebuggerService {
  private static instance: DebuggerService;
  private featureStatus = new Map<FeatureKey, CheckResult>();
  private initialized = false;
  private watchdogInterval?: NodeJS.Timeout;
  private cacheService?: any;

  private constructor() {
    this.featureStatus.set('core', { ok: true, lastCheck: new Date() });
  }

  static getInstance(): DebuggerService {
    if (!DebuggerService.instance) {
      DebuggerService.instance = new DebuggerService();
    }
    return DebuggerService.instance;
  }

  /**
   * 🚀 MAIN STARTUP PREFLIGHT 
   * Run once on server boot - orchestrates all subsystem checks
   */
  async preflight(): Promise<void> {
    if (this.initialized) return;

    console.log('🛡️ [DEBUGGER] Starting comprehensive system preflight...');
    const startTime = Date.now();

    try {
      // Core system checks first
      await this.checkCoreSystem();

      // Feature-specific subsystem checks
      const subsystemChecks: Array<[FeatureKey, () => Promise<CheckResult>]> = [
        ['upgrades', () => this.checkUpgrades()],
        ['levels', () => this.checkLevels()],  
        ['tasks', () => this.checkTasks()],
        ['achievements', () => this.checkAchievements()],
        ['media', () => this.checkMedia()],
        ['auth', () => this.checkAuth()]
      ];

      // Run checks in parallel for speed
      const checkPromises = subsystemChecks.map(async ([feature, checkFn]) => {
        try {
          const result = await Promise.race([
            checkFn(),
            new Promise<CheckResult>((_, reject) => 
              setTimeout(() => reject(new Error('Check timeout')), 30000)
            )
          ]);
          result.lastCheck = new Date();
          this.featureStatus.set(feature, result);
          
          const status = result.ok ? '🟢' : '🟡';
          const message = result.ok ? 'OK' : `DISABLED: ${result.reason}`;
          console.log(`${status} [CHECK] ${feature} ${message}`);
          
          return { feature, result };
        } catch (error: any) {
          const failResult = { ok: false, reason: error?.message || 'Check failed', lastCheck: new Date() };
          this.featureStatus.set(feature, failResult);
          console.log(`🟠 [CHECK] ${feature} DISABLED: ${failResult.reason}`);
          return { feature, result: failResult };
        }
      });

      await Promise.all(checkPromises);

      const totalTime = Date.now() - startTime;
      const healthyCount = Array.from(this.featureStatus.values()).filter(r => r.ok).length;
      const totalCount = this.featureStatus.size;

      console.log(`✅ [DEBUGGER] Preflight complete in ${totalTime}ms - ${healthyCount}/${totalCount} systems healthy`);

      // Start watchdog for periodic re-checks
      this.startWatchdog();
      
      this.initialized = true;

    } catch (error) {
      console.error('❌ [DEBUGGER] Preflight failed:', error);
      this.initialized = true; // Prevent retry loop
    }
  }

  /**
   * 🔍 FEATURE STATUS CHECKS
   */
  isEnabled(feature: FeatureKey): boolean {
    const status = this.featureStatus.get(feature);
    return status?.ok !== false; // Default enabled if no status
  }

  getReason(feature: FeatureKey): string | undefined {
    const status = this.featureStatus.get(feature);
    return status?.ok ? undefined : (status?.reason || 'Unknown failure');
  }

  getStatus(feature?: FeatureKey): any {
    if (feature) {
      return this.featureStatus.get(feature);
    }
    
    // Return all statuses
    const result: any = {
      initialized: this.initialized,
      lastPreflight: this.initialized ? new Date() : null,
      features: {}
    };
    
    for (const [key, status] of this.featureStatus.entries()) {
      result.features[key] = {
        enabled: status.ok,
        reason: status.reason,
        lastCheck: status.lastCheck,
        details: status.details
      };
    }
    
    return result;
  }

  /**
   * 🔄 MANUAL RECHECK TRIGGERS
   */
  async recheckFeature(feature: FeatureKey): Promise<CheckResult> {
    console.log(`🔄 [DEBUGGER] Rechecking ${feature}...`);
    
    let result: CheckResult;
    try {
      switch (feature) {
        case 'upgrades': result = await this.checkUpgrades(); break;
        case 'levels': result = await this.checkLevels(); break;
        case 'tasks': result = await this.checkTasks(); break;
        case 'achievements': result = await this.checkAchievements(); break;
        case 'media': result = await this.checkMedia(); break;
        case 'auth': result = await this.checkAuth(); break;
        default: result = { ok: true, reason: 'Unknown feature' };
      }
    } catch (error: any) {
      result = { ok: false, reason: error?.message || 'Recheck failed' };
    }
    
    result.lastCheck = new Date();
    this.featureStatus.set(feature, result);
    
    const status = result.ok ? '✅' : '❌';
    console.log(`${status} [RECHECK] ${feature} ${result.ok ? 'OK' : result.reason}`);
    
    return result;
  }

  async recheckAll(): Promise<void> {
    console.log('🔄 [DEBUGGER] Rechecking all features...');
    this.initialized = false; // Force full preflight
    await this.preflight();
  }

  /**
   * 🧹 CACHE MANAGEMENT
   */
  setCacheService(cacheService: any) {
    this.cacheService = cacheService;
  }

  async clearAllCaches(): Promise<void> {
    console.log('🧹 [DEBUGGER] Clearing all caches...');
    
    if (this.cacheService) {
      await this.cacheService.clearAll();
    }
    
    // Clear individual subsystem caches
    try {
      const { UpgradeStorage } = await import('../UpgradeStorage');
      UpgradeStorage.getInstance().clearCache();
    } catch (e) {
      // Ignore if not available
    }
    
    // Force PostgREST schema cache refresh
    await this.refreshPostgRESTCache();
    
    console.log('✅ [DEBUGGER] All caches cleared');
  }

  /**
   * 🕒 WATCHDOG - Periodic Health Checks
   */
  private startWatchdog(): void {
    if (this.watchdogInterval) return;
    
    // Check every 5 minutes
    this.watchdogInterval = setInterval(async () => {
      console.log('🐕 [WATCHDOG] Running periodic health checks...');
      
      // Only recheck failed features to see if they recovered
      const failedFeatures = Array.from(this.featureStatus.entries())
        .filter(([_, status]) => !status.ok)
        .map(([feature, _]) => feature);
      
      for (const feature of failedFeatures) {
        await this.recheckFeature(feature);
      }
      
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * 🔍 INDIVIDUAL SUBSYSTEM CHECKS
   */
  private async checkCoreSystem(): Promise<CheckResult> {
    try {
      // Basic Node.js and environment checks
      const hasEnv = process.env.NODE_ENV !== undefined;
      const hasMemory = process.memoryUsage().heapUsed < (512 * 1024 * 1024); // < 512MB
      
      if (!hasEnv) return { ok: false, reason: 'NODE_ENV not set' };
      if (!hasMemory) return { ok: false, reason: 'Memory usage too high' };
      
      this.featureStatus.set('core', { ok: true, lastCheck: new Date() });
      return { ok: true };
      
    } catch (error: any) {
      return { ok: false, reason: error?.message || 'Core system check failed' };
    }
  }

  private async checkUpgrades(): Promise<CheckResult> {
    try {
      const { UpgradeStorage } = await import('../UpgradeStorage');
      const storage = UpgradeStorage.getInstance();
      
      // Run schema initialization (this is now throttled in UpgradeStorage)
      await (storage as any).ensureSchema?.();
      
      // Test basic functionality
      const upgrades = await storage.getAllUpgrades();
      if (!upgrades || upgrades.length === 0) {
        return { ok: false, reason: 'No upgrades loaded from JSON' };
      }
      
      // Test database connectivity with a simple query
      const testUserId = 'test_health_check';
      await storage.getUserUpgradeLevel(testUserId, upgrades[0].id);
      
      return { 
        ok: true, 
        details: { 
          upgradesLoaded: upgrades.length,
          categories: [...new Set(upgrades.map(u => u.category))]
        } 
      };
      
    } catch (error: any) {
      return { ok: false, reason: `Upgrades: ${error?.message || 'Unknown error'}` };
    }
  }

  private async checkLevels(): Promise<CheckResult> {
    try {
      // Check if level JSON files exist
      const levelsPath = path.join(process.cwd(), 'game-data', 'levels');
      if (!fs.existsSync(levelsPath)) {
        return { ok: false, reason: 'Levels directory missing' };
      }
      
      const levelFiles = fs.readdirSync(levelsPath).filter(f => f.endsWith('.json'));
      if (levelFiles.length === 0) {
        return { ok: false, reason: 'No level JSON files found' };
      }
      
      return { ok: true, details: { levelFiles: levelFiles.length } };
      
    } catch (error: any) {
      return { ok: false, reason: `Levels: ${error?.message || 'Unknown error'}` };
    }
  }

  private async checkTasks(): Promise<CheckResult> {
    try {
      // Check if task JSON files exist
      const tasksPath = path.join(process.cwd(), 'game-data', 'tasks');
      if (!fs.existsSync(tasksPath)) {
        return { ok: false, reason: 'Tasks directory missing' };
      }
      
      const taskFiles = fs.readdirSync(tasksPath).filter(f => f.endsWith('.json'));
      if (taskFiles.length === 0) {
        return { ok: false, reason: 'No task JSON files found' };
      }
      
      return { ok: true, details: { taskFiles: taskFiles.length } };
      
    } catch (error: any) {
      return { ok: false, reason: `Tasks: ${error?.message || 'Unknown error'}` };
    }
  }

  private async checkAchievements(): Promise<CheckResult> {
    try {
      const achievementsPath = path.join(process.cwd(), 'game-data', 'achievements');
      if (!fs.existsSync(achievementsPath)) {
        return { ok: false, reason: 'Achievements directory missing' };
      }
      
      return { ok: true };
      
    } catch (error: any) {
      return { ok: false, reason: `Achievements: ${error?.message || 'Unknown error'}` };
    }
  }

  private async checkMedia(): Promise<CheckResult> {
    try {
      const publicPath = path.join(process.cwd(), 'public');
      if (!fs.existsSync(publicPath)) {
        return { ok: false, reason: 'Public directory missing' };
      }
      
      return { ok: true };
      
    } catch (error: any) {
      return { ok: false, reason: `Media: ${error?.message || 'Unknown error'}` };
    }
  }

  private async checkAuth(): Promise<CheckResult> {
    try {
      // Check if required environment variables exist
      const requiredEnvs = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
      const missingEnvs = requiredEnvs.filter(env => !process.env[env]);
      
      if (missingEnvs.length > 0) {
        return { ok: false, reason: `Missing env vars: ${missingEnvs.join(', ')}` };
      }
      
      return { ok: true };
      
    } catch (error: any) {
      return { ok: false, reason: `Auth: ${error?.message || 'Unknown error'}` };
    }
  }

  /**
   * 🗄️ POSTGREST CACHE REFRESH
   */
  private async refreshPostgRESTCache(): Promise<void> {
    try {
      const { SupabaseStorage } = await import('../SupabaseStorage');
      const storage = SupabaseStorage.getInstance();
      
      // Multiple strategies to force PostgREST schema reload
      const timestamp = Date.now();
      
      const refreshQueries = [
        `COMMENT ON SCHEMA public IS 'refresh-${timestamp}'`,
        `NOTIFY pgrst, 'reload schema'`,
        `SELECT 1 as cache_refresh_${timestamp}`
      ];
      
      for (const query of refreshQueries) {
        try {
          await storage.supabase.rpc('exec', { query });
        } catch (e) {
          // Ignore individual failures
        }
      }
      
    } catch (error) {
      console.warn('⚠️ [DEBUGGER] PostgREST cache refresh failed:', error);
    }
  }

  /**
   * 🧽 CLEANUP
   */
  destroy(): void {
    if (this.watchdogInterval) {
      clearInterval(this.watchdogInterval);
      this.watchdogInterval = undefined;
    }
    this.initialized = false;
  }
}

// Export singleton instance
export const Debugger = DebuggerService.getInstance();