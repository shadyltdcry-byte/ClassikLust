/**
 * schema.ts - Updated schema definitions
 * Last Edited: 2025-08-18 by Assistant
 */

// Media File Interfaces
export interface MediaFile {
  id: string;
  url: string;
  path?: string;
  fileName?: string;
  originalName?: string;
  type: 'image' | 'video' | 'gif';
  characterid?: string;
  mood?: string;
  level?: number;
  isVip?: boolean;
  isNsfw?: boolean;
  isEvent?: boolean;
  animationSequence?: number[];
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface MediaFileDB extends MediaFile {
  // DB-specific fields can be added here
}

// Character Schema - Fixed to match what's being used
export interface Character {
  id: string;
  name: string;
  bio?: string;
  description?: string;
  backstory?: string;
  interests?: string;
  quirks?: string;
  imageUrl?: string;
  avatarUrl?: string;
  personality: string;
  personalityStyle: string;
  chatStyle: string;
  likes?: string;
  dislikes?: string;
  levelRequirement: number;
  level: number;
  responseTimeMin: number;
  responseTimeMax: number;
  responseTimeMs: number;
  pictureSendChance?: number; // Used in CharacterCreation
  chatSendChance?: number;    // Used in CharacterEditor
  isNsfw: boolean;
  isVip: boolean;
  isEvent?: boolean;
  isWheelReward?: boolean;
  randomPictureSending?: boolean;        // Used in CharacterCreation
  randomChatResponsesEnabled?: boolean;  // Used in CharacterEditor
  moodDistribution?: {
    normal: number;
    happy: number;
    flirty: number;
    playful: number;
    mysterious: number;
    shy: number;
  };
  customTriggerWords?: string[] | Array<{word: string, response: string}>;
  customGreetings?: string[];
  customResponses?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Zod schema for validation (this should match your shared schema)
import { z } from "zod";

export const insertCharacterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  bio: z.string().optional(),
  description: z.string().optional(),
  backstory: z.string().optional(),
  interests: z.string().optional(),
  quirks: z.string().optional(),
  imageUrl: z.string().optional(),
  avatarUrl: z.string().optional(),
  personality: z.string().default("friendly"),
  personalityStyle: z.string().default("Sweet & Caring"),
  chatStyle: z.string().default("casual"),
  likes: z.string().optional(),
  dislikes: z.string().optional(),
  requiredLevel: z.number().min(1).default(1),
  level: z.number().min(1).default(1),
  responseTimeMin: z.number().min(1).default(1),
  responseTimeMax: z.number().min(1).default(3),
  responseTimeMs: z.number().min(1000).default(2000),
  pictureSendChance: z.number().min(0).max(100).default(5),
  chatSendChance: z.number().min(0).max(100).default(5),
  isNsfw: z.boolean().default(false),
  isVip: z.boolean().default(false),
  isEvent: z.boolean().default(false),
  isWheelReward: z.boolean().default(false),
  randomPictureSending: z.boolean().default(false),
  randomChatResponsesEnabled: z.boolean().default(false),
});

// Player/User related schemas
export interface PlayerUpgradesSchema {
  lpPerHour: Record<string, number>;
  energy: Record<string, number>;
  lpPerTap: Record<string, number>;
}

export interface LevelRequirementSchema {
  level: number;
  requirements: {
    upgradeType: 'lpPerHour' | 'energy' | 'lpPerTap';
    upgradeName?: string;
    levelRequirement: number;
  }[];
}

export interface PlayerSchema {
  id: string;
  name: string;
  currentLevel: number;
  experiencePoints: number;
  upgrades: PlayerUpgradesSchema;
}