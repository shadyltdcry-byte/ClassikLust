/**
 * CacheService.ts - Central TTL Cache with Segmentation
 * Last Edited: 2025-10-24 by Assistant - Centralized cache management
 */

export interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
  segment: string;
  key: string;
  createdAt: number;
}

export class CacheService {
  private static instance: CacheService;
  private cache = new Map<string, CacheEntry>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  
  private constructor() {}
  
  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * 🗃️ SET - Store value with TTL and segment
   */
  set<T>(segment: string, key: string, value: T, ttlMs?: number): void {
    const fullKey = `${segment}:${key}`;
    const expiresAt = Date.now() + (ttlMs || this.defaultTTL);
    
    const entry: CacheEntry<T> = {
      value,
      expiresAt,
      segment,
      key,
      createdAt: Date.now()
    };
    
    this.cache.set(fullKey, entry);
    
    // Optionally clean expired entries when setting new ones
    if (Math.random() < 0.1) { // 10% chance
      this.cleanExpired();
    }
  }

  /**
   * 🔍 GET - Retrieve value if not expired
   */
  get<T>(segment: string, key: string): T | null {
    const fullKey = `${segment}:${key}`;
    const entry = this.cache.get(fullKey);
    
    if (!entry) {
      return null;
    }
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(fullKey);
      return null;
    }
    
    return entry.value as T;
  }

  /**
   * 🗑️ DELETE - Remove specific key
   */
  delete(segment: string, key: string): boolean {
    const fullKey = `${segment}:${key}`;
    return this.cache.delete(fullKey);
  }

  /**
   * 🚀 HAS - Check if key exists and not expired
   */
  has(segment: string, key: string): boolean {
    return this.get(segment, key) !== null;
  }

  /**
   * 🧹 CLEAR SEGMENT - Remove all entries in a segment
   */
  clearSegment(segment: string): number {
    let cleared = 0;
    
    for (const [fullKey, entry] of this.cache.entries()) {
      if (entry.segment === segment) {
        this.cache.delete(fullKey);
        cleared++;
      }
    }
    
    return cleared;
  }

  /**
   * 🧹 CLEAR ALL - Remove all cache entries
   */
  clearAll(): number {
    const size = this.cache.size;
    this.cache.clear();
    return size;
  }

  /**
   * 🧹 CLEAN EXPIRED - Remove expired entries
   */
  cleanExpired(): number {
    let cleaned = 0;
    const now = Date.now();
    
    for (const [fullKey, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(fullKey);
        cleaned++;
      }
    }
    
    return cleaned;
  }

  /**
   * 📊 STATS - Get cache statistics
   */
  getStats(): {
    totalEntries: number;
    expiredEntries: number;
    segments: Record<string, number>;
    memoryUsage: string;
    oldestEntry?: Date;
    newestEntry?: Date;
  } {
    const now = Date.now();
    let expiredCount = 0;
    const segmentCounts: Record<string, number> = {};
    let oldestTime = Infinity;
    let newestTime = 0;
    
    for (const [_, entry] of this.cache.entries()) {
      // Count segments
      segmentCounts[entry.segment] = (segmentCounts[entry.segment] || 0) + 1;
      
      // Count expired
      if (now > entry.expiresAt) {
        expiredCount++;
      }
      
      // Track age
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
      }
      if (entry.createdAt > newestTime) {
        newestTime = entry.createdAt;
      }
    }
    
    // Estimate memory usage (rough)
    const memoryBytes = JSON.stringify([...this.cache.entries()]).length * 2; // UTF-16
    const memoryMB = Math.round(memoryBytes / 1024 / 1024 * 100) / 100;
    
    return {
      totalEntries: this.cache.size,
      expiredEntries: expiredCount,
      segments: segmentCounts,
      memoryUsage: `${memoryMB}MB`,
      oldestEntry: oldestTime !== Infinity ? new Date(oldestTime) : undefined,
      newestEntry: newestTime > 0 ? new Date(newestTime) : undefined
    };
  }

  /**
   * 🔍 LIST SEGMENT - Get all keys in a segment
   */
  listSegmentKeys(segment: string): string[] {
    const keys: string[] = [];
    
    for (const [_, entry] of this.cache.entries()) {
      if (entry.segment === segment && Date.now() <= entry.expiresAt) {
        keys.push(entry.key);
      }
    }
    
    return keys;
  }

  /**
   * 🔄 REFRESH - Update TTL for existing entry
   */
  refresh(segment: string, key: string, newTtlMs?: number): boolean {
    const fullKey = `${segment}:${key}`;
    const entry = this.cache.get(fullKey);
    
    if (!entry) {
      return false;
    }
    
    entry.expiresAt = Date.now() + (newTtlMs || this.defaultTTL);
    this.cache.set(fullKey, entry);
    return true;
  }

  /**
   * ⏰ START AUTO-CLEANUP - Periodic expired entry removal
   */
  startAutoCleanup(intervalMs: number = 2 * 60 * 1000): NodeJS.Timeout {
    return setInterval(() => {
      const cleaned = this.cleanExpired();
      if (cleaned > 0) {
        console.log(`🧹 [CACHE] Auto-cleaned ${cleaned} expired entries`);
      }
    }, intervalMs);
  }
}

// Export singleton instance
export const Cache = CacheService.getInstance();

// Export common cache segments as constants
export const CacheSegments = {
  UPGRADES: 'upgrades',
  LEVELS: 'levels', 
  TASKS: 'tasks',
  ACHIEVEMENTS: 'achievements',
  USER_DATA: 'user_data',
  SCHEMA: 'schema',
  GAME_DATA: 'game_data',
  API_RESPONSES: 'api_responses',
  TEMP: 'temp'
} as const;