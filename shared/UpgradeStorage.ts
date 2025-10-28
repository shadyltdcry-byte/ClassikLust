/**
 * UpgradeStorage.ts - Pure JSON-First Upgrade System
 * Now with upgrade effects application to user stats
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
  unlockRequirements?: {
    upgradeId?: string;
    level?: number;
    totalUpgradeLevels?: number;
  };
}

export interface UserUpgrade {
  upgradeId: string;
  level: number;
}

export interface ComputedStats {
  lpPerTap: number;
  lpPerHour: number;
  maxEnergy: number;
  energy?: number; // optional to cap energy to new maxEnergy
}

export class UpgradeStorage {
  private static instance: UpgradeStorage;
  private cache: Map<string, Upgrade[]> = new Map();
  private storage = SupabaseStorage.getInstance();

  static getInstance() {
    if (!UpgradeStorage.instance) {
      UpgradeStorage.instance = new UpgradeStorage();
    }
    return UpgradeStorage.instance;
  }

  /**
   * 📂 LOAD ALL UPGRADES FROM JSON FILES
   * Pure file-based system - no database table creation
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
      console.warn(`⚠️ Failed to load ${filename}:`, error);
      return [];
    }
  }

  /**
   * 📂 GET ALL UPGRADES (PUBLIC API)
   * Reads from JSON files and caches results
   */
  async getAllUpgrades(): Promise<Upgrade[]> {
    const cacheKey = 'all';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    console.log('📈 [UPGRADES] Loading upgrades from JSON files...');
    const allUpgrades = await this.loadAllUpgradesFromFiles();
    console.log(`📈 [UPGRADES] Loaded ${allUpgrades.length} upgrades from JSON`);

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
    if (level === 0) return 0;
    
    // Use tapBonus and hourlyBonus from JSON if available
    if (upgrade.tapBonus && upgrade.category === 'lpPerTap') {
      return upgrade.tapBonus * level;
    }
    if (upgrade.hourlyBonus && upgrade.category === 'lpPerHour') {
      return upgrade.hourlyBonus * level;
    }
    
    // Fallback to original calculation
    if (upgrade.category === 'lpPerTap' && upgrade.id !== 'mega-tap') {
      return upgrade.baseEffect * Math.pow(1 + upgrade.effectMultiplier, level - 1);
    }
    // For additive effects
    return upgrade.baseEffect + (upgrade.effectMultiplier * level);
  }

  /**
   * 🔥 NEW: APPLY UPGRADE EFFECTS TO USER STATS
   * Recalculates user stats based on purchased upgrades and saves to database
   */
  async applyUserUpgradeEffects(userId: string): Promise<ComputedStats> {
    console.log(`⚡ [EFFECTS] Applying upgrade effects for user: ${userId}`);
    
    const allUpgrades = await this.getAllUpgrades();
    const userUpgrades = await this.getUserUpgrades(userId);
    const user = await this.storage.getUser(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Base stats (default values)
    let lpPerTap = 2;      // base tap power
    let lpPerHour = 250;   // base passive income
    let maxEnergy = 1000;  // base energy capacity

    console.log(`⚡ [EFFECTS] Processing ${userUpgrades.length} purchased upgrades...`);

    // Apply effects from each purchased upgrade
    for (const userUpgrade of userUpgrades) {
      const upgrade = allUpgrades.find(u => u.id === userUpgrade.upgradeId);
      if (!upgrade || userUpgrade.level === 0) continue;

      const effectValue = this.calculateTotalEffect(upgrade, userUpgrade.level);
      console.log(`⚡ [EFFECTS] ${upgrade.name} level ${userUpgrade.level}: +${effectValue} ${upgrade.category}`);

      switch (upgrade.category) {
        case 'lpPerTap':
          lpPerTap += effectValue;
          break;
        case 'lpPerHour':
          lpPerHour += effectValue;
          break;
        case 'energy':
          maxEnergy += effectValue;
          break;
        case 'passive':
          lpPerHour += effectValue; // passive upgrades boost hourly income
          break;
      }
    }

    // Cap current energy to new max if energy was increased
    let newEnergy = user.energy;
    if (maxEnergy > (user.maxEnergy || 1000)) {
      newEnergy = Math.min(user.energy, maxEnergy);
    }

    const newStats: ComputedStats = {
      lpPerTap: Math.max(1, Math.floor(lpPerTap)),
      lpPerHour: Math.max(10, Math.floor(lpPerHour)),
      maxEnergy: Math.max(1000, Math.floor(maxEnergy)),
      energy: newEnergy
    };

    console.log(`⚡ [EFFECTS] Final stats: lpPerTap=${newStats.lpPerTap}, lpPerHour=${newStats.lpPerHour}, maxEnergy=${newStats.maxEnergy}`);

    // Update user stats in database
    await this.storage.updateUser(userId, {
      lpPerTap: newStats.lpPerTap,
      lpPerHour: newStats.lpPerHour,
      maxEnergy: newStats.maxEnergy,
      energy: newStats.energy
    });

    return newStats;
  }

  /**
   * 📋 USER UPGRADE PROGRESS (DATABASE ONLY FOR USER DATA)
   * Works directly with telegram IDs - no UUID conversion needed!
   */
  async getUserUpgrades(userId: string): Promise<UserUpgrade[]> {
    try {
      const { data, error } = await this.storage.supabase
        .from('userUpgrades')
        .select('upgradeId, level')
        .eq('userId', userId); // Direct telegram ID usage - no conversion!
      
      if (error) {
        console.error('❌ Failed to get user upgrades:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching user upgrades:', error);
      return [];
    }
  }

  async getUserUpgradeLevel(userId: string, upgradeId: string): Promise<number> {
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
    if (upgrade.unlockRequirements?.upgradeId && upgrade.unlockRequirements?.level) {
      const requiredLevel = await this.getUserUpgradeLevel(userId, upgrade.unlockRequirements.upgradeId);
      if (requiredLevel < upgrade.unlockRequirements.level) return false;
    }

    // Check total upgrade levels requirement
    if (upgrade.unlockRequirements?.totalUpgradeLevels) {
      const userUpgrades = await this.getUserUpgrades(userId);
      const totalLevels = userUpgrades.reduce((sum, u) => sum + u.level, 0);
      if (totalLevels < upgrade.unlockRequirements.totalUpgradeLevels) return false;
    }

    return true;
  }

  async getAvailableUpgrades(userId: string): Promise<(Upgrade & { currentLevel: number; nextCost: number; canAfford: boolean })[]> {
    const allUpgrades = await this.getAllUpgrades();
    const user = await this.storage.getUser(userId);
    
    if (!user) {
      console.warn('⚠️ User not found:', userId);
      return [];
    }

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
    const upgrade = await this.getUpgrade(upgradeId);
    if (!upgrade) {
      return { valid: false, reason: 'Upgrade not found in JSON files' };
    }

    const user = await this.storage.getUser(userId);
    if (!user) {
      return { valid: false, reason: 'User not found' };
    }

    const isUnlocked = await this.isUpgradeUnlocked(userId, upgrade);
    if (!isUnlocked) {
      return { valid: false, reason: 'Upgrade not unlocked' };
    }

    const currentLevel = await this.getUserUpgradeLevel(userId, upgradeId);
    if (currentLevel >= upgrade.maxLevel) {
      return { valid: false, reason: 'Max level reached' };
    }

    const cost = this.calculateCost(upgrade, currentLevel);
    if ((user.lp || 0) < cost) {
      return { valid: false, reason: 'Insufficient LP', cost };
    }

    return { valid: true, cost };
  }

  /**
   * 🧹 ADMIN CONTROLS
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 [UPGRADES] Cache cleared');
  }

  // Get upgrade categories for admin/debug
  async getUpgradeCategories(): Promise<Record<string, Upgrade[]>> {
    const allUpgrades = await this.getAllUpgrades();
    const categories: Record<string, Upgrade[]> = {};

    for (const upgrade of allUpgrades) {
      if (!categories[upgrade.category]) {
        categories[upgrade.category] = [];
      }
      categories[upgrade.category].push(upgrade);
    }

    return categories;
  }

  // Debug info
  async getDebugInfo(): Promise<any> {
    const allUpgrades = await this.getAllUpgrades();
    const categories = await this.getUpgradeCategories();
    
    return {
      totalUpgrades: allUpgrades.length,
      categories: Object.keys(categories).map(cat => ({
        name: cat,
        count: categories[cat].length
      })),
      cacheSize: this.cache.size
    };
  }
}