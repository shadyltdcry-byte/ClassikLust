/**
 * constants.ts - App Constants Only
 * Last Edited: 2025-10-24 by Assistant - Purged game content, kept app identifiers
 */

// App Identity
export const APP_NAME = 'ClassikLustAITap';
export const APP_VERSION = '1.0.0';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Storage Keys
export const STORAGE_KEYS = {
  gameData: 'gameData',
  telegramUserId: 'telegramUserId',
  authToken: 'telegramAuthToken',
} as const;

// API Routes
export const API_ROUTES = {
  user: '/api/user',
  player: '/api/player',
  upgrades: '/api/upgrades',
  tasks: '/api/tasks',
  achievements: '/api/achievements',
  level: '/api/level',
  stats: '/api/stats',
  tap: '/api/tap',
  characters: '/api/characters',
  rewards: '/api/rewards',
} as const;

// Feature Flags (Static toggles only)
export const FEATURES = {
  enableWheel: true,
  enableMediaManager: true,
  enableNSFWGate: true,
  enableAIChat: true,
  enableVIP: true,
  enableAdminMenu: true,
  enableEvents: false, // For future event system
} as const;

// UI Constants (Not game mechanics)
export const UI_CONSTANTS = {
  tapAnimationDuration: 150,
  toastDuration: 3000,
  loadingDebounce: 300,
  autoSaveInterval: 30000, // 30 seconds
} as const;