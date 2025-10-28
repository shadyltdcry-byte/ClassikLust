/**
 * BootDiagnostics.ts - Frontend Boot Diagnostics
 * Last Edited: 2025-10-24 by Assistant - Debug white screen loading issues
 */

export class BootDiagnostics {
  private static instance: BootDiagnostics;
  private startTime = Date.now();
  private milestones: Array<{ name: string; time: number; duration: number }> = [];
  private bootTimer?: NodeJS.Timeout;

  private constructor() {
    this.logMilestone('diagnostics-init');
    this.startBootWatchdog();
  }

  static getInstance(): BootDiagnostics {
    if (!BootDiagnostics.instance) {
      BootDiagnostics.instance = new BootDiagnostics();
    }
    return BootDiagnostics.instance;
  }

  /**
   * 📋 LOG BOOT MILESTONE
   */
  logMilestone(name: string, details?: any): void {
    const now = Date.now();
    const duration = now - this.startTime;
    const milestone = { name, time: now, duration };
    
    this.milestones.push(milestone);
    console.log(`🚀 [BOOT] ${name} (+${duration}ms)`, details || '');
    
    // Update UI if available
    this.updateBootStatus(`Loading: ${name}...`);
  }

  /**
   * ⚠️ START BOOT WATCHDOG
   * Shows message if loading takes too long
   */
  private startBootWatchdog(): void {
    this.bootTimer = setTimeout(() => {
      console.warn('⚠️ [BOOT] Taking longer than expected...');
      this.showSlowLoadingMessage();
      
      // Extended timeout for public Wi-Fi
      setTimeout(() => {
        this.showPublicWiFiMessage();
      }, 5000);
      
    }, 3000); // 3 seconds
  }

  /**
   * ✅ BOOT COMPLETED
   */
  bootComplete(): void {
    if (this.bootTimer) {
      clearTimeout(this.bootTimer);
    }
    
    const totalTime = Date.now() - this.startTime;
    console.log(`✅ [BOOT] Complete in ${totalTime}ms`);
    this.logMilestone('boot-complete');
    
    this.updateBootStatus('Loaded successfully!');
    setTimeout(() => this.hideBootStatus(), 1000);
  }

  /**
   * ❌ BOOT FAILED
   */
  bootFailed(error: any): void {
    if (this.bootTimer) {
      clearTimeout(this.bootTimer);
    }
    
    console.error('❌ [BOOT] Failed:', error);
    this.logMilestone('boot-failed', error);
    
    this.showBootError(error);
  }

  /**
   * 📋 GET DIAGNOSTICS
   */
  getDiagnostics() {
    return {
      startTime: this.startTime,
      totalTime: Date.now() - this.startTime,
      milestones: this.milestones,
      userAgent: navigator.userAgent,
      connection: (navigator as any).connection?.effectiveType || 'unknown',
      onLine: navigator.onLine
    };
  }

  /**
   * 📊 API HEALTH CHECK
   */
  async checkAPIHealth(): Promise<{ ok: boolean; status?: number; error?: string }> {
    try {
      this.logMilestone('api-health-check-start');
      
      const response = await fetch('/api/debug/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000 as any
      });
      
      this.logMilestone('api-health-check-response', {
        status: response.status,
        ok: response.ok
      });
      
      if (response.ok) {
        const data = await response.json();
        return { ok: true, status: response.status };
      } else {
        return { ok: false, status: response.status, error: `HTTP ${response.status}` };
      }
      
    } catch (error: any) {
      this.logMilestone('api-health-check-failed', error.message);
      return { ok: false, error: error.message };
    }
  }

  /**
   * 🔍 CHECK CRITICAL RESOURCES
   */
  async checkCriticalResources(): Promise<string[]> {
    const issues: string[] = [];
    
    try {
      // Check if API is reachable
      const apiHealth = await this.checkAPIHealth();
      if (!apiHealth.ok) {
        issues.push(`API Health Check Failed: ${apiHealth.error}`);
      }
      
      // Check network connectivity
      if (!navigator.onLine) {
        issues.push('Device is offline');
      }
      
      // Check if we're on public WiFi (heuristic)
      const connection = (navigator as any).connection;
      if (connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g') {
        issues.push('Very slow network connection detected');
      }
      
    } catch (error: any) {
      issues.push(`Resource check failed: ${error.message}`);
    }
    
    return issues;
  }

  /**
   * 📱 UI UPDATE HELPERS
   */
  private updateBootStatus(message: string): void {
    const statusEl = document.getElementById('boot-status');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.style.display = 'block';
    }
  }

  private hideBootStatus(): void {
    const statusEl = document.getElementById('boot-status');
    if (statusEl) {
      statusEl.style.display = 'none';
    }
  }

  private showSlowLoadingMessage(): void {
    this.updateBootStatus('Loading is taking longer than usual...');
  }

  private showPublicWiFiMessage(): void {
    this.updateBootStatus('If on public Wi-Fi, connections may be slow or blocked. Please wait...');
  }

  private showBootError(error: any): void {
    const message = `Loading failed: ${error?.message || 'Unknown error'}. Check console for details.`;
    this.updateBootStatus(message);
    
    // Add retry button
    const statusEl = document.getElementById('boot-status');
    if (statusEl) {
      statusEl.innerHTML = `
        <div style="color: #ff6b6b; font-weight: bold;">${message}</div>
        <button onclick="window.location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Retry
        </button>
      `;
    }
  }
}

// Export singleton
export const BootDiag = BootDiagnostics.getInstance();

/**
 * 🚀 QUICK SETUP FUNCTION
 * Call this early in your app bootstrap
 */
export function setupBootDiagnostics() {
  // Add boot status element to DOM if not exists
  if (!document.getElementById('boot-status')) {
    const statusEl = document.createElement('div');
    statusEl.id = 'boot-status';
    statusEl.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 14px;
      z-index: 9999;
      max-width: 400px;
      text-align: center;
      display: none;
    `;
    document.body.appendChild(statusEl);
  }
  
  // Start diagnostics
  BootDiag.logMilestone('setup-complete');
  
  // Log page load events
  window.addEventListener('DOMContentLoaded', () => {
    BootDiag.logMilestone('dom-content-loaded');
  });
  
  window.addEventListener('load', () => {
    BootDiag.logMilestone('window-load');
  });
  
  // Check for errors
  window.addEventListener('error', (e) => {
    BootDiag.logMilestone('javascript-error', {
      message: e.message,
      filename: e.filename,
      line: e.lineno
    });
  });
  
  return BootDiag;
}