/**
 * helpers.ts - Shared Utilities for Character Tap Game
 * Last Edited: 2025-08-28 by Assistant
 * 
 * Centralized helper functions, UUID validation, and mock data generators
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// UUID validation function
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Telegram ID validation function
export function isValidTelegramId(id: string): boolean {
  const telegramRegex = /^telegram_\d+$/;
  return telegramRegex.test(id);
}

// Combined user ID validation (UUID or Telegram format)
export function isValidUserId(id: string): boolean {
  return isValidUUID(id) || isValidTelegramId(id);
}

// Mock ID generator removed - no mock data allowed

// Mock user data generator removed - no mock data allowed

// Mock stats generator removed - no mock data allowed

// Telegram authentication verification
export function verifyTelegramAuth(data: any, botToken: string): boolean {
  const { hash, ...authData } = data;

  // Create data-check-string
  const dataCheckString = Object.keys(authData)
    .sort()
    .map(key => `${key}=${authData[key]}`)
    .join('\n');

  // Create secret key
  const secretKey = crypto.createHash('sha256').update(botToken).digest();

  // Calculate expected hash
  const expectedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  return hash === expectedHash;
}

// JWT token generation
export function generateJWT(userId: string): string {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
}

// Safe number parsing for LP values (supports decimals)
export function parseLP(value: any): number {
  return parseFloat(String(value)) || 0;
}

// Calculate LP per tap with multipliers
export function calculateLPPerTap(baseLpPerTap: number, multipliers: number[] = []): number {
  let totalLp = baseLpPerTap;
  multipliers.forEach(multiplier => {
    totalLp *= multiplier;
  });
  return totalLp;
}

// Energy calculations
export function calculateEnergyRegen(maxEnergy: number, regenRate: number = 0.2): number {
  return Math.max(1, Math.floor(maxEnergy * regenRate));
}

// Time-based calculations
export function calculateOfflineLP(lpPerHour: number, offlineMinutes: number, maxOfflineHours: number = 2): number {
  const maxMinutes = maxOfflineHours * 60;
  const actualMinutes = Math.min(offlineMinutes, maxMinutes);
  return Math.floor((actualMinutes / 60) * lpPerHour);
}

// Validation helpers
export function validateRequired(obj: any, requiredFields: string[]): string | null {
  for (const field of requiredFields) {
    if (!obj[field]) {
      return `${field} is required`;
    }
  }
  return null;
}

// Response helpers
export function createSuccessResponse(data: any, message?: string) {
  return {
    success: true,
    data,
    ...(message && { message })
  };
}

export function createErrorResponse(error: string, code?: number) {
  return {
    success: false,
    error,
    ...(code && { code })
  };
}

// File upload helpers
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function isValidMediaType(mimetype: string): boolean {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg', 
    'video/mp4', 'video/webm'
  ];
  return allowedTypes.includes(mimetype);
}

// Converts snake_case to camelCase
export function snakeToCamel(str: string) {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

// Recursively maps object keys from snake_case to camelCase
export function keysToCamel<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(v => keysToCamel(v)) as any;
  } else if (obj !== null && obj.constructor === Object) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [snakeToCamel(k), keysToCamel(v)])
    ) as T;
  }
  return obj;
}

// Character helpers
export function getDefaultCharacter() {
  return {
    id: "550e8400-e29b-41d4-a716-446655440002",
    name: "Luna",
    personality: "friendly",
    mood: "happy",
    isEnabled: true,
    nsfwEnabled: false,
    vipRequired: false,
    eventEnabled: false,
  };
}