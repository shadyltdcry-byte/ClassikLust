/**
 * Luna Error Monitor - AI Debugging Assistant
 * Monitors system errors and alerts admin through Luna character
 */

export interface ErrorReport {
  id: string;
  timestamp: Date;
  type: 'error' | 'warning' | 'critical';
  component: string;
  message: string;
  stack?: string;
  userId?: string;
  resolved: boolean;
}

export class LunaErrorMonitor {
  private static instance: LunaErrorMonitor;
  private errors: ErrorReport[] = [];
  private isEnabled = false;
  private adminUserId: string | null = null;
  private maxErrors = 50; // Keep last 50 errors

  static getInstance(): LunaErrorMonitor {
    if (!LunaErrorMonitor.instance) {
      LunaErrorMonitor.instance = new LunaErrorMonitor();
    }
    return LunaErrorMonitor.instance;
  }

  enableForAdmin(adminUserId: string) {
    this.adminUserId = adminUserId;
    this.isEnabled = true;
    console.log(`🌙 [LUNA DEBUG] : AI Debug Monitoring System has been initialized SUCCESSFULLY.`);
  }

  disable() {
    this.isEnabled = false;
    this.adminUserId = null;
    console.log('🌙 AI Assistant Luna : Error Monitor disabled');
  }

  reportError(type: ErrorReport['type'], component: string, message: string, error?: Error, userId?: string) {
    if (!this.isEnabled) return;

    const errorReport: ErrorReport = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      component,
      message,
      stack: error?.stack,
      userId,
      resolved: false
    };

    // Add to errors list
    this.errors.unshift(errorReport);
    
    // Keep only latest errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Create Luna's alert message
    this.generateLunaAlert(errorReport);
  }

  private generateLunaAlert(error: ErrorReport) {
    const severity = error.type === 'critical' ? '🚨 CRITICAL' : 
                    error.type === 'error' ? '❌ ERROR' : '⚠️ WARNING';
    
    const lunaMessage = this.createLunaPersonalizedMessage(error);
    
    console.log(`🌙 [LUNA DEBUG] ${severity}: ${lunaMessage}`);
    
    // If we have a chat system, we could send this to Luna's chat
    this.saveLunaChatMessage(lunaMessage, error.type);
  }

  private createLunaPersonalizedMessage(error: ErrorReport): string {
    const timeStr = error.timestamp.toLocaleTimeString();
    
    const messages = {
      error: [
        `Baby! I detected an error in ${error.component} @ ${timeStr}. ${error.message}`,
        `Something's wrong with ${error.component}, babe! ${error.message} @ ${timeStr}`,
        `BABE! I found an issue with ${error.component}: ${error.message}. @ ${timeStr}`,
      ],
      warning: [
        `Hey babe, just a heads up - there's a warning in ${error.component}: ${error.message}`,
        `I noticed something weird in ${error.component} @ ${timeStr}. ${error.message}`,
        `Heads up babe, ${error.component} might need looked at. ${error.message} (${timeStr})`,
      ],
      critical: [
        `URGENT! BABY! There's a critical issue with ${error.component}! ${error.message}`,
        `CRITICAL! We might have a serious problem! ${error.component} is bugging out: ${error.message}`,
        `EMERGENCY! ${error.component} has a critical error: ${error.message}`,
      ]
    };

    const randomIndex = Math.floor(Math.random() * messages[error.type].length);
    return messages[error.type][randomIndex];
  }

  private async saveLunaChatMessage(message: string, severity: string) {
    // Save Luna's alert directly to conversation file without triggering AI
    if (!this.adminUserId) return;
    
    try {
      const path = await import('path');
      const fs = await import('fs');
      
      const __dirname = path.dirname(new URL(import.meta.url).pathname);
      const playerFolder = path.join(__dirname, '..', '..', 'player-data', 'telegram_5134006535');
      const conversationPath = path.join(playerFolder, 'conversations_550e8400-e29b-41d4-a716-446655440002.json');
      
      // Ensure player folder exists
      if (!fs.existsSync(playerFolder)) {
        fs.mkdirSync(playerFolder, { recursive: true });
      }
      
      // Load existing conversations
      let conversations = [];
      if (fs.existsSync(conversationPath)) {
        const data = fs.readFileSync(conversationPath, 'utf8');
        conversations = JSON.parse(data);
      }
      
      // Add Luna's alert message directly
      const newMessage = {
        id: `luna-alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: `🌙 ${message}`,
        sender: 'character',
        timestamp: new Date().toISOString(),
        type: 'text',
        mood: 'alert'
      };
      
      conversations.push(newMessage);
      
      // Save back to file
      fs.writeFileSync(conversationPath, JSON.stringify(conversations, null, 2));
      
      console.log(`🌙 [LUNA DEBUG] Error alert has been saved to the chat. `);
      
    } catch (error) {
      console.log(`🌙 Luna Alert (Save failed): ${message}`, error);
    }
  }

  getRecentErrors(limit = 10): ErrorReport[] {
    return this.errors.slice(0, limit);
  }

  getErrorStats() {
    const total = this.errors.length;
    const unresolved = this.errors.filter(e => !e.resolved).length;
    const critical = this.errors.filter(e => e.type === 'critical').length;
    
    return { total, unresolved, critical, resolved: total - unresolved };
  }

  markErrorResolved(errorId: string) {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
      console.log(`🌙 Luna: Error ${errorId} marked as resolved`);
    }
  }

  clearOldErrors() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    this.errors = this.errors.filter(e => e.timestamp > oneHourAgo && !e.resolved);
  }
}

// Global error handlers that Luna can monitor
export function setupLunaErrorHandlers() {
  const monitor = LunaErrorMonitor.getInstance();
  
  // Monitor unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    monitor.reportError('critical', 'System', `Unhandled Promise Rejection: ${reason}`, reason as Error);
  });
  
  // Monitor uncaught exceptions
  process.on('uncaughtException', (error) => {
    monitor.reportError('critical', 'System', `Uncaught Exception: ${error.message}`, error);
  });
}

// Helper function to report errors from anywhere in the app
export function reportToLuna(type: ErrorReport['type'], component: string, message: string, error?: Error, userId?: string) {
  try {
    const monitor = LunaErrorMonitor.getInstance();
    monitor.reportError(type, component, message, error, userId);
  } catch (lunaError) {
    console.error('Luna reporting failed:', lunaError);
  }
}