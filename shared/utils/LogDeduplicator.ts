/**
 * LogDeduplicator.ts - Console Spam Prevention Utility
 * Last Edited: 2025-10-24 by Assistant - Clean up duplicate and noisy logs
 */

export class LogDeduplicator {
  private static instance: LogDeduplicator;
  private recentLines = new Map<string, number>();
  private readonly DEDUP_WINDOW_MS = 30_000; // 30 seconds
  private readonly MAX_ENTRIES = 1000; // Prevent memory leak

  private constructor() {}

  static getInstance(): LogDeduplicator {
    if (!LogDeduplicator.instance) {
      LogDeduplicator.instance = new LogDeduplicator();
    }
    return LogDeduplicator.instance;
  }

  /**
   * 🧹 DEDUPLICATED LOGGING
   * Prevents the same message from spamming console within time window
   */
  log(message: string, level: 'log' | 'warn' | 'error' = 'log'): void {
    if (this.shouldSuppress(message)) return;
    
    console[level](message);
    this.recordMessage(message);
  }

  /**
   * 🔍 CONDITIONAL LOGGING
   * Only logs if message hasn't appeared recently
   */
  logOnce(message: string, level: 'log' | 'warn' | 'error' = 'log'): boolean {
    if (this.shouldSuppress(message)) return false;
    
    console[level](message);
    this.recordMessage(message);
    return true;
  }

  /**
   * ⚠️ FORCE LOG (BYPASS DEDUP)
   * For critical messages that must always show
   */
  forceLog(message: string, level: 'log' | 'warn' | 'error' = 'log'): void {
    console[level](message);
    this.recordMessage(message);
  }

  /**
   * 🔍 CHECK IF MESSAGE SHOULD BE SUPPRESSED
   */
  private shouldSuppress(message: string): boolean {
    const now = Date.now();
    const lastSeen = this.recentLines.get(message);
    
    if (!lastSeen) return false;
    
    return (now - lastSeen) < this.DEDUP_WINDOW_MS;
  }

  /**
   * 📋 RECORD MESSAGE TIMESTAMP
   */
  private recordMessage(message: string): void {
    const now = Date.now();
    this.recentLines.set(message, now);
    
    // Cleanup old entries to prevent memory leak
    if (this.recentLines.size > this.MAX_ENTRIES) {
      this.cleanup(now);
    }
  }

  /**
   * 🧹 CLEANUP OLD ENTRIES
   */
  private cleanup(now: number): void {
    const cutoff = now - this.DEDUP_WINDOW_MS;
    
    for (const [message, timestamp] of this.recentLines.entries()) {
      if (timestamp < cutoff) {
        this.recentLines.delete(message);
      }
    }
  }

  /**
   * 📈 STATISTICS
   */
  getStats(): { totalTracked: number; windowMs: number; maxEntries: number } {
    return {
      totalTracked: this.recentLines.size,
      windowMs: this.DEDUP_WINDOW_MS,
      maxEntries: this.MAX_ENTRIES
    };
  }

  /**
   * 🧹 MANUAL CLEANUP
   */
  clear(): void {
    this.recentLines.clear();
  }
}

// Export singleton instance
export const Logger = LogDeduplicator.getInstance();

/**
 * 🚫 SPAM PATTERNS TO SUPPRESS
 * Common noisy messages that should be throttled
 */
export const SPAM_PATTERNS = [
  '[UPGRADES] Auto-initializing schema',
  '[UPGRADES] Schema auto-initialized successfully',
  '[UPGRADES] JSON → DB sync completed',
  '[UPGRADES] Syncing',
  'Database connected and loaded successfully',
  'SupabaseStorage initialized with JSON-first FileStorage',
  'Server loaded and started successfully',
  '[STARTUP] Running comprehensive system preflight'
];

/**
 * 🔍 UTILITY: Check if message matches spam patterns
 */
export function isSpamMessage(message: string): boolean {
  return SPAM_PATTERNS.some(pattern => message.includes(pattern));
}

/**
 * 🧹 UTILITY: Smart log that auto-detects spam
 */
export function smartLog(message: string, level: 'log' | 'warn' | 'error' = 'log'): void {
  if (isSpamMessage(message)) {
    Logger.logOnce(message, level);
  } else {
    Logger.forceLog(message, level);
  }
}

/**
 * 🎆 BANNER UTILITY: One-time banners
 */
class BannerManager {
  private static shownBanners = new Set<string>();
  
  static showOnce(bannerId: string, lines: string[]): void {
    if (BannerManager.shownBanners.has(bannerId)) return;
    
    BannerManager.shownBanners.add(bannerId);
    lines.forEach(line => console.log(line));
  }
}

export { BannerManager };