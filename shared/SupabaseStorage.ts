//MOTHER FUCKING BALL SACK OF TITTIES BRUH. :)
// 🎯 NOW WITH JSON-FIRST ARCHITECTURE! NO MORE HARDCODED CHAOS! 🔥

import { createClient } from '@supabase/supabase-js';
import {
  type User,
  type InsertUser,
  type Character,
  type InsertCharacter,
  type Upgrade,
  type InsertUpgrade,
  type GameStats,
  type ChatMessage,
  type InsertChatMessage,
  type MediaFile,
  users,
  characters,
  userCharacters,
  mediaFiles,
  upgrades,
  userUpgrades,
  boosters,
  wheelRewards,
  gameStats,
  chatMessages,
  bonuses
} from "./schema";
import { IStorage } from './storage';
import { FileStorage } from './FileStorage'; // 🎯 JSON-FIRST POWER!

// 🎯 Field normalization - fixes PostgREST casing issues (for DB only now)
const toCamel: Record<string, string> = {
  basecost: 'baseCost',
  baseeffect: 'baseEffect',
  costmultiplier: 'costMultiplier',
  effectmultiplier: 'effectMultiplier',
  maxlevel: 'maxLevel',
  levelrequirement: 'levelRequirement',
  unlocklevel: 'unlockLevel',
  currentlevel: 'currentLevel',
  sortorder: 'sortOrder',
  hourlybonus: 'hourlyBonus',
  tapbonus: 'tapBonus',
  requiredlevel: 'requiredLevel',
  createdat: 'createdAt',
  updatedat: 'updatedAt',
};

const toSnake: Record<string, string> = Object.fromEntries(
  Object.entries(toCamel).map(([k, v]) => [v, k])
);

function normalizeFromDb<T extends Record<string, any>>(row: T): T {
  if (!row || typeof row !== 'object') return row;
  const out: any = Array.isArray(row) ? [] : {};
  for (const [k, v] of Object.entries(row)) {
    const key = toCamel[k] ?? k;
    out[key] = v && typeof v === 'object' && !Array.isArray(v)
      ? normalizeFromDb(v as any) : v;
  }
  return out;
}

function normalizeToDb<T extends Record<string, any>>(row: T): T {
  if (!row || typeof row !== 'object') return row;
  const out: any = Array.isArray(row) ? [] : {};
  for (const [k, v] of Object.entries(row)) {
    const key = toSnake[k] ?? k;
    out[key] = v && typeof v === 'object' && !Array.isArray(v)
      ? normalizeToDb(v as any) : v;
  }
  return out;
}

// Define GameSettings type since it's referenced but not in schema
interface GameSettings {
  id: string;
  nsfwEnabled: boolean;
  vipEnabled: boolean;
  autoSave: boolean;
  soundEnabled: boolean;
  notifications: boolean;
  [key: string]: any;
}

export class SupabaseStorage implements IStorage {
  private static instance: SupabaseStorage;
  private supabaseClient;
  private fileStorage: FileStorage; // 🎯 THE GAME CHANGER!
  public get supabase() { return this.supabaseClient; }

  constructor() {
    let supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
      supabaseUrl = `https://${supabaseUrl}.supabase.co`;
    }

    this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 🎯 Initialize FileStorage for JSON-first architecture!
    this.fileStorage = FileStorage.getInstance();
    this.fileStorage.initializeDirectories(); // Ensure directory structure exists
    
    SupabaseStorage.instance = this;
    console.log('🎯 SupabaseStorage initialized with JSON-first FileStorage! 🔥');
  }

  static getInstance(): SupabaseStorage {
    if (!SupabaseStorage.instance) {
      SupabaseStorage.instance = new SupabaseStorage();
    }
    return SupabaseStorage.instance;
  }

  // User management (UNCHANGED - uses database)
  async getUser(id: string): Promise<User | undefined> {
    if (id.startsWith('telegram_')) {
      const telegramId = id.replace('telegram_', '');
      const { data, error } = await this.supabase
        .from('users').select('*').eq('telegramId', telegramId).maybeSingle();
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user by telegram ID:', error);
        return undefined;
      }
      return data || undefined;
    } else {
      const { data, error } = await this.supabase
        .from('users').select('*').eq('id', id).maybeSingle();
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user by UUID:', error);
        return undefined;
      }
      return data || undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from('users').select('*').eq('username', username).maybeSingle();
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user by username:', error);
      return undefined;
    }
    return data || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await this.supabase.from('users').insert(user).select().single();
    if (error) throw error;
    return data;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const safeUpdates = { ...updates };
    Object.keys(safeUpdates).forEach(key => {
      if (safeUpdates[key] === undefined || safeUpdates[key] === null) {
        delete safeUpdates[key];
      }
    });

    if (id.startsWith('telegram_')) {
      const telegramId = id.replace('telegram_', '');
      const { data, error } = await this.supabase
        .from('users').update(safeUpdates).eq('telegramId', telegramId).select().maybeSingle();
      if (error && error.code !== 'PGRST116') {
        console.error('Error updating user by telegram ID:', error);
        return undefined;
      }
      return data || undefined;
    } else {
      const { data, error } = await this.supabase
        .from('users').update(safeUpdates).eq('id', id).select().maybeSingle();
      if (error && error.code !== 'PGRST116') {
        console.error('Error updating user by UUID:', error);
        return undefined;
      }
      return data || undefined;
    }
  }

  // Character management (UNCHANGED - uses JSON files)
  async getCharacter(id: string): Promise<Character | undefined> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const characterDataPath = path.join(process.cwd(), 'character-data');
      if (!fs.existsSync(characterDataPath)) return undefined;
      const files = fs.readdirSync(characterDataPath).filter(file => file.endsWith('.json'));
      for (const file of files) {
        try {
          const filePath = path.join(characterDataPath, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const character = JSON.parse(fileContent);
          if (character.id === id) {
            return {
              ...character,
              createdAt: new Date(character.createdAt),
              updatedAt: new Date(character.updatedAt || character.createdAt)
            };
          }
        } catch (fileError) {
          console.error(`Error loading character from ${file}:`, fileError);
        }
      }
      return undefined;
    } catch (error) {
      console.error('Error loading character from file:', error);
      return undefined;
    }
  }

  async getUserCharacters(userId: string): Promise<Character[]> {
    const { data, error } = await this.supabase
      .from('userCharacters').select('characters (*)').eq('userId', userId);
    if (error) {
      console.error('Error fetching user characters:', error);
      return [];
    }
    return (data?.map((item: any) => item.characters) || []).filter(Boolean) as Character[];
  }

  async getAllCharacters(): Promise<Character[]> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const characterDataPath = path.join(process.cwd(), 'character-data');
      if (!fs.existsSync(characterDataPath)) {
        console.log('No character-data directory found');
        return [];
      }
      const files = fs.readdirSync(characterDataPath).filter(file => file.endsWith('.json'));
      const characters: Character[] = [];
      for (const file of files) {
        try {
          const filePath = path.join(characterDataPath, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const character = JSON.parse(fileContent);
          characters.push({
            ...character,
            createdAt: new Date(character.createdAt),
            updatedAt: new Date(character.updatedAt || character.createdAt)
          });
        } catch (fileError) {
          console.error(`Error loading character from ${file}:`, fileError);
        }
      }
      console.log(`Loaded ${characters.length} characters from JSON files`);
      return characters;
    } catch (error) {
      console.error('Error loading characters from files:', error);
      return [];
    }
  }

  async getSelectedCharacter(userId: string): Promise<Character | undefined> {
    const characters = await this.getAllCharacters();
    return characters[0];
  }

  async createCharacter(character: InsertCharacter): Promise<Character> {
    const { data, error } = await this.supabase.from('characters').insert(character).select().single();
    if (error) throw error;
    return data;
  }

  async updateCharacter(id: string, updates: Partial<Character>): Promise<Character | undefined> {
    const { data, error } = await this.supabase.from('characters').update(updates).eq('id', id).select().maybeSingle();
    if (error && error.code !== 'PGRST116') {
      console.error('Error updating character:', error);
      return undefined;
    }
    return data || undefined;
  }

  async deleteCharacter(id: string): Promise<void> {
    const { error } = await this.supabase.from('characters').delete().eq('id', id);
    if (error) throw error;
  }

  async selectCharacter(userId: string, characterId: string): Promise<void> {
    console.log(`User ${userId} selected character ${characterId}`);
  }

  // 🎯🔥💥 UPGRADE MANAGEMENT - NOW USES FILESTORAGE! BASECOST NIGHTMARE DEAD!
  async getUpgrade(id: string): Promise<Upgrade | undefined> {
    console.log('🎯 [SupabaseStorage] getUpgrade() -> FileStorage (JSON-first!)');
    return await this.fileStorage.getUpgrade(id);
  }

  async getUserUpgrades(userId: string): Promise<Upgrade[]> {
    // User progress still comes from database
    const { data, error } = await this.supabase
      .from('userUpgrades').select('upgrades (*)').eq('userId', userId);
    if (error) {
      console.error('Error fetching user upgrades:', error);
      return [];
    }
    const upgrades = (data?.map((item: any) => item.upgrades) || []).filter(Boolean) as Upgrade[];
    return upgrades.map(normalizeFromDb);
  }

  // 🎯 THE BIG WIN - ALL UPGRADES FROM JSON!
  async getAllUpgrades(): Promise<Upgrade[]> {
    console.log('🎯 [SupabaseStorage] getAllUpgrades() -> FileStorage (JSON-first!)');
    return await this.fileStorage.getAllUpgrades();
  }

  async createUpgrade(upgrade: InsertUpgrade): Promise<Upgrade> {
    console.log('🎯 [SupabaseStorage] createUpgrade() -> FileStorage (JSON-first!)');
    return await this.fileStorage.createUpgrade(upgrade);
  }

  async updateUpgrade(id: string, updates: Partial<Upgrade>): Promise<Upgrade | undefined> {
    console.log('🎯 [SupabaseStorage] updateUpgrade() -> FileStorage (JSON-first!)');
    return await this.fileStorage.updateUpgrade(id, updates);
  }

  async deleteUpgrade(id: string): Promise<void> {
    console.log('🎯 [SupabaseStorage] deleteUpgrade() -> FileStorage (JSON-first!)');
    const success = await this.fileStorage.deleteUpgrade(id);
    if (!success) {
      throw new Error(`Failed to delete upgrade ${id}`);
    }
  }

  // Admin upgrades method - NOW PURE JSON!
  async getUpgrades(): Promise<Upgrade[]> {
    console.log('🎯 [SupabaseStorage] getUpgrades() -> FileStorage (JSON-first!)');
    return await this.fileStorage.getAllUpgrades();
  }

  // 🎯🔥💥 ACHIEVEMENTS - NOW USES FILESTORAGE TOO!
  async getAchievements(): Promise<any[]> {
    console.log('🎯 [SupabaseStorage] getAchievements() -> FileStorage (JSON-first!)');
    return await this.fileStorage.getAllAchievements();
  }

  async createAchievement(achievement: any): Promise<any> {
    console.log('🎯 [SupabaseStorage] createAchievement() -> FileStorage (JSON-first!)');
    return await this.fileStorage.createAchievement(achievement);
  }

  async updateAchievement(id: string, updates: any): Promise<any> {
    console.log('🎯 [SupabaseStorage] updateAchievement() -> FileStorage (JSON-first!)');
    return await this.fileStorage.updateAchievement(id, updates);
  }

  async deleteAchievement(id: string): Promise<void> {
    console.log('🎯 [SupabaseStorage] deleteAchievement() -> FileStorage (JSON-first!)');
    const success = await this.fileStorage.deleteAchievement(id);
    if (!success) {
      throw new Error(`Failed to delete achievement ${id}`);
    }
  }

  // USER PROGRESS UPGRADES (still database for user-specific data)
  async upgradeUserUpgrade(userId: string, upgradeId: string): Promise<Upgrade> {
    const { data, error } = await this.supabase.rpc('increment_userUpgrade', {
      p_userId: userId,
      p_upgradeId: upgradeId
    });
    if (error) throw error;
    return normalizeFromDb(data);
  }

  // Game stats (UNCHANGED - uses database)
  async getUserStats(userId: string): Promise<GameStats> {
    try {
      let realUserId = userId;
      if (userId.startsWith('telegram_')) {
        const telegramId = userId.replace('telegram_', '');
        const { data: user } = await this.supabase
          .from('users').select('id').eq('telegramId', telegramId).maybeSingle();
        if (user?.id) {
          realUserId = user.id;
        } else {
          return { userId, totalTaps: 0, totalLpEarned: 0, totalEnergyUsed: 0, sessionsPlayed: 1 } as GameStats;
        }
      }
      const { data, error } = await this.supabase.from('users').select('*').eq('id', realUserId).maybeSingle();
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user stats:', error);
        throw error;
      }
      if (!data) {
        const defaultStats = { userId: realUserId, totalTaps: 0, totalLpEarned: 0, totalEnergyUsed: 0, sessionsPlayed: 0 };
        const { data: newData, error: createError } = await this.supabase.from('users').insert(defaultStats).select().single();
        if (createError) {
          console.error('Error creating user stats:', createError);
          return { userId, totalTaps: 0, totalLpEarned: 0, totalEnergyUsed: 0, sessionsPlayed: 0 } as GameStats;
        }
        return newData;
      }
      return data;
    } catch (error) {
      console.error('getUserStats error:', error);
      return { userId, totalTaps: 0, totalLpEarned: 0, totalEnergyUsed: 0, sessionsPlayed: 0 } as GameStats;
    }
  }

  async updateUserStats(userId: string, updates: Partial<GameStats>): Promise<void> {
    console.log('📊 User stats update skipped - table removed during cleanup');
  }

  // Chat system (UNCHANGED - uses database)
  async getChatMessages(userId: string, characterId?: string): Promise<ChatMessage[]> {
    let query = this.supabase.from('chatMessages').select('*').eq('userId', userId).order('createdAt', { ascending: true });
    if (characterId) query = query.eq('characterId', characterId);
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching chat messages:', error);
      return [];
    }
    return data || [];
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const { data, error } = await this.supabase.from('chatMessages').insert(message).select().single();
    if (error) throw error;
    return data;
  }

  async clearChatHistory(userId: string, characterId?: string): Promise<void> {
    let query = this.supabase.from('chatMessages').delete().eq('userId', userId);
    if (characterId) query = query.eq('characterId', characterId);
    const { error } = await query;
    if (error) throw error;
  }

  // Wheel system (UNCHANGED - uses database)
  async getLastWheelSpin(userId: string): Promise<Date | null> {
    const { data, error } = await this.supabase
      .from('wheelRewards').select('spunAt').eq('userId', userId).order('spunAt', { ascending: false }).limit(1).maybeSingle();
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching last wheel spin:', error);
      return null;
    }
    return data ? new Date(data.spunAt) : null;
  }

  async recordWheelSpin(userId: string, reward: string): Promise<void> {
    const { error } = await this.supabase.from('wheelRewards').insert({ userId, reward, amount: 1 });
    if (error) throw error;
  }

  // Admin/Settings (UNCHANGED)
  async getGameSettings(): Promise<GameSettings> {
    return {
      id: "default", nsfwEnabled: false, vipEnabled: false, eventEnabled: false,
      autoSave: true, soundEnabled: true, notifications: true
    };
  }

  async updateGameSettings(settings: Partial<GameSettings>): Promise<void> {
    console.log('Updating game settings:', settings);
  }

  async getSystemStats(): Promise<any> {
    const { data: userCount } = await this.supabase.from('users').select('id', { count: 'exact', head: true });
    const { data: characterCount } = await this.supabase.from('characters').select('id', { count: 'exact', head: true });
    const fileStats = this.fileStorage.getCacheStats();
    
    return { 
      totalUsers: userCount?.length || 0, 
      totalCharacters: characterCount?.length || 0, 
      gameDataFiles: fileStats.files,
      gameDataItems: fileStats.totalItems,
      lastUpdated: new Date().toISOString() 
    };
  }

  async exportAllData(): Promise<any> {
    const [users, characters, messages] = await Promise.all([
      this.supabase.from('users').select('*'),
      this.supabase.from('characters').select('*'),
      this.supabase.from('chatMessages').select('*')
    ]);
    
    // 🎯 Include FileStorage data in exports!
    const gameData = await this.fileStorage.exportAllData();
    
    return { 
      users: users.data || [], 
      characters: characters.data || [], 
      messages: messages.data || [], 
      gameData, // 🎯 JSON-first game content!
      exportedAt: new Date().toISOString() 
    };
  }

  // Media management (UNCHANGED - uses database)
  async getAllMedia(): Promise<MediaFile[]> {
    const { data, error } = await this.supabase.from('mediaFiles').select('*');
    if (error) {
      console.error('Error fetching all media:', error);
      return [];
    }
    return data || [];
  }

  async getMediaFiles(characterId?: string): Promise<MediaFile[]> {
    let query = this.supabase.from('mediaFiles').select('*');
    if (characterId) query = query.eq('characterId', characterId);
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching media files:', error);
      return [];
    }
    return data || [];
  }

  async getMediaByCharacter(characterId: string): Promise<MediaFile[]> {
    return this.getMediaFiles(characterId);
  }

  async saveMediaFile(file: MediaFile): Promise<MediaFile> {
    const { data, error } = await this.supabase.from('mediaFiles').insert(file).select().single();
    if (error) throw error;
    return data;
  }

  async updateMediaFile(id: string, updates: Partial<MediaFile>): Promise<MediaFile | undefined> {
    const { data, error } = await this.supabase.from('mediaFiles').update(updates).eq('id', id).select().maybeSingle();
    if (error && error.code !== 'PGRST116') {
      console.error('Error updating media file:', error);
      return undefined;
    }
    return data || undefined;
  }

  async uploadMedia(file: any): Promise<MediaFile> {
    const mediaFile: MediaFile = {
      characterId: file.characterId, fileName: file.fileName, filePath: file.url, fileType: file.type,
      mood: file.mood, pose: file.pose, animationSequence: file.animationSequence,
      isNsfw: file.isNsfw || false, isVip: file.isVip || false, isEvent: file.isEvent || false,
      randomSendChance: file.randomSendChance, requiredLevel: file.requiredLevel,
      enabledForChat: file.enabledForChat, category: file.category,
      autoOrganized: file.autoOrganized, createdAt: file.createdAt
    };
    return this.saveMediaFile(mediaFile);
  }

  async deleteMediaFile(id: string): Promise<void> {
    const { error } = await this.supabase.from('mediaFiles').delete().eq('id', id);
    if (error) throw error;
  }

  async createMedia(file: MediaFile): Promise<MediaFile> {
    return this.saveMediaFile(file);
  }

  async updateMedia(id: string, updates: Partial<MediaFile>): Promise<MediaFile | undefined> {
    const { data, error } = await this.supabase.from('mediaFiles').update(updates).eq('id', id).select().maybeSingle();
    if (error && error.code !== 'PGRST116') {
      console.error('Error updating media:', error);
      return undefined;
    }
    return data || undefined;
  }

  async deleteMedia(id: string): Promise<void> {
    return this.deleteMediaFile(id);
  }

  async bulkDeleteMediaFiles(ids: string[]): Promise<{ deletedCount: number; errors: string[] }> {
    const results = { deletedCount: 0, errors: [] as string[] };
    for (const id of ids) {
      try {
        await this.deleteMediaFile(id);
        results.deletedCount++;
      } catch (error) {
        results.errors.push(`Failed to delete ${id}: ${error}`);
      }
    }
    return results;
  }

  async getOrphanedMediaFiles(): Promise<MediaFile[]> {
    const { data, error } = await this.supabase.from('mediaFiles').select('*').or('fileName.is.null,filePath.is.null,characterId.is.null');
    if (error) {
      console.error('Error finding orphaned media files:', error);
      return [];
    }
    return data || [];
  }

  async getDuplicateMediaFiles(): Promise<{ duplicates: MediaFile[]; groups: { [key: string]: MediaFile[] } }> {
    const allFiles = await this.getAllMedia();
    const fileNameGroups: { [key: string]: MediaFile[] } = {};
    const duplicates: MediaFile[] = [];
    allFiles.forEach(file => {
      if (file.fileName) {
        if (!fileNameGroups[file.fileName]) fileNameGroups[file.fileName] = [];
        fileNameGroups[file.fileName].push(file);
      }
    });
    Object.keys(fileNameGroups).forEach(fileName => {
      if (fileNameGroups[fileName].length > 1) {
        duplicates.push(...fileNameGroups[fileName]);
      }
    });
    return { duplicates, groups: fileNameGroups };
  }

  async getMediaFileStats(): Promise<{total: number; orphaned: number; duplicates: number; withoutCharacter: number; withoutFileName: number;}> {
    const allFiles = await this.getAllMedia();
    const orphanedFiles = await this.getOrphanedMediaFiles();
    const { duplicates } = await this.getDuplicateMediaFiles();
    const withoutCharacter = allFiles.filter(f => !f.characterId).length;
    const withoutFileName = allFiles.filter(f => !f.fileName).length;
    return { total: allFiles.length, orphaned: orphanedFiles.length, duplicates: duplicates.length, withoutCharacter, withoutFileName };
  }

  // Level requirements (TODO: Move to FileStorage in future)
  async getLevelRequirements(): Promise<any[]> {
    const { data, error } = await this.supabase.from('levelRequirements').select('*').order('level');
    if (error) {
      console.error('Error fetching level requirements:', error);
      return [];
    }
    return data || [];
  }

  async createLevelRequirement(levelReq: any): Promise<any> {
    const { data, error } = await this.supabase.from('levelRequirements').insert(levelReq).select().single();
    if (error) throw new Error(`Failed to create level requirement: ${error.message}`);
    return data;
  }

  async updateLevelRequirement(id: string, updates: any): Promise<any> {
    const { data, error } = await this.supabase.from('levelRequirements').update(updates).eq('id', id).select().maybeSingle();
    if (error && error.code !== 'PGRST116') throw new Error(`Failed to update level requirement: ${error.message}`);
    return data;
  }

  async deleteLevelRequirement(id: string): Promise<void> {
    const { error } = await this.supabase.from('levelRequirements').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete level requirement: ${error.message}`);
  }

  async setSelectedCharacter(userId: string, characterId: string): Promise<void> {
    await this.selectCharacter(userId, characterId);
  }

  // 🎯 DEBUGGING HELPERS
  getFileStorageStats(): any {
    return this.fileStorage.getCacheStats();
  }

  clearFileStorageCache(): void {
    this.fileStorage.clearCache();
  }
}