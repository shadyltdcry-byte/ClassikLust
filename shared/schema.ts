import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, real, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  telegramId: text("telegramId").unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  level: integer("level").notNull().default(1),
  lp: real("lp").notNull().default(0), // Changed to real to support decimals like 1.5
  energy: integer("energy").notNull().default(1000),
  maxEnergy: integer("maxEnergy").notNull().default(1000),
  charisma: integer("charisma").notNull().default(0),
  lpPerHour: integer("lpPerHour").notNull().default(10),
  lpPerTap: real("lpPerTap").notNull().default(1.0),
  vipStatus: boolean("vipStatus").notNull().default(false),
  nsfwConsent: boolean("nsfwConsent").notNull().default(false),
  isEvent: boolean("isEvent").notNull().default(false),
  lastTick: timestamp("lastTick").notNull().default(sql`now()`),
  lastWheelSpin: timestamp("lastWheelSpin"),
  createdAt: timestamp("createdAt").notNull().default(sql`now()`),
});

export const characters = pgTable("characters", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  personality: text("personality").notNull(),
  bio: text("bio"), // For players to see
  description: text("description"), // For AI system prompts with variables like {characterName}, {mood}
  backstory: text("backstory"),
  mood: text("mood").notNull().default("neutral"),
  isNsfw: boolean("isNsfw").notNull().default(false),
  isVip: boolean("isVip").notNull().default(false),
  isEvent: boolean("isEvent").notNull().default(false),
  levelRequirement: integer("levelRequirement").notNull().default(1),
  isEnabled: boolean("isEnabled").notNull().default(true),
  customTriggers: jsonb("customTriggers").default(sql`'[]'::jsonb`),
  avatarPath: text("avatarPath"),
  imageUrl: text("imageUrl"),
  avatarUrl: text("avatarUrl"),
  chatStyle: text("chatStyle").default("casual"),
  likes: text("likes"),
  dislikes: text("dislikes"),
  responseTimeMin: integer("responseTimeMin").default(1),
  responseTimeMax: integer("responseTimeMax").default(3),
  createdAt: timestamp("createdAt").notNull().default(sql`now()`),
});

export const userCharacters = pgTable("userCharacters", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  characterId: uuid("characterId").notNull().references(() => characters.id, { onDelete: "cascade" }),
  charismaPoints: integer("charismaPoints").notNull().default(0),
  affection: integer("affection").notNull().default(0),
  bondLevel: integer("bondLevel").notNull().default(1),
  unlockedAt: timestamp("unlockedAt").notNull().default(sql`now()`),
});

export const mediaFiles = pgTable("mediaFiles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  characterId: uuid("characterId").references(() => characters.id, { onDelete: "cascade" }),
  fileName: text("fileName").notNull(),
  filePath: text("filePath").notNull(),
  fileType: text("fileType").notNull(), // image, video, gif
  mood: text("mood"),
  pose: text("pose"),
  animationSequence: integer("animationSequence"),
  isNsfw: boolean("isNsfw").notNull().default(false),
  isVip: boolean("isVip").notNull().default(false),
  isEvent: boolean("isEvent").notNull().default(false),
  randomSendChance: integer("randomSendChance").notNull().default(5),
  requiredLevel: integer("requiredLevel").notNull().default(1),
  category: text("category").default("Character"), // Character, Avatar, Misc, Event, Other
  enabledForChat: boolean("enabledForChat").notNull().default(true), // Toggle for AI chat usage
  autoOrganized: boolean("autoOrganized").notNull().default(false), // Track if file is auto-organized
  createdAt: timestamp("createdAt").notNull().default(sql`now()`),
});

export const upgrades = pgTable("upgrades", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // lpPerHour, energy, lpPerTap
  baseCost: integer("baseCost").notNull(),
  baseEffect: real("baseEffect").notNull(),
  costMultiplier: real("costMultiplier").notNull().default(1.3),
  effectMultiplier: real("effectMultiplier").notNull().default(1.15),
  maxLevel: integer("maxLevel"),
  levelRequirement: integer("levelRequirement").notNull().default(1),
});

// 🎯 CRITICAL CHANGE: upgradeId is now TEXT to support JSON string IDs!
export const userUpgrades = pgTable("userUpgrades", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  // 🔥 PURGED UUID FK - now supports "mega-tap" string IDs from JSON!
  upgradeId: text("upgradeId").notNull(), // No FK constraint = no UUID validation!
  level: integer("level").notNull().default(0),
  purchasedAt: timestamp("purchasedAt").notNull().default(sql`now()`),
});

export const boosters = pgTable("boosters", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // lp_multiplier, energy_regen, etc.
  multiplier: real("multiplier").notNull(),
  duration: integer("duration").notNull(), // in minutes
  activatedAt: timestamp("activateAt").notNull().default(sql`now()`),
  expiresAt: timestamp("expiresAt").notNull(),
});

export const wheelRewards = pgTable("wheelRewards", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  reward: text("reward").notNull(),
  amount: integer("amount").notNull(),
  spunAt: timestamp("spunAt").notNull().default(sql`now()`),
});

export const gameStats = pgTable("gameStats", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  totalTaps: integer("totalTaps").notNull().default(0),
  totalLpEarned: integer("totalLpEarned").notNull().default(0),
  totalEnergyUsed: integer("totalEnergyUsed").notNull().default(0),
  sessionsPlayed: integer("sessionPlayed").notNull().default(0),
  lastUpdated: timestamp("lastUpdated").notNull().default(sql`now()`),
});

export const chatMessages = pgTable("chatMessages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  characterId: uuid("characterId").notNull().references(() => characters.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  response: text("response"),
  charismaGained: integer("charismaGained").notNull().default(0),
  createdAt: timestamp("createdAt").notNull().default(sql`now()`),
});

export const bonuses = pgTable("bonuses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // level_up, achievement, wheel, ai_gift
  source: text("source").notNull(),
  reward: text("reward").notNull(),
  amount: integer("amount").notNull(),
  claimedAt: timestamp("claimedAt").notNull().default(sql`now()`),
});

export const levelRequirements = pgTable("levelRequirements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  level: integer("level").notNull().unique(),
  lpRequired: integer("lpRequired").notNull(),
  description: text("description"),
  unlockRewards: jsonb("unlockRewards").default(sql`'[]'::jsonb`), // Array of rewards {type, amount}
  functions: jsonb("functions").default(sql`'[]'::jsonb`), // Multiple functions for level
  upgradeRequirements: jsonb("upgradeRequirements").default(sql`'[]'::jsonb`), // Array of {upgradeId, requiredLevel}
  createdAt: timestamp("createAt").notNull().default(sql`now()`),
});

export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // tapping, chatting, progression, special
  baseRequirement: jsonb("baseRequirement").notNull(), // {type: "total_taps", baseTarget: 10, multiplier: 2}
  levels: jsonb("levels").notNull().default(sql`'[]'::jsonb`), // [{level: 1, target: 10, reward: {type: "lp", amount: 100}}, {level: 2, target: 20, reward: {type: "lp", amount: 200}}]
  maxLevel: integer("maxLevel").notNull().default(30),
  icon: text("icon"),
  isHidden: boolean("isHidden").notNull().default(false),
  isEnabled: boolean("isEnabled").notNull().default(true),
  sortOrder: integer("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").notNull().default(sql`now()`),
});

export const userAchievements = pgTable("userAchievements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievementId: uuid("achievementId").notNull().references(() => achievements.id, { onDelete: "cascade" }),
  currentLevel: integer("currentLevel").notNull().default(1),
  progress: integer("progress").notNull().default(0),
  completed: boolean("completed").notNull().default(false), // True when max level reached
  lastClaimedLevel: integer("lastClaimedLevel").notNull().default(0),
  completedAt: timestamp("completedAt"),
  updatedAt: timestamp("updatedAt").notNull().default(sql`now()`),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userCharacters: many(userCharacters),
  userUpgrades: many(userUpgrades),
  boosters: many(boosters),
  wheelRewards: many(wheelRewards),
  gameStats: many(gameStats),
  chatMessages: many(chatMessages),
  bonuses: many(bonuses),
}));

export const charactersRelations = relations(characters, ({ many }) => ({
  userCharacters: many(userCharacters),
  mediaFiles: many(mediaFiles),
  chatMessages: many(chatMessages),
}));

export const userCharactersRelations = relations(userCharacters, ({ one }) => ({
  user: one(users, { fields: [userCharacters.userId], references: [users.id] }),
  character: one(characters, { fields: [userCharacters.characterId], references: [characters.id] }),
}));

export const mediaFilesRelations = relations(mediaFiles, ({ one }) => ({
  character: one(characters, { fields: [mediaFiles.characterId], references: [characters.id] }),
}));

export const upgradesRelations = relations(upgrades, ({ many }) => ({
  userUpgrades: many(userUpgrades),
}));

// 🎯 PURGED FK RELATION - userUpgrades no longer tied to upgrades table!
export const userUpgradesRelations = relations(userUpgrades, ({ one }) => ({
  user: one(users, { fields: [userUpgrades.userId], references: [users.id] }),
  // 💀 MURDERED: upgrade: one(upgrades, { fields: [userUpgrades.upgradeId], references: [upgrades.id] })
  // Now upgradeId can be any string! "mega-tap", "super-boost", etc.
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, { fields: [userAchievements.userId], references: [users.id] }),
  achievement: one(achievements, { fields: [userAchievements.achievementId], references: [achievements.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastTick: true,
});

export const insertCharacterSchema = createInsertSchema(characters).omit({
  id: true,
  createdAt: true,
});

export const insertUserCharacterSchema = createInsertSchema(userCharacters).omit({
  id: true,
  unlockedAt: true,
});

export const insertMediaFileSchema = createInsertSchema(mediaFiles).omit({
  id: true,
  createdAt: true,
});

export const insertUpgradeSchema = createInsertSchema(upgrades).omit({
  id: true,
});

export const insertUserUpgradeSchema = createInsertSchema(userUpgrades).omit({
  id: true,
  purchasedAt: true,
});

export const insertBoosterSchema = createInsertSchema(boosters).omit({
  id: true,
  activatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertLevelRequirementSchema = createInsertSchema(levelRequirements).omit({
  id: true,
  createdAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
});

// Temporary auth tokens table for Telegram authentication
export const telegramAuthTokens = pgTable("telegramAuthTokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  telegramId: varchar("telegramId").notNull(),
  username: varchar("username"),
  token: varchar("token").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("createdAt").defaultNow(),
});

// 🚀 FileStorage JSON-First Types (not in database - pure JSON!)

// Task type for JSON-first task management
export interface Task {
  id: string;
  title: string;
  description: string;
  category: 'daily' | 'weekly' | 'event';
  requirements: {
    type: 'tap_count' | 'lp_earned' | 'energy_spent' | 'character_interaction' | 'login_streak';
    target: number;
    characterId?: string; // Optional for character-specific tasks
  };
  rewards: {
    type: 'lp' | 'energy' | 'charisma' | 'booster';
    amount: number;
  }[];
  resetSchedule?: {
    hour: number; // 0-23 UTC hour
    dayOfWeek?: number; // 0-6 for weekly tasks (0 = Sunday)
  };
  isActive: boolean;
  levelRequirement: number;
  createdAt: Date;
  updatedAt: Date;
}

// GameSettings type for JSON-first settings management
export interface GameSettings {
  id: string;
  maxEnergy: number;
  energyRegenRate: number; // Energy per second
  tapCooldown: number; // Seconds between taps
  maxLevel: number;
  baseExperienceRequired: number;
  experienceMultiplier: number; // Multiplier for each level
  autoSaveInterval: number; // Milliseconds
  wheelSpinCooldown?: number; // Hours between wheel spins
  dailyBonusHour?: number; // UTC hour for daily reset
  characterUnlockLevels?: { characterId: string; levelRequired: number }[];
  boosterEffects?: {
    [key: string]: {
      multiplier: number;
      maxDuration: number; // Minutes
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Character = typeof characters.$inferSelect;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type UserCharacter = typeof userCharacters.$inferSelect;
export type InsertUserCharacter = z.infer<typeof insertUserCharacterSchema>;
export type MediaFile = typeof mediaFiles.$inferSelect;
export type InsertMediaFile = z.infer<typeof insertMediaFileSchema>;
export type Upgrade = typeof upgrades.$inferSelect;
export type InsertUpgrade = z.infer<typeof insertUpgradeSchema>;
export type UserUpgrade = typeof userUpgrades.$inferSelect;
export type InsertUserUpgrade = z.infer<typeof insertUserUpgradeSchema>;
export type Booster = typeof boosters.$inferSelect;
export type InsertBooster = z.infer<typeof insertBoosterSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type GameStats = typeof gameStats.$inferSelect;
export type WheelReward = typeof wheelRewards.$inferSelect;
export type Bonus = typeof bonuses.$inferSelect;
export type TelegramAuthToken = typeof telegramAuthTokens.$inferSelect;
export type InsertTelegramAuthToken = typeof telegramAuthTokens.$inferInsert;
export type LevelRequirement = typeof levelRequirements.$inferSelect;
export type InsertLevelRequirement = z.infer<typeof insertLevelRequirementSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;