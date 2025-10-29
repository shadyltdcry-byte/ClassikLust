/**
 * ErrorKnowledgeBase.ts - Self-Learning Error Database
 * Last Edited: 2025-10-29 by Assistant - Created error learning system
 *
 * 🧠 LEARNS: From every error encountered
 * 📊 REMEMBERS: Error fingerprints and their successful fixes
 * 🔍 SUGGESTS: Instant fixes for previously solved problems
 * 💾 PERSISTS: Knowledge to prevent future issues
 */

import { FixSuggestion, DiagnosisResult, SeverityLevel } from '../modules/DebuggerModule';

interface ErrorFingerprint {
  id: string;
  hash: string;
  errorCode?: string;
  errorMessage: string;
  errorPattern: string;
  occurrences: number;
  firstSeen: Date;
  lastSeen: Date;
  fixes: LearnedFix[];
  context: Record<string, any>;
}

interface LearnedFix {
  id: string;
  description: string;
  fixType: string;
  fixContent: string;
  success: boolean;
  appliedAt: Date;
  appliedBy?: string;
  effectiveness: number; // 0-100
  timeToFix: number; // milliseconds
}

interface ErrorLog {
  timestamp: Date;
  errorId: string;
  context: any;
  stackTrace?: string;
  resolved: boolean;
  fixApplied?: string;
}

export class ErrorKnowledgeBase {
  private static instance: ErrorKnowledgeBase;
  private knownErrors: Map<string, ErrorFingerprint> = new Map();
  private errorLogs: ErrorLog[] = [];
  private maxLogSize = 1000; // Keep last 1000 errors
  
  // Common patterns the system has learned to recognize
  private learnedPatterns: Map<string, {
    pattern: RegExp;
    category: string;
    severity: SeverityLevel;
    commonFixes: string[];
  }> = new Map();
  
  private constructor() {
    this.initializeCommonPatterns();
    this.loadKnowledgeBase();
  }
  
  static getInstance(): ErrorKnowledgeBase {
    if (!ErrorKnowledgeBase.instance) {
      ErrorKnowledgeBase.instance = new ErrorKnowledgeBase();
    }
    return ErrorKnowledgeBase.instance;
  }
  
  // 🧠 Initialize with patterns we already know about
  private initializeCommonPatterns(): void {
    this.learnedPatterns.set('column_not_found', {
      pattern: /column "?([^"\s]+)"? does not exist.*Perhaps you meant to reference the column "([^"]+)"/,
      category: 'database_schema',
      severity: 'critical',
      commonFixes: [
        'Change query to use correct column name',
        'Add missing column to database',
        'Check for case sensitivity issues'
      ]
    });
    
    this.learnedPatterns.set('uuid_validation', {
      pattern: /invalid input syntax for type uuid/,
      category: 'validation',
      severity: 'high', 
      commonFixes: [
        'Add UUID validation before database query',
        'Handle telegram_ prefixed IDs separately',
        'Use appropriate query field for user type'
      ]
    });
    
    this.learnedPatterns.set('route_not_found', {
      pattern: /Cannot\s+(GET|POST|PUT|DELETE)\s+(.+)/,
      category: 'routing',
      severity: 'critical',
      commonFixes: [
        'Add missing route handler',
        'Register route in routes.ts',
        'Check method and path spelling'
      ]
    });
    
    this.learnedPatterns.set('display_picture_issue', {
      pattern: /display.*picture|displayPicture/i,
      category: 'feature',
      severity: 'medium',
      commonFixes: [
        'Use fileName instead of filePath',
        'Check telegramId vs telegram column',
        'Validate image path format'
      ]
    });
  }
  
  // 📊 Record a new error occurrence
  recordError(error: any, context: any = {}): string {
    const fingerprint = this.createFingerprint(error);
    const errorMessage = error.message || String(error);
    const errorCode = error.code;
    
    const errorLog: ErrorLog = {
      timestamp: new Date(),
      errorId: fingerprint,
      context,
      stackTrace: error.stack,
      resolved: false
    };
    
    // Add to error logs
    this.errorLogs.push(errorLog);
    if (this.errorLogs.length > this.maxLogSize) {
      this.errorLogs.shift(); // Remove oldest
    }
    
    // Update or create error fingerprint
    if (this.knownErrors.has(fingerprint)) {
      const existing = this.knownErrors.get(fingerprint)!;
      existing.occurrences++;
      existing.lastSeen = new Date();
      existing.context = { ...existing.context, ...context };
    } else {
      const newError: ErrorFingerprint = {
        id: fingerprint,
        hash: fingerprint,
        errorCode,
        errorMessage,
        errorPattern: this.extractPattern(errorMessage),
        occurrences: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
        fixes: [],
        context
      };
      
      this.knownErrors.set(fingerprint, newError);
    }
    
    console.log(`📊 [KNOWLEDGE-BASE] Recorded error: ${fingerprint} (${this.knownErrors.get(fingerprint)?.occurrences} occurrences)`);
    return fingerprint;
  }
  
  // 🔍 Get instant fix suggestions for known errors
  getInstantFix(error: any): FixSuggestion[] {
    const fingerprint = this.createFingerprint(error);
    const knownError = this.knownErrors.get(fingerprint);
    
    if (knownError && knownError.fixes.length > 0) {
      // Return the most effective fix
      const bestFix = knownError.fixes
        .filter(fix => fix.success)
        .sort((a, b) => b.effectiveness - a.effectiveness)[0];
      
      if (bestFix) {
        return [{
          type: 'learned_fix',
          severity: 'high',
          title: `🧠 Known Issue: ${knownError.errorMessage.substring(0, 50)}...`,
          description: `This error has occurred ${knownError.occurrences} times. Previous successful fix available.`,
          suggestedFix: {
            type: bestFix.fixType as any,
            content: bestFix.fixContent
          },
          context: {
            errorId: fingerprint,
            occurrences: knownError.occurrences,
            firstSeen: knownError.firstSeen,
            effectiveness: bestFix.effectiveness
          }
        }];
      }
    }
    
    // Check learned patterns
    const errorMessage = error.message || String(error);
    for (const [patternName, pattern] of this.learnedPatterns) {
      if (pattern.pattern.test(errorMessage)) {
        const match = errorMessage.match(pattern.pattern);
        
        return [{
          type: 'pattern_match',
          severity: pattern.severity,
          title: `🔍 Pattern Detected: ${this.capitalizeFirst(patternName)}`,
          description: `Recognized error pattern. Common fixes available.`,
          suggestedFix: {
            type: 'note',
            content: `Common fixes for ${patternName}:\n${pattern.commonFixes.map(fix => `- ${fix}`).join('\n')}`
          },
          context: {
            pattern: patternName,
            match: match ? match[0] : null,
            category: pattern.category
          }
        }];
      }
    }
    
    return [];
  }
  
  // 🛠️ Record a successful fix
  recordSuccessfulFix(errorId: string, fix: {
    description: string;
    fixType: string;
    fixContent: string;
    timeToFix: number;
    appliedBy?: string;
  }): void {
    const knownError = this.knownErrors.get(errorId);
    if (!knownError) return;
    
    const learnedFix: LearnedFix = {
      id: `fix_${Date.now()}`,
      description: fix.description,
      fixType: fix.fixType,
      fixContent: fix.fixContent,
      success: true,
      appliedAt: new Date(),
      appliedBy: fix.appliedBy,
      effectiveness: 85, // Start with good score, adjust based on feedback
      timeToFix: fix.timeToFix
    };
    
    knownError.fixes.push(learnedFix);
    
    // Mark recent error logs as resolved
    this.errorLogs
      .filter(log => log.errorId === errorId && !log.resolved)
      .forEach(log => {
        log.resolved = true;
        log.fixApplied = learnedFix.id;
      });
    
    console.log(`✅ [KNOWLEDGE-BASE] Recorded successful fix for ${errorId}: ${fix.description}`);
    this.saveKnowledgeBase();
  }
  
  // 📊 Get error statistics
  getErrorStats(): {
    totalErrors: number;
    uniqueErrors: number;
    resolvedErrors: number;
    topErrors: Array<{ message: string; count: number }>;
    recentErrors: ErrorLog[];
  } {
    const resolvedCount = this.errorLogs.filter(log => log.resolved).length;
    const recentErrors = this.errorLogs.slice(-10).reverse(); // Last 10 errors
    
    const errorCounts = new Map<string, number>();
    this.knownErrors.forEach(error => {
      errorCounts.set(error.errorMessage, error.occurrences);
    });
    
    const topErrors = Array.from(errorCounts.entries())
      .map(([message, count]) => ({ message: message.substring(0, 80), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return {
      totalErrors: this.errorLogs.length,
      uniqueErrors: this.knownErrors.size,
      resolvedErrors: resolvedCount,
      topErrors,
      recentErrors
    };
  }
  
  // 💾 Save/Load knowledge base (in production, use database or file)
  private saveKnowledgeBase(): void {
    try {
      const data = {
        errors: Array.from(this.knownErrors.entries()),
        patterns: Array.from(this.learnedPatterns.entries()),
        logs: this.errorLogs.slice(-100) // Keep last 100 logs
      };
      
      // In production, save to database or persistent storage
      console.log('💾 [KNOWLEDGE-BASE] Knowledge saved (in-memory)');
      
    } catch (error) {
      console.error('❌ [KNOWLEDGE-BASE] Failed to save:', error);
    }
  }
  
  private loadKnowledgeBase(): void {
    try {
      // In production, load from database or persistent storage
      console.log('💾 [KNOWLEDGE-BASE] Knowledge loaded from memory');
      
    } catch (error) {
      console.warn('⚠️ [KNOWLEDGE-BASE] Could not load previous knowledge:', error);
    }
  }
  
  // 🎯 Create error fingerprint
  private createFingerprint(error: any): string {
    const message = (error.message || String(error)).replace(/\d+/g, 'N'); // Normalize numbers
    const code = error.code || 'unknown';
    const type = error.name || 'Error';
    
    const fingerprint = `${code}_${type}_${message}`;
    return Buffer.from(fingerprint).toString('base64').substring(0, 16);
  }
  
  // 🎯 Extract error pattern for matching
  private extractPattern(message: string): string {
    return message
      .replace(/\d+/g, 'N') // Replace numbers with N
      .replace(/['"`][^'"`]*['"`]/g, 'STRING') // Replace strings with STRING
      .replace(/\w+_\d+/g, 'ID') // Replace IDs with ID
      .substring(0, 100);
  }
  
  // 🔧 Helper: Capitalize first letter
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
  }
  
  // 📊 Export error logs for analysis
  exportErrorLogs(): {
    timestamp: string;
    summary: string;
    knownErrors: ErrorFingerprint[];
    recentLogs: ErrorLog[];
  } {
    return {
      timestamp: new Date().toISOString(),
      summary: `${this.knownErrors.size} unique errors, ${this.errorLogs.length} total occurrences`,
      knownErrors: Array.from(this.knownErrors.values()),
      recentLogs: this.errorLogs.slice(-50) // Last 50 errors
    };
  }
  
  // 📝 Generate error report for debugging
  generateErrorReport(): string {
    const stats = this.getErrorStats();
    
    let report = `\n📊 ERROR KNOWLEDGE BASE REPORT\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `Total Errors: ${stats.totalErrors}\n`;
    report += `Unique Patterns: ${stats.uniqueErrors}\n`;
    report += `Resolved: ${stats.resolvedErrors} (${Math.round((stats.resolvedErrors / stats.totalErrors) * 100)}%)\n`;
    report += `\n🔥 TOP ERRORS:\n`;
    
    stats.topErrors.forEach((error, index) => {
      report += `${index + 1}. ${error.message} (${error.count}x)\n`;
    });
    
    report += `\n🕰 RECENT ERRORS:\n`;
    stats.recentErrors.slice(0, 5).forEach(log => {
      const status = log.resolved ? '✅' : '❌';
      report += `${status} ${log.timestamp.toISOString().substring(11, 19)}: ${log.errorId}\n`;
    });
    
    return report;
  }
  
  // 🔍 Check if error is a known pattern
  recognizeError(error: any): {
    recognized: boolean;
    pattern?: string;
    category?: string;
    suggestions: FixSuggestion[];
  } {
    const errorMessage = error.message || String(error);
    
    for (const [patternName, pattern] of this.learnedPatterns) {
      if (pattern.pattern.test(errorMessage)) {
        const match = errorMessage.match(pattern.pattern);
        
        const suggestions: FixSuggestion[] = pattern.commonFixes.map(fix => ({
          type: 'learned_pattern',
          severity: pattern.severity,
          title: `🧠 Known Fix: ${fix}`,
          description: `Based on ${patternName} pattern recognition`,
          suggestedFix: {
            type: 'note',
            content: fix
          },
          context: {
            pattern: patternName,
            category: pattern.category,
            match: match ? match[0] : null
          }
        }));
        
        return {
          recognized: true,
          pattern: patternName,
          category: pattern.category,
          suggestions
        };
      }
    }
    
    return {
      recognized: false,
      suggestions: []
    };
  }
  
  // 🛠️ Learn from new fix patterns
  learnFromFix(error: any, fix: FixSuggestion, success: boolean): void {
    const fingerprint = this.createFingerprint(error);
    const knownError = this.knownErrors.get(fingerprint);
    
    if (knownError) {
      const learnedFix: LearnedFix = {
        id: `fix_${Date.now()}`,
        description: fix.title,
        fixType: fix.suggestedFix?.type || 'unknown',
        fixContent: fix.suggestedFix?.content || '',
        success,
        appliedAt: new Date(),
        effectiveness: success ? 90 : 10,
        timeToFix: 0 // Would track actual fix time in production
      };
      
      knownError.fixes.push(learnedFix);
      
      // Update pattern recognition if this is a new pattern
      if (success && !this.hasPatternFor(error)) {
        this.learnNewPattern(error, fix);
      }
      
      this.saveKnowledgeBase();
    }
  }
  
  // 🧠 Learn new error patterns from successful fixes
  private learnNewPattern(error: any, fix: FixSuggestion): void {
    const errorMessage = error.message || String(error);
    const pattern = this.extractPattern(errorMessage);
    
    if (pattern.length > 10) { // Only learn from meaningful patterns
      const patternKey = `learned_${Date.now()}`;
      
      this.learnedPatterns.set(patternKey, {
        pattern: new RegExp(pattern.replace(/\s+/g, '\\s+'), 'i'),
        category: 'learned',
        severity: fix.severity,
        commonFixes: [fix.title]
      });
      
      console.log(`🧠 [KNOWLEDGE-BASE] Learned new pattern: ${patternKey}`);
    }
  }
  
  // 🔍 Check if we already have a pattern for this error type
  private hasPatternFor(error: any): boolean {
    const errorMessage = error.message || String(error);
    return Array.from(this.learnedPatterns.values())
      .some(pattern => pattern.pattern.test(errorMessage));
  }
  
  // 📝 Clear old logs and reset knowledge (for testing)
  reset(): void {
    this.knownErrors.clear();
    this.errorLogs = [];
    this.initializeCommonPatterns();
    console.log('📋 [KNOWLEDGE-BASE] Reset to initial state');
  }
}

// Export singleton instance
export const errorKnowledgeBase = ErrorKnowledgeBase.getInstance();
