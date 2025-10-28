// 🎯 FileStorage - COMPLETE JSON-first data management revolution!
// No more hardcoded plugin bullshit, no more database normalization hell!
// SINGLE SOURCE OF TRUTH: JSON files rule everything! 💪

import { promises as fs } from 'fs';
import { join } from 'path';
import type { Upgrade, Achievement, Task, LevelRequirement, GameSettings } from './schema';

export class FileStorage {
  private static instance: FileStorage;
  private gameDataPath: string;
  private cache: Map<string, any> = new Map();

  constructor() {
    this.gameDataPath = join(process.cwd(), 'game-data');
    FileStorage.instance = this;
    console.log('[FileStorage] 🔥 COMPLETE JSON-first data system initialized! 🎯');
  }

  static getInstance(): FileStorage {
    if (!FileStorage.instance) {
      FileStorage.instance = new FileStorage();
    }
    return FileStorage.instance;
  }

  // 🎯 Generic JSON file operations
  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Directory might already exist, that's fine
    }
  }

  private async readJSON<T>(filePath: string, defaultValue: T[] = []): Promise<T[]> {
    const fullPath = join(this.gameDataPath, filePath);
    
    try {
      const data = await fs.readFile(fullPath, 'utf8');
      return JSON.parse(data) || defaultValue;
    } catch (error) {
      // File doesn't exist or is invalid - return default
      console.log(`[FileStorage] Creating new file: ${filePath}`);
      return defaultValue as T[];
    }
  }

  private async writeJSON<T>(filePath: string, data: T[]): Promise<void> {
    const fullPath = join(this.gameDataPath, filePath);
    const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
    
    await this.ensureDirectory(dir);
    await fs.writeFile(fullPath, JSON.stringify(data, null, 2), 'utf8');
    
    // Update cache
    this.cache.set(filePath, data);
    console.log(`[FileStorage] 💾 Saved ${data.length} items to ${filePath}`);
  }

  private async getCached<T>(filePath: string): Promise<T[]> {
    if (this.cache.has(filePath)) {
      return this.cache.get(filePath);
    }
    
    const data = await this.readJSON<T>(filePath);
    this.cache.set(filePath, data);
    return data;
  }

  // 🔥 UPGRADES - JSON-FIRST! (EXISTING - WORKING PERFECTLY)
  async getAllUpgrades(): Promise<Upgrade[]> {
    const [tapUpgrades, incomeUpgrades, specialUpgrades, boosterUpgrades] = await Promise.all([
      this.getCached<Upgrade>('upgrades/tap-upgrades.json'),
      this.getCached<Upgrade>('upgrades/income-upgrades.json'),
      this.getCached<Upgrade>('upgrades/special-upgrades.json'),
      this.getCached<Upgrade>('upgrades/booster-upgrades.json'),
    ]);

    return [...tapUpgrades, ...incomeUpgrades, ...specialUpgrades, ...boosterUpgrades];
  }

  async getUpgradesByCategory(category: string): Promise<Upgrade[]> {
    const allUpgrades = await this.getAllUpgrades();
    return allUpgrades.filter(upgrade => upgrade.category === category);
  }

  async getUpgrade(id: string): Promise<Upgrade | undefined> {
    const allUpgrades = await this.getAllUpgrades();
    return allUpgrades.find(upgrade => upgrade.id === id);
  }

  async createUpgrade(upgrade: Upgrade): Promise<Upgrade> {
    const fileName = this.getUpgradeFileName(upgrade.category);
    const upgrades = await this.getCached<Upgrade>(fileName);
    
    upgrade.createdAt = new Date();
    upgrade.updatedAt = new Date();
    
    upgrades.push(upgrade);
    await this.writeJSON(fileName, upgrades);
    
    return upgrade;
  }

  async updateUpgrade(id: string, updates: Partial<Upgrade>): Promise<Upgrade | undefined> {
    const allUpgrades = await this.getAllUpgrades();
    const existingUpgrade = allUpgrades.find(u => u.id === id);
    
    if (!existingUpgrade) {
      return undefined;
    }

    const fileName = this.getUpgradeFileName(existingUpgrade.category);
    const upgrades = await this.getCached<Upgrade>(fileName);
    
    const index = upgrades.findIndex(u => u.id === id);
    if (index === -1) return undefined;

    upgrades[index] = {
      ...upgrades[index],
      ...updates,
      updatedAt: new Date()
    };

    await this.writeJSON(fileName, upgrades);
    return upgrades[index];
  }

  async deleteUpgrade(id: string): Promise<boolean> {
    const allUpgrades = await this.getAllUpgrades();
    const existingUpgrade = allUpgrades.find(u => u.id === id);
    
    if (!existingUpgrade) {
      return false;
    }

    const fileName = this.getUpgradeFileName(existingUpgrade.category);
    const upgrades = await this.getCached<Upgrade>(fileName);
    
    const filteredUpgrades = upgrades.filter(u => u.id !== id);
    await this.writeJSON(fileName, filteredUpgrades);
    
    return true;
  }

  private getUpgradeFileName(category: string): string {
    switch (category.toLowerCase()) {
      case 'lpertap':
      case 'tap':
        return 'upgrades/tap-upgrades.json';
      case 'lperhour': 
      case 'income':
      case 'hour':
        return 'upgrades/income-upgrades.json';
      case 'special':
        return 'upgrades/special-upgrades.json';
      case 'booster':
        return 'upgrades/booster-upgrades.json';
      default:
        return 'upgrades/tap-upgrades.json';
    }
  }

  // 🔥 ACHIEVEMENTS - JSON-FIRST! (EXISTING - WORKING PERFECTLY)
  async getAllAchievements(): Promise<Achievement[]> {
    const [collectionAchievements, gameplayAchievements, socialAchievements] = await Promise.all([
      this.getCached<Achievement>('achievements/collection.json'),
      this.getCached<Achievement>('achievements/gameplay.json'),
      this.getCached<Achievement>('achievements/social.json'),
    ]);

    return [...collectionAchievements, ...gameplayAchievements, ...socialAchievements];
  }

  async getAchievementsByCategory(category: string): Promise<Achievement[]> {
    const allAchievements = await this.getAllAchievements();
    return allAchievements.filter(achievement => achievement.category === category);
  }

  async getAchievement(id: string): Promise<Achievement | undefined> {
    const allAchievements = await this.getAllAchievements();
    return allAchievements.find(achievement => achievement.id === id);
  }

  async createAchievement(achievement: Achievement): Promise<Achievement> {
    const fileName = this.getAchievementFileName(achievement.category);
    const achievements = await this.getCached<Achievement>(fileName);
    
    achievement.createdAt = new Date();
    achievement.updatedAt = new Date();
    
    achievements.push(achievement);
    await this.writeJSON(fileName, achievements);
    
    return achievement;
  }

  async updateAchievement(id: string, updates: Partial<Achievement>): Promise<Achievement | undefined> {
    const allAchievements = await this.getAllAchievements();
    const existingAchievement = allAchievements.find(a => a.id === id);
    
    if (!existingAchievement) {
      return undefined;
    }

    const fileName = this.getAchievementFileName(existingAchievement.category);
    const achievements = await this.getCached<Achievement>(fileName);
    
    const index = achievements.findIndex(a => a.id === id);
    if (index === -1) return undefined;

    achievements[index] = {
      ...achievements[index],
      ...updates,
      updatedAt: new Date()
    };

    await this.writeJSON(fileName, achievements);
    return achievements[index];
  }

  async deleteAchievement(id: string): Promise<boolean> {
    const allAchievements = await this.getAllAchievements();
    const existingAchievement = allAchievements.find(a => a.id === id);
    
    if (!existingAchievement) {
      return false;
    }

    const fileName = this.getAchievementFileName(existingAchievement.category);
    const achievements = await this.getCached<Achievement>(fileName);
    
    const filteredAchievements = achievements.filter(a => a.id !== id);
    await this.writeJSON(fileName, filteredAchievements);
    
    return true;
  }

  private getAchievementFileName(category: string): string {
    switch (category.toLowerCase()) {
      case 'collection':
        return 'achievements/collection.json';
      case 'gameplay':
        return 'achievements/gameplay.json';
      case 'social':
        return 'achievements/social.json';
      default:
        return 'achievements/collection.json';
    }
  }

  // 🚀 NEW: TASKS - JSON-FIRST!
  async getAllTasks(): Promise<Task[]> {
    const [dailyTasks, weeklyTasks, eventTasks] = await Promise.all([
      this.getCached<Task>('tasks/daily.json'),
      this.getCached<Task>('tasks/weekly.json'),
      this.getCached<Task>('tasks/events.json'),
    ]);

    return [...dailyTasks, ...weeklyTasks, ...eventTasks];
  }

  async getTasksByCategory(category: string): Promise<Task[]> {
    const allTasks = await this.getAllTasks();
    return allTasks.filter(task => task.category === category);
  }

  async getTask(id: string): Promise<Task | undefined> {
    const allTasks = await this.getAllTasks();
    return allTasks.find(task => task.id === id);
  }

  async createTask(task: Task): Promise<Task> {
    const fileName = this.getTaskFileName(task.category);
    const tasks = await this.getCached<Task>(fileName);
    
    task.createdAt = new Date();
    task.updatedAt = new Date();
    
    tasks.push(task);
    await this.writeJSON(fileName, tasks);
    
    return task;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
    const allTasks = await this.getAllTasks();
    const existingTask = allTasks.find(t => t.id === id);
    
    if (!existingTask) {
      return undefined;
    }

    const fileName = this.getTaskFileName(existingTask.category);
    const tasks = await this.getCached<Task>(fileName);
    
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return undefined;

    tasks[index] = {
      ...tasks[index],
      ...updates,
      updatedAt: new Date()
    };

    await this.writeJSON(fileName, tasks);
    return tasks[index];
  }

  async deleteTask(id: string): Promise<boolean> {
    const allTasks = await this.getAllTasks();
    const existingTask = allTasks.find(t => t.id === id);
    
    if (!existingTask) {
      return false;
    }

    const fileName = this.getTaskFileName(existingTask.category);
    const tasks = await this.getCached<Task>(fileName);
    
    const filteredTasks = tasks.filter(t => t.id !== id);
    await this.writeJSON(fileName, filteredTasks);
    
    return true;
  }

  private getTaskFileName(category: string): string {
    switch (category.toLowerCase()) {
      case 'daily':
        return 'tasks/daily.json';
      case 'weekly':
        return 'tasks/weekly.json';
      case 'event':
      case 'events':
        return 'tasks/events.json';
      default:
        return 'tasks/daily.json';
    }
  }

  // 🚀 NEW: PROGRESSION - JSON-FIRST!
  async getAllLevelRequirements(): Promise<LevelRequirement[]> {
    return await this.getCached<LevelRequirement>('progression/level-requirements.json');
  }

  async getLevelRequirement(level: number): Promise<LevelRequirement | undefined> {
    const requirements = await this.getAllLevelRequirements();
    return requirements.find(req => req.level === level);
  }

  async createLevelRequirement(requirement: LevelRequirement): Promise<LevelRequirement> {
    const requirements = await this.getCached<LevelRequirement>('progression/level-requirements.json');
    
    requirement.createdAt = new Date();
    requirement.updatedAt = new Date();
    
    requirements.push(requirement);
    await this.writeJSON('progression/level-requirements.json', requirements);
    
    return requirement;
  }

  async updateLevelRequirement(level: number, updates: Partial<LevelRequirement>): Promise<LevelRequirement | undefined> {
    const requirements = await this.getCached<LevelRequirement>('progression/level-requirements.json');
    
    const index = requirements.findIndex(req => req.level === level);
    if (index === -1) return undefined;

    requirements[index] = {
      ...requirements[index],
      ...updates,
      updatedAt: new Date()
    };

    await this.writeJSON('progression/level-requirements.json', requirements);
    return requirements[index];
  }

  async deleteLevelRequirement(level: number): Promise<boolean> {
    const requirements = await this.getCached<LevelRequirement>('progression/level-requirements.json');
    const filteredRequirements = requirements.filter(req => req.level !== level);
    
    if (filteredRequirements.length === requirements.length) {
      return false; // Nothing was deleted
    }

    await this.writeJSON('progression/level-requirements.json', filteredRequirements);
    return true;
  }

  // 🚀 NEW: SETTINGS - JSON-FIRST!
  async getGameSettings(): Promise<GameSettings> {
    const settingsArray = await this.getCached<GameSettings>('settings/game-settings.json');
    // Settings is a single object, not an array
    if (settingsArray.length > 0) {
      return settingsArray[0];
    }
    
    // Return default settings
    const defaultSettings: GameSettings = {
      id: 'game-settings',
      maxEnergy: 100,
      energyRegenRate: 1,
      tapCooldown: 0.1,
      maxLevel: 100,
      baseExperienceRequired: 100,
      experienceMultiplier: 1.5,
      autoSaveInterval: 30000,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await this.writeJSON('settings/game-settings.json', [defaultSettings]);
    return defaultSettings;
  }

  async updateGameSettings(updates: Partial<GameSettings>): Promise<GameSettings> {
    const currentSettings = await this.getGameSettings();
    
    const updatedSettings: GameSettings = {
      ...currentSettings,
      ...updates,
      updatedAt: new Date()
    };

    await this.writeJSON('settings/game-settings.json', [updatedSettings]);
    return updatedSettings;
  }

  // 🎯 CACHE MANAGEMENT
  clearCache(): void {
    this.cache.clear();
    console.log('[FileStorage] 🧹 Cache cleared!');
  }

  getCacheStats(): { files: number; totalItems: number } {
    let totalItems = 0;
    for (const data of this.cache.values()) {
      if (Array.isArray(data)) {
        totalItems += data.length;
      }
    }
    
    return {
      files: this.cache.size,
      totalItems
    };
  }

  // 🎯 EXPORT/IMPORT UTILITIES
  async exportAllData(): Promise<any> {
    return {
      upgrades: await this.getAllUpgrades(),
      achievements: await this.getAllAchievements(),
      tasks: await this.getAllTasks(),
      levelRequirements: await this.getAllLevelRequirements(),
      gameSettings: await this.getGameSettings(),
      exportedAt: new Date().toISOString()
    };
  }

  // 🎯 Initialize default directory structure
  async initializeDirectories(): Promise<void> {
    const directories = [
      'upgrades',
      'achievements', 
      'progression',
      'tasks',
      'settings'
    ];

    for (const dir of directories) {
      await this.ensureDirectory(join(this.gameDataPath, dir));
    }

    console.log('[FileStorage] 📁 COMPLETE directory structure initialized!');
  }

  // 🚀 BULK OPERATIONS for performance
  async batchCreateUpgrades(upgrades: Upgrade[]): Promise<Upgrade[]> {
    const groupedByCategory = upgrades.reduce((acc, upgrade) => {
      const fileName = this.getUpgradeFileName(upgrade.category);
      if (!acc[fileName]) acc[fileName] = [];
      
      upgrade.createdAt = new Date();
      upgrade.updatedAt = new Date();
      acc[fileName].push(upgrade);
      
      return acc;
    }, {} as Record<string, Upgrade[]>);

    for (const [fileName, upgradeGroup] of Object.entries(groupedByCategory)) {
      const existing = await this.getCached<Upgrade>(fileName);
      existing.push(...upgradeGroup);
      await this.writeJSON(fileName, existing);
    }

    return upgrades;
  }

  async batchCreateAchievements(achievements: Achievement[]): Promise<Achievement[]> {
    const groupedByCategory = achievements.reduce((acc, achievement) => {
      const fileName = this.getAchievementFileName(achievement.category);
      if (!acc[fileName]) acc[fileName] = [];
      
      achievement.createdAt = new Date();
      achievement.updatedAt = new Date();
      acc[fileName].push(achievement);
      
      return acc;
    }, {} as Record<string, Achievement[]>);

    for (const [fileName, achievementGroup] of Object.entries(groupedByCategory)) {
      const existing = await this.getCached<Achievement>(fileName);
      existing.push(...achievementGroup);
      await this.writeJSON(fileName, existing);
    }

    return achievements;
  }

  // 🎯 VALIDATION & INTEGRITY CHECKS
  async validateDataIntegrity(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      // Check all upgrades have unique IDs
      const upgrades = await this.getAllUpgrades();
      const upgradeIds = upgrades.map(u => u.id);
      const uniqueUpgradeIds = new Set(upgradeIds);
      
      if (upgradeIds.length !== uniqueUpgradeIds.size) {
        errors.push('Duplicate upgrade IDs found');
      }

      // Check all achievements have unique IDs
      const achievements = await this.getAllAchievements();
      const achievementIds = achievements.map(a => a.id);
      const uniqueAchievementIds = new Set(achievementIds);
      
      if (achievementIds.length !== uniqueAchievementIds.size) {
        errors.push('Duplicate achievement IDs found');
      }

      // Check level requirements are sequential
      const levelRequirements = await this.getAllLevelRequirements();
      const levels = levelRequirements.map(lr => lr.level).sort((a, b) => a - b);
      
      for (let i = 1; i < levels.length; i++) {
        if (levels[i] !== levels[i-1] + 1) {
          errors.push(`Missing level requirement for level ${levels[i-1] + 1}`);
        }
      }

    } catch (error) {
      errors.push(`Validation error: ${error}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}