/**
 * UpgradeStorage.ts - Fixed JSON-First Upgrade System
 * Fixed: Column name conflicts and schema alignment with Drizzle
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { SupabaseStorage } from './SupabaseStorage';

export interface Upgrade {
  id: string;
  key: string;
  name: string;
  description: string;
  category: 'lpPerTap' | 'energy' | 'passive' | 'charisma' | 'special' | 'lpPerHour';
  icon: string;
  baseCost: number;
  baseEffect: number;
  costMultiplier: number;
  effectMultiplier: number;
  maxLevel: number;
  requiredLevel: number;
  sortOrder: number;
  hourlyBonus: number;
  tapBonus: number;
  unlockRequirements: {
    upgradeId?: string;
    level?: number;
    totalUpgradeLevels?: number;
  };
}

export interface UserUpgrade {
  upgradeId: string;
  level: number;
}

export class UpgradeStorage {
  private static instance: UpgradeStorage;
  private static schemaInitialized = false;
  private static schemaInFlight: Promise<void> | null = null;
  private static lastSchemaCheck = 0;
  private static readonly SCHEMA_TTL_MS = 15 * 60 * 1000; // 15 minutes
  private cache: Map<string, Upgrade[]> = new Map();
  private storage = SupabaseStorage.getInstance();

  static getInstance() {
    if (!UpgradeStorage.instance) {
      UpgradeStorage.instance = new UpgradeStorage();
    }
    return UpgradeStorage.instance;
  }

  /**
   * 🚫 SIMPLIFIED SCHEMA CHECK (ANTI-SPAM)
   * Just ensures the userUpgrades table exists - doesn't recreate upgrades table
   */
  async ensureSchema(): Promise<void> {
    const now = Date.now();
    
    // Check if already initialized and within TTL
    if (UpgradeStorage.schemaInitialized && 
        (now - UpgradeStorage.lastSchemaCheck < UpgradeStorage.SCHEMA_TTL_MS)) {
      return; // Silent return - no spam
    }

    // If already in flight, wait for it
    if (UpgradeStorage.schemaInFlight) {
      return UpgradeStorage.schemaInFlight;
    }

    // Start schema initialization
    UpgradeStorage.schemaInFlight = this.doSchemaInit();
    
    try {
      await UpgradeStorage.schemaInFlight;
    } finally {
      UpgradeStorage.schemaInFlight = null;
    }
  }

  /**
   * 🔧 MINIMAL SCHEMA WORK (PRIVATE)
   * Only ensures userUpgrades table exists - relies on Drizzle for main schema
   */
  private async doSchemaInit(): Promise<void> {
    console.log('🔍 [UPGRADES] Checking schema (minimal approach)...');
    
    try {
      // Only ensure userUpgrades table exists (matches Drizzle schema exactly)
      const userUpgradesQuery = `
        CREATE TABLE IF NOT EXISTS "userUpgrades" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" UUID NOT NULL,
          "upgradeId" TEXT NOT NULL,
          "level" INTEGER NOT NULL DEFAULT 0,
          "purchasedAt" TIMESTAMP NOT NULL DEFAULT now()
        )`;

      try {
        await this.storage.supabase.rpc('exec', { query: userUpgradesQuery });
        console.log('✅ [UPGRADES] userUpgrades table ready');
      } catch (error: any) {
        // Table might already exist, that's fine
        if (!error.message?.includes('already exists')) {
          console.warn(`⚠️ [UPGRADES] Schema warning: ${error.message}`);
        }
      }

      // Mark as successful
      UpgradeStorage.schemaInitialized = true;
      UpgradeStorage.lastSchemaCheck = Date.now();
      console.log('✅ [UPGRADES] Schema check completed');

    } catch (error) {
      console.error('❌ [UPGRADES] Schema initialization failed:', error);
      // Set as initialized anyway to prevent infinite retries
      UpgradeStorage.schemaInitialized = true;
      UpgradeStorage.lastSchemaCheck = Date.now();
    }
  }

  /**
   * 📂 LOAD FILES WITHOUT SCHEMA CALLS
   * Prevents recursive schema initialization
   */
  private async loadAllUpgradesFromFiles(): Promise<Upgrade[]> {
    const files = [
      'tap-upgrades.json', 
      'energy-upgrades.json', 
      'passive-upgrades.json', 
      'special-upgrades.json',
      'lpPerHour.json',
      'lpPerTap.json',
      'booster-upgrades.json',
      'income-upgrades.json'
    ];
    
    const allUpgrades: Upgrade[] = [];

    for (const file of files) {
      const upgrades = await this.loadUpgradeFile(file);
      allUpgrades.push(...upgrades);
    }

    // Sort by category and sortOrder
    allUpgrades.sort((a, b) => {
      if (a.category !== b.category) {
        const categoryOrder = ['lpPerTap', 'energy', 'passive', 'lpPerHour', 'charisma', 'special'];
        return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
      }
      return a.sortOrder - b.sortOrder;
    });

    return allUpgrades;
  }

  private async loadUpgradeFile(filename: string): Promise<Upgrade[]> {
    const filePath = join(process.cwd(), 'game-data', 'upgrades', filename);
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(raw);
      
      // Handle both array and single object formats
      const upgrades = Array.isArray(data) ? data : [data];
      
      // Validate and normalize upgrades
      return upgrades.filter(upgrade => {
        return upgrade && 
               typeof upgrade.id === 'string' &&
               typeof upgrade.name === 'string' &&
               typeof upgrade.baseCost === 'number';
      }).map(upgrade => ({
        ...upgrade,
        unlockRequirements: upgrade.unlockRequirements || {}
      }));
    } catch (error) {
      console.warn(`Failed to load ${filename}:`, error);
      return [];
    }
  }

  /**
   * 📂 GET ALL UPGRADES (PUBLIC API)
   * Only calls schema init once, then uses cache
   */
  async getAllUpgrades(): Promise<Upgrade[]> {
    // Run schema check only once (throttled)
    await this.ensureSchema();
    
    const cacheKey = 'all';
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;

    // Load from files (no recursive schema calls)
    const allUpgrades = await this.loadAllUpgradesFromFiles();

    this.cache.set(cacheKey, allUpgrades);
    return allUpgrades;
  }

  async getUpgrade(upgradeId: string): Promise<Upgrade | null> {
    const allUpgrades = await this.getAllUpgrades();
    return allUpgrades.find(u => u.id === upgradeId) || null;
  }

  async getUpgradesByCategory(category: string): Promise<Upgrade[]> {
    const allUpgrades = await this.getAllUpgrades();
    return allUpgrades.filter(u => u.category === category);
  }

  calculateCost(upgrade: Upgrade, currentLevel: number): number {
    if (currentLevel >= upgrade.maxLevel) return Infinity;
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier || 1.5, currentLevel));
  }

  calculateEffect(upgrade: Upgrade, level: number): number {
    if (level === 0) return 0;
    return upgrade.baseEffect + (upgrade.effectMultiplier * (level - 1));
  }

  calculateTotalEffect(upgrade: Upgrade, level: number): number {
    if (level === 0) return upgrade.baseEffect;
    // For multiplicative effects, compound the bonus
    if (upgrade.category === 'lpPerTap' && upgrade.id !== 'mega-tap') {
      return upgrade.baseEffect * Math.pow(1 + upgrade.effectMultiplier, level - 1);
    }
    // For additive effects
    return upgrade.baseEffect + (upgrade.effectMultiplier * level);
  }

  /**
   * 📋 DATABASE OPERATIONS (THROTTLED)
   * Only run schema once, then use for all DB calls
   */
  async getUserUpgrades(userId: string): Promise<UserUpgrade[]> {
    await this.ensureSchema(); // Throttled call
    
    const { data, error } = await this.storage.supabase
      .from('userUpgrades')
      .select('upgradeId, level')
      .eq('userId', userId);
    
    if (error) {
      console.error('Failed to get user upgrades:', error);
      return [];
    }
    
    return data || [];
  }

  async getUserUpgradeLevel(userId: string, upgradeId: string): Promise<number> {
    await this.ensureSchema(); // Throttled call
    
    const userUpgrades = await this.getUserUpgrades(userId);
    const upgrade = userUpgrades.find(u => u.upgradeId === upgradeId);
    return upgrade?.level || 0;
  }

  async isUpgradeUnlocked(userId: string, upgrade: Upgrade): Promise<boolean> {
    const user = await this.storage.getUser(userId);
    if (!user) return false;

    // Check user level requirement
    if ((user.level || 1) < upgrade.requiredLevel) return false;

    // Check upgrade requirements
    if (upgrade.unlockRequirements.upgradeId && upgrade.unlockRequirements.level) {
      const requiredLevel = await this.getUserUpgradeLevel(userId, upgrade.unlockRequirements.upgradeId);
      if (requiredLevel < upgrade.unlockRequirements.level) return false;
    }

    // Check total upgrade levels requirement
    if (upgrade.unlockRequirements.totalUpgradeLevels) {
      const userUpgrades = await this.getUserUpgrades(userId);
      const totalLevels = userUpgrades.reduce((sum, u) => sum + u.level, 0);
      if (totalLevels < upgrade.unlockRequirements.totalUpgradeLevels) return false;
    }

    return true;
  }

  async getAvailableUpgrades(userId: string): Promise<(Upgrade & { currentLevel: number; nextCost: number; canAfford: boolean })[]> {
    // Single schema check at start
    await this.ensureSchema();
    
    const allUpgrades = await this.getAllUpgrades();
    const user = await this.storage.getUser(userId);
    const userUpgrades = await this.getUserUpgrades(userId);
    
    if (!user) return [];

    const result = [];
    for (const upgrade of allUpgrades) {
      const isUnlocked = await this.isUpgradeUnlocked(userId, upgrade);
      if (!isUnlocked) continue;

      const currentLevel = await this.getUserUpgradeLevel(userId, upgrade.id);
      const nextCost = this.calculateCost(upgrade, currentLevel);
      const canAfford = (user.lp || 0) >= nextCost;

      result.push({
        ...upgrade,
        currentLevel,
        nextCost,
        canAfford
      });
    }

    return result;
  }

  async validatePurchase(userId: string, upgradeId: string): Promise<{ valid: boolean; reason?: string; cost?: number }> {
    await this.ensureSchema(); // Throttled call
    
    const upgrade = await this.getUpgrade(upgradeId);
    if (!upgrade) return { valid: false, reason: 'Upgrade not found' };

    const user = await this.storage.getUser(userId);
    if (!user) return { valid: false, reason: 'User not found' };

    const isUnlocked = await this.isUpgradeUnlocked(userId, upgrade);
    if (!isUnlocked) return { valid: false, reason: 'Upgrade not unlocked' };

    const currentLevel = await this.getUserUpgradeLevel(userId, upgradeId);
    if (currentLevel >= upgrade.maxLevel) return { valid: false, reason: 'Max level reached' };

    const cost = this.calculateCost(upgrade, currentLevel);
    if ((user.lp || 0) < cost) return { valid: false, reason: 'Insufficient LP', cost };

    return { valid: true, cost };
  }

  /**
   * 🧹 ADMIN CONTROLS
   */
  clearCache() {
    this.cache.clear();
  }

  // Force schema re-initialization (for admin endpoints)
  forceSchemaRefresh() {
    UpgradeStorage.schemaInitialized = false;
    UpgradeStorage.lastSchemaCheck = 0;
    UpgradeStorage.schemaInFlight = null;
    this.cache.clear();
  }
}