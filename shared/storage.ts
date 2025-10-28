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
  type WheelReward,
  type UserCharacter
} from "@shared/schema";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Character management
  getCharacter(id: string): Promise<Character | undefined>;
  getUserCharacters(userId: string): Promise<Character[]>;
  getAllCharacters(): Promise<Character[]>;
  getSelectedCharacter(userId: string): Promise<Character | undefined>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  updateCharacter(id: string, updates: Partial<Character>): Promise<Character | undefined>;
  deleteCharacter(id: string): Promise<void>;
  selectCharacter(userId: string, characterId: string): Promise<void>;

  // Upgrade management
  getUpgrade(id: string): Promise<Upgrade | undefined>;
  getUserUpgrades(userId: string): Promise<Upgrade[]>;
  getAllUpgrades(): Promise<Upgrade[]>;
  createUpgrade(upgrade: InsertUpgrade): Promise<Upgrade>;
  updateUpgrade(id: string, updates: Partial<Upgrade>): Promise<Upgrade | undefined>;

  // Game stats
  getUserStats(userId: string): Promise<GameStats>;
  updateUserStats(userId: string, updates: Partial<GameStats>): Promise<void>;

  // Upgrade system
  upgradeUserUpgrade(userId: string, upgradeId: string): Promise<Upgrade>;
  deleteUpgrade(id: string): Promise<void>;

  // Chat system
  getChatMessages(userId: string, characterId?: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  clearChatHistory(userId: string, characterId?: string): Promise<void>;

  // Wheel system
  getLastWheelSpin(userId: string): Promise<Date | null>;
  recordWheelSpin(userId: string, reward: string): Promise<void>;

  // Admin/Settings
  getGameSettings(): Promise<any>;
  updateGameSettings(settings: Partial<any>): Promise<void>;
  getSystemStats(): Promise<any>;
  exportAllData(): Promise<any>;

  // Media management
  getAllMedia(): Promise<MediaFile[]>;
  getMediaFiles(characterId?: string): Promise<MediaFile[]>;
  getMediaFile(id: string): Promise<MediaFile | undefined>;
  saveMediaFile(file: MediaFile): Promise<MediaFile>;
  uploadMedia(file: any): Promise<MediaFile>;
  updateMediaFile(id: string, updates: Partial<MediaFile>): Promise<MediaFile | undefined>;
  deleteMediaFile(id: string): Promise<void>;
}

// REMOVED: All PostgreSQL DrizzleStorage implementation per user requirement
// Using SUPABASE ONLY - All storage operations handled by SupabaseStorage in shared/SupabaseStorage.ts
// Routes import: SupabaseStorage.getInstance() for all database operations