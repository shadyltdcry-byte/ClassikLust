/**
 * utils.ts - Shared helper functions
 * Last Edited: 2025-08-17 by Steven
 */

export function formatPoints(points: number) {
  return points.toLocaleString();
}

export function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
// TODO: add more shared helpers (timers, AI response parsers, etc.)