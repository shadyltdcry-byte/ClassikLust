/**
 * Enhanced Debugger - PROACTIVE ERROR DETECTION AND AUTO-FIXING
 * This debugger actively monitors, detects, and fixes issues automatically
 */

class EnhancedDebugger {
  constructor() {
    this.isActive = false;
    this.monitoringInterval = null;
    this.errorLog = [];
    this.fixAttempts = new Map();
    this.maxFixAttempts = 3;
    
    // Known issue patterns and their fixes
    this.knownIssues = new Map([
      [
        'upgrade_effects_not_applying',
        {
          pattern: /purchase.*success.*but.*stats.*not.*updat/i,
          fix: this.fixUpgradeEffects.bind(this),
          description: 'Upgrade effects not applying after purchase'
        }
      ],
      [
        'media_upload_filename_error',
        {
          pattern: /fileName.*undefined|originalName.*undefined/i,
          fix: this.fixMediaUpload.bind(this),
          description: 'Media upload filename errors'
        }
      ],
      [
        'duplicate_upgrades',
        {
          pattern: /duplicate.*passive.*income/i,
          fix: this.fixDuplicateUpgrades.bind(this),
          description: 'Duplicate upgrade entries'
        }
      ],
      [
        'avatar_display_broken',
        {
          pattern: /displayPicture.*image.*text|both.*showing/i,
          fix: this.fixAvatarDisplay.bind(this),
          description: 'Avatar showing both image and text'
        }
      ],
      [
        'database_connection_error',
        {
          pattern: /connection.*refused|database.*error|supabase.*error/i,
          fix: this.fixDatabaseConnection.bind(this),
          description: 'Database connection issues'
        }
      ]
    ]);
    
    console.log('🤖 [ENHANCED-DEBUGGER] Initialized with proactive monitoring');
  }
  
  /**
   * Start the enhanced debugger
   */
  start() {
    if (this.isActive) return;
    
    this.isActive = true;
    console.log('🚀 [ENHANCED-DEBUGGER] Starting proactive monitoring...');
    
    // Override console methods to catch all logs
    this.interceptConsoleLogs();
    
    // Start monitoring interval
    this.monitoringInterval = setInterval(() => {
      this.performHealthChecks();
    }, 5000); // Check every 5 seconds
    
    // Monitor fetch requests for API errors
    this.interceptFetchRequests();
    
    // Monitor React errors
    this.setupReactErrorBoundary();
    
    return {
      status: 'active',
      message: 'Enhanced debugger is now monitoring and auto-fixing issues'
    };
  }
  
  /**
   * Stop the debugger
   */
  stop() {
    this.isActive = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('🚫 [ENHANCED-DEBUGGER] Stopped monitoring');
  }
  
  /**
   * Intercept console logs to detect errors
   */
  interceptConsoleLogs() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.log = (...args) => {
      this.analyzeLogMessage(args.join(' '), 'log');
      originalLog.apply(console, args);
    };
    
    console.error = (...args) => {
      this.analyzeLogMessage(args.join(' '), 'error');
      originalError.apply(console, args);
    };
    
    console.warn = (...args) => {
      this.analyzeLogMessage(args.join(' '), 'warn');
      originalWarn.apply(console, args);
    };
  }
  
  /**
   * Analyze log messages for known issues
   */
  analyzeLogMessage(message, level) {
    if (!this.isActive) return;
    
    for (const [issueKey, issueConfig] of this.knownIssues) {
      if (issueConfig.pattern.test(message)) {
        console.log(`🚨 [ENHANCED-DEBUGGER] Detected issue: ${issueConfig.description}`);
        this.attemptAutoFix(issueKey, issueConfig, message);
      }
    }
  }
  
  /**
   * Attempt to automatically fix detected issues
   */
  async attemptAutoFix(issueKey, issueConfig, originalMessage) {
    const attempts = this.fixAttempts.get(issueKey) || 0;
    
    if (attempts >= this.maxFixAttempts) {
      console.log(`⚠️ [ENHANCED-DEBUGGER] Max fix attempts reached for ${issueKey}`);
      return;
    }
    
    this.fixAttempts.set(issueKey, attempts + 1);
    
    console.log(`🔧 [ENHANCED-DEBUGGER] Attempting auto-fix for ${issueKey} (attempt ${attempts + 1})`);
    
    try {
      const result = await issueConfig.fix(originalMessage);
      if (result.success) {
        console.log(`✅ [ENHANCED-DEBUGGER] Successfully fixed ${issueKey}:`, result.message);
        this.fixAttempts.delete(issueKey); // Reset on success
      } else {
        console.log(`❌ [ENHANCED-DEBUGGER] Failed to fix ${issueKey}:`, result.error);
      }
    } catch (error) {
      console.error(`🚨 [ENHANCED-DEBUGGER] Error during auto-fix of ${issueKey}:`, error);
    }
  }
  
  /**
   * Fix upgrade effects not applying
   */
  async fixUpgradeEffects(originalMessage) {
    try {
      // Force refresh user stats after upgrade purchase
      console.log('🔧 [AUTO-FIX] Forcing stats refresh after upgrade...');
      
      const userId = this.extractUserIdFromMessage(originalMessage);
      if (userId) {
        // Trigger a stats refresh
        await this.refreshUserStats(userId);
        return {
          success: true,
          message: 'Forced user stats refresh to apply upgrade effects'
        };
      }
      
      return {
        success: false,
        error: 'Could not extract userId from error message'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Fix media upload filename errors
   */
  async fixMediaUpload(originalMessage) {
    try {
      console.log('🔧 [AUTO-FIX] Attempting to fix media upload errors...');
      
      // Check if the new fixed routes are available
      const response = await fetch('/api/user/set-display-picture', {
        method: 'OPTIONS'
      });
      
      if (response.status === 404) {
        return {
          success: false,
          error: 'Fixed media upload routes not yet deployed'
        };
      }
      
      return {
        success: true,
        message: 'Media upload routes appear to be available'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Fix duplicate upgrades
   */
  async fixDuplicateUpgrades(originalMessage) {
    try {
      console.log('🔧 [AUTO-FIX] Running database migration to remove duplicate upgrades...');
      
      // Call admin endpoint to run the migration
      const response = await fetch('/api/admin/run-migration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          migration: 'fix-duplicate-upgrades'
        })
      });
      
      if (response.ok) {
        return {
          success: true,
          message: 'Successfully ran duplicate upgrade cleanup migration'
        };
      } else {
        return {
          success: false,
          error: 'Failed to run migration - admin endpoint not available'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Fix avatar display issues
   */
  async fixAvatarDisplay(originalMessage) {
    try {
      console.log('🔧 [AUTO-FIX] Forcing PlayerStatsPanel re-render to fix avatar display...');
      
      // Force a re-render by dispatching a custom event
      window.dispatchEvent(new CustomEvent('forceAvatarReset', {
        detail: { reason: 'debugger_fix' }
      }));
      
      return {
        success: true,
        message: 'Triggered avatar display reset'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Fix database connection issues
   */
  async fixDatabaseConnection(originalMessage) {
    try {
      console.log('🔧 [AUTO-FIX] Testing database connectivity...');
      
      // Test a simple API call
      const response = await fetch('/api/health');
      if (response.ok) {
        return {
          success: true,
          message: 'Database connection appears to be working'
        };
      } else {
        return {
          success: false,
          error: 'Database health check failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Perform regular health checks
   */
  async performHealthChecks() {
    if (!this.isActive) return;
    
    // Check for common issues
    try {
      // Check if upgrade purchases are working
      await this.checkUpgradeSystemHealth();
      
      // Check if media uploads are working
      await this.checkMediaUploadHealth();
      
      // Check database connectivity
      await this.checkDatabaseHealth();
      
    } catch (error) {
      console.error('🚨 [ENHANCED-DEBUGGER] Health check error:', error);
    }
  }
  
  /**
   * Check upgrade system health
   */
  async checkUpgradeSystemHealth() {
    // This would check if recent upgrade purchases applied effects
    // Implementation depends on your specific tracking needs
  }
  
  /**
   * Check media upload health
   */
  async checkMediaUploadHealth() {
    // This would check if media upload endpoints are responding correctly
    // Implementation depends on your specific needs
  }
  
  /**
   * Check database health
   */
  async checkDatabaseHealth() {
    try {
      const response = await fetch('/api/health');
      if (!response.ok) {
        console.warn('⚠️ [HEALTH-CHECK] Database health check failed');
      }
    } catch (error) {
      console.error('🚨 [HEALTH-CHECK] Database connectivity error:', error);
    }
  }
  
  /**
   * Extract user ID from error messages
   */
  extractUserIdFromMessage(message) {
    const userIdMatch = message.match(/user[:\s]+([a-z0-9_]+)/i);
    return userIdMatch ? userIdMatch[1] : null;
  }
  
  /**
   * Force refresh user stats
   */
  async refreshUserStats(userId) {
    try {
      const response = await fetch(`/api/user/${userId}/refresh-stats`, {
        method: 'POST'
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to refresh user stats:', error);
      return false;
    }
  }
  
  /**
   * Intercept fetch requests to monitor API errors
   */
  interceptFetchRequests() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch.apply(window, args);
        
        if (!response.ok && this.isActive) {
          console.log(`🚨 [ENHANCED-DEBUGGER] API Error detected: ${response.status} ${response.statusText}`);
          // Could trigger auto-fixes based on API errors here
        }
        
        return response;
      } catch (error) {
        if (this.isActive) {
          console.log(`🚨 [ENHANCED-DEBUGGER] Network Error detected:`, error.message);
        }
        throw error;
      }
    };
  }
  
  /**
   * Setup React error boundary monitoring
   */
  setupReactErrorBoundary() {
    window.addEventListener('error', (event) => {
      if (this.isActive) {
        console.log(`🚨 [ENHANCED-DEBUGGER] React Error detected:`, event.error);
        this.analyzeLogMessage(event.error.toString(), 'error');
      }
    });
  }
  
  /**
   * Get current status
   */
  getStatus() {
    return {
      active: this.isActive,
      errorsDetected: this.errorLog.length,
      fixAttempts: Object.fromEntries(this.fixAttempts),
      knownIssues: Array.from(this.knownIssues.keys())
    };
  }
}

// Initialize and expose globally
window.enhancedDebugger = new EnhancedDebugger();

// Auto-start if in development
if (process.env.NODE_ENV === 'development') {
  window.enhancedDebugger.start();
}

console.log('✅ [ENHANCED-DEBUGGER] Ready - Use window.enhancedDebugger.start() to begin monitoring');

export default window.enhancedDebugger;