/**
 * PluginDebugger.ts - One-Line Per-Plugin Debugging System
 * Usage: const debug = debugPlugin('UpgradeManager'); at top of any plugin
 */

interface DebugEntry {
  id: string;
  timestamp: string;
  plugin: string;
  level: 'trace' | 'info' | 'warn' | 'error' | 'success' | 'timer';
  action: string;
  data?: any;
  duration?: number;
}

class PluginDebugger {
  private static instances = new Map<string, PluginDebugger>();
  private static globalLogs: DebugEntry[] = [];
  private pluginName: string;
  private timers = new Map<string, number>();
  private state: any = {};

  constructor(pluginName: string) {
    this.pluginName = pluginName;
  }

  static getInstance(pluginName: string): PluginDebugger {
    if (!PluginDebugger.instances.has(pluginName)) {
      PluginDebugger.instances.set(pluginName, new PluginDebugger(pluginName));
    }
    return PluginDebugger.instances.get(pluginName)!;
  }

  private addEntry(level: DebugEntry['level'], action: string, data?: any, duration?: number) {
    const entry: DebugEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      plugin: this.pluginName,
      level,
      action,
      data: this.sanitizeData(data),
      duration
    };

    PluginDebugger.globalLogs.push(entry);
    if (PluginDebugger.globalLogs.length > 1000) {
      PluginDebugger.globalLogs.shift();
    }

    // Send to main debugger console if available
    if (typeof window !== 'undefined' && (window as any).debuggerCore) {
      (window as any).debuggerCore.logPluginEvent(entry);
    }

    // Console output with plugin prefix
    const prefix = `[${this.pluginName}]`;
    const message = `${action}${data ? ` | ${JSON.stringify(data)}` : ''}`;
    
    switch (level) {
      case 'error':
        console.error(`🔴 ${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`🟡 ${prefix} ${message}`);
        break;
      case 'success':
        console.log(`🟢 ${prefix} ${message}`);
        break;
      case 'timer':
        console.log(`⏱️ ${prefix} ${message} (${duration}ms)`);
        break;
      default:
        console.log(`🔵 ${prefix} ${message}`);
    }
  }

  private sanitizeData(data: any): any {
    if (!data) return undefined;
    
    try {
      const sanitized = JSON.parse(JSON.stringify(data));
      // Remove sensitive fields
      if (typeof sanitized === 'object') {
        delete sanitized.password;
        delete sanitized.token;
        delete sanitized.apiKey;
        delete sanitized.secret;
      }
      return sanitized;
    } catch (e) {
      return { serialization_error: String(data).slice(0, 100) };
    }
  }

  // Public API methods
  trace(action: string, data?: any) {
    this.addEntry('trace', action, data);
  }

  info(action: string, data?: any) {
    this.addEntry('info', action, data);
  }

  warn(action: string, data?: any) {
    this.addEntry('warn', action, data);
  }

  error(action: string, data?: any) {
    this.addEntry('error', action, data);
  }

  success(action: string, data?: any) {
    this.addEntry('success', action, data);
  }

  timeStart(label: string) {
    this.timers.set(label, performance.now());
    this.trace(`timer:start:${label}`);
  }

  timeEnd(label: string) {
    const startTime = this.timers.get(label);
    if (startTime) {
      const duration = Math.round(performance.now() - startTime);
      this.timers.delete(label);
      this.addEntry('timer', `timer:end:${label}`, undefined, duration);
      return duration;
    }
    return 0;
  }

  setState(newState: any) {
    this.state = { ...this.state, ...newState };
    this.trace('state:update', newState);
  }

  getState() {
    return { ...this.state };
  }

  dumpState() {
    this.info('state:dump', this.state);
  }

  // Static methods for global access
  static getAllLogs(): DebugEntry[] {
    return [...PluginDebugger.globalLogs];
  }

  static getLogsForPlugin(pluginName: string): DebugEntry[] {
    return PluginDebugger.globalLogs.filter(log => log.plugin === pluginName);
  }

  static clearLogs(pluginName?: string) {
    if (pluginName) {
      PluginDebugger.globalLogs = PluginDebugger.globalLogs.filter(log => log.plugin !== pluginName);
    } else {
      PluginDebugger.globalLogs = [];
    }
  }

  static getActivePlugins(): string[] {
    const plugins = new Set<string>();
    PluginDebugger.globalLogs.forEach(log => plugins.add(log.plugin));
    return Array.from(plugins);
  }
}

// Export the main function for easy import
export function debugPlugin(pluginName: string): PluginDebugger {
  return PluginDebugger.getInstance(pluginName);
}

export default PluginDebugger;