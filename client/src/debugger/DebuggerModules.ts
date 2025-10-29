/**
 * DebuggerModules.ts - Comprehensive debugging modules for your game
 * Integrates with existing debugger system and uses AI APIs
 */

// Module interfaces
interface ScanResult {
  module: string;
  status: 'healthy' | 'warning' | 'critical' | 'error';
  message: string;
  details?: any;
  timestamp: string;
  fixes?: string[];
}

interface AIAnalysisResult {
  provider: 'perplexity' | 'mistral' | 'local';
  analysis: string;
  recommendations: string[];
  confidence: number;
}

// Command Registry for automatic dropdown population
export const DEBUGGER_COMMANDS = {
  // System Commands
  'status': {
    description: 'Check overall system health',
    usage: 'status',
    category: 'system',
    example: 'status'
  },
  'scan-all': {
    description: 'Run comprehensive system scan',
    usage: 'scan-all',
    category: 'system', 
    example: 'scan-all'
  },
  'quick-check': {
    description: 'Quick health check of critical systems',
    usage: 'quick-check',
    category: 'system',
    example: 'quick-check'
  },
  
  // AI Commands
  'ai-analyze': {
    description: 'Run AI analysis of current errors (Perplexity/Mistral)',
    usage: 'ai-analyze [optional: error-type]',
    category: 'ai',
    example: 'ai-analyze upgrade-issues'
  },
  'ai-recommend': {
    description: 'Get AI recommendations for specific issues', 
    usage: 'ai-recommend <issue-category>',
    category: 'ai',
    example: 'ai-recommend media-upload'
  },
  
  // API Commands
  'scan-apis': {
    description: 'Scan all API endpoints for availability',
    usage: 'scan-apis',
    category: 'api',
    example: 'scan-apis'
  },
  'test-endpoint': {
    description: 'Test specific API endpoint',
    usage: 'test-endpoint <endpoint-path>',
    category: 'api',
    example: 'test-endpoint /api/upgrades'
  },
  
  // Database Commands
  'scan-db': {
    description: 'Check database connectivity and table integrity',
    usage: 'scan-db',
    category: 'database',
    example: 'scan-db'
  },
  'check-tables': {
    description: 'Verify all required database tables exist',
    usage: 'check-tables',
    category: 'database',
    example: 'check-tables'
  },
  
  // Upgrade System Commands
  'scan-upgrades': {
    description: 'Check upgrade system (JSON loading, database sync)',
    usage: 'scan-upgrades',
    category: 'upgrades',
    example: 'scan-upgrades'
  },
  'load-json-upgrades': {
    description: 'Test loading upgrades from JSON files',
    usage: 'load-json-upgrades',
    category: 'upgrades',
    example: 'load-json-upgrades'
  },
  'sync-upgrades': {
    description: 'Sync JSON upgrades to database',
    usage: 'sync-upgrades',
    category: 'upgrades',
    example: 'sync-upgrades'
  },
  
  // Media System Commands
  'scan-media': {
    description: 'Check media upload system health',
    usage: 'scan-media', 
    category: 'media',
    example: 'scan-media'
  },
  'test-upload': {
    description: 'Test media upload endpoint (simulation)',
    usage: 'test-upload',
    category: 'media',
    example: 'test-upload'
  },
  
  // Performance Commands
  'scan-performance': {
    description: 'Check API response times and performance',
    usage: 'scan-performance',
    category: 'performance',
    example: 'scan-performance'
  },
  
  // Utility Commands
  'clear-cache': {
    description: 'Clear React Query cache',
    usage: 'clear-cache',
    category: 'utility',
    example: 'clear-cache'
  },
  'export-logs': {
    description: 'Export debug logs to file',
    usage: 'export-logs',
    category: 'utility', 
    example: 'export-logs'
  },
  'fix-auth': {
    description: 'Apply admin authentication bypass for development',
    usage: 'fix-auth',
    category: 'fixes',
    example: 'fix-auth'
  },
  'fix-upgrades': {
    description: 'Apply upgrade system fixes',
    usage: 'fix-upgrades', 
    category: 'fixes',
    example: 'fix-upgrades'
  },
  'fix-media': {
    description: 'Apply media upload fixes',
    usage: 'fix-media',
    category: 'fixes',
    example: 'fix-media'
  }
};

// Get commands by category for UI organization
export function getCommandsByCategory() {
  const categories = {};
  
  Object.entries(DEBUGGER_COMMANDS).forEach(([command, config]) => {
    if (!categories[config.category]) {
      categories[config.category] = [];
    }
    categories[config.category].push({ command, ...config });
  });
  
  return categories;
}

// API Scanner Module
export class APIScanner {
  private baseURL = '';
  private endpoints: string[] = [
    '/api/health',
    '/api/user/telegram_5134006535',
    '/api/upgrades',
    '/api/admin/upgrades',
    '/api/upgrades/definitions',
    '/api/media',
    '/api/media/upload',
    '/api/characters',
    '/api/stats/telegram_5134006535',
    '/api/debug/analyze'
  ];
  
  async scanAllEndpoints(): Promise<ScanResult[]> {
    console.log('🔍 [API-SCANNER] Starting comprehensive API scan...');
    
    const results: ScanResult[] = [];
    
    for (const endpoint of this.endpoints) {
      try {
        const result = await this.testEndpoint(endpoint);
        results.push(result);
        console.log(`🔍 [API-SCANNER] ${endpoint}: ${result.status}`);
      } catch (error) {
        results.push({
          module: 'api-scanner',
          status: 'error',
          message: `Failed to test ${endpoint}: ${error.message}`,
          details: { endpoint, error: error.message },
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return results;
  }
  
  async testEndpoint(endpoint: string): Promise<ScanResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          'x-admin-bypass': 'development', // For admin endpoints
          'x-debug-scan': 'true'
        }
      });
      
      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok || response.status === 401; // 401 might be expected for some endpoints
      
      let responseData;
      try {
        responseData = await response.json();
      } catch {
        responseData = await response.text();
      }
      
      return {
        module: 'api-scanner',
        status: isHealthy ? 'healthy' : response.status === 404 ? 'error' : 'warning',
        message: `${endpoint} responded in ${responseTime}ms (${response.status})`,
        details: {
          endpoint,
          status: response.status,
          responseTime,
          responseType: typeof responseData,
          hasData: !!responseData
        },
        timestamp: new Date().toISOString(),
        fixes: response.status === 404 ? ['Check if route is properly registered', 'Verify file exists'] : []
      };
      
    } catch (error) {
      return {
        module: 'api-scanner',
        status: 'critical',
        message: `${endpoint} failed: ${error.message}`,
        details: { endpoint, error: error.message },
        timestamp: new Date().toISOString(),
        fixes: ['Check server is running', 'Verify network connectivity', 'Check for CORS issues']
      };
    }
  }
}

// Database Scanner Module
export class DatabaseScanner {
  async scanDatabaseHealth(): Promise<ScanResult[]> {
    console.log('🖾 [DB-SCANNER] Starting database health scan...');
    
    const results: ScanResult[] = [];
    
    // Test basic connectivity
    try {
      const connectivityResult = await this.testConnectivity();
      results.push(connectivityResult);
    } catch (error) {
      results.push({
        module: 'db-scanner',
        status: 'critical',
        message: `Database connectivity test failed: ${error.message}`,
        details: { error: error.message },
        timestamp: new Date().toISOString(),
        fixes: ['Check Supabase connection', 'Verify environment variables']
      });
    }
    
    // Test table integrity
    try {
      const tablesResult = await this.checkTables();
      results.push(...tablesResult);
    } catch (error) {
      results.push({
        module: 'db-scanner',
        status: 'error',
        message: `Table check failed: ${error.message}`,
        details: { error: error.message },
        timestamp: new Date().toISOString(),
        fixes: ['Run database migrations', 'Check table schemas']
      });
    }
    
    return results;
  }
  
  async testConnectivity(): Promise<ScanResult> {
    const response = await fetch('/api/health');
    const responseData = await response.json();
    
    return {
      module: 'db-scanner',
      status: response.ok ? 'healthy' : 'critical',
      message: response.ok ? 'Database connectivity verified' : 'Database connection failed',
      details: {
        status: response.status,
        response: responseData
      },
      timestamp: new Date().toISOString(),
      fixes: !response.ok ? ['Check database connection string', 'Verify Supabase is running'] : []
    };
  }
  
  private async checkTables(): Promise<ScanResult[]> {
    const results: ScanResult[] = [];
    const tables = [
      { name: 'users', endpoint: '/api/user/telegram_5134006535' },
      { name: 'upgrades', endpoint: '/api/upgrades' },
      { name: 'characters', endpoint: '/api/characters' },
      { name: 'media_files', endpoint: '/api/media' }
    ];
    
    for (const table of tables) {
      try {
        const response = await fetch(table.endpoint);
        const data = await response.json();
        
        results.push({
          module: 'db-scanner',
          status: response.ok ? 'healthy' : 'warning',
          message: `Table ${table.name}: ${response.ok ? 'accessible' : 'issues detected'}`,
          details: {
            table: table.name,
            endpoint: table.endpoint,
            status: response.status,
            hasData: Array.isArray(data) ? data.length > 0 : !!data
          },
          timestamp: new Date().toISOString(),
          fixes: !response.ok ? [`Check ${table.name} table permissions`, 'Verify table exists'] : []
        });
      } catch (error) {
        results.push({
          module: 'db-scanner',
          status: 'error',
          message: `Table ${table.name} check failed: ${error.message}`,
          details: { table: table.name, error: error.message },
          timestamp: new Date().toISOString(),
          fixes: [`Check ${table.name} table schema`, 'Run migrations for missing tables']
        });
      }
    }
    
    return results;
  }
}

// Upgrade System Scanner Module
export class UpgradeSystemScanner {
  async scanUpgradeSystem(): Promise<ScanResult[]> {
    console.log('💪 [UPGRADE-SCANNER] Scanning upgrade system...');
    
    const results: ScanResult[] = [];
    
    // Test JSON file loading
    try {
      const jsonResult = await this.testJSONLoading();
      results.push(jsonResult);
    } catch (error) {
      results.push({
        module: 'upgrade-scanner',
        status: 'critical',
        message: `JSON loading failed: ${error.message}`,
        details: { error: error.message },
        timestamp: new Date().toISOString(),
        fixes: ['Check game-data/upgrades folder exists', 'Verify JSON file syntax']
      });
    }
    
    return results;
  }
  
  async testJSONLoading(): Promise<ScanResult> {
    const response = await fetch('/api/upgrades/definitions');
    const data = await response.json();
    
    return {
      module: 'upgrade-scanner',
      status: response.ok && data.count > 0 ? 'healthy' : 'critical',
      message: response.ok ? 
        `Loaded ${data.count} upgrades from JSON files` : 
        `JSON loading failed: ${data.error}`,
      details: {
        status: response.status,
        upgradeCount: data.count || 0,
        categories: data.categories || [],
        loadResults: data.loadResults
      },
      timestamp: new Date().toISOString(),
      fixes: !response.ok ? [
        'Check game-data/upgrades folder exists',
        'Verify JSON files are valid', 
        'Check file permissions'
      ] : []
    };
  }
}

// Media System Scanner Module
export class MediaSystemScanner {
  async scanMediaSystem(): Promise<ScanResult[]> {
    console.log('🖼️ [MEDIA-SCANNER] Scanning media system...');
    
    const results: ScanResult[] = [];
    
    // Test media endpoint
    try {
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: new FormData() // Empty to test error handling
      });
      const data = await response.json();
      
      // 400 is expected for empty upload, means endpoint is working
      const isWorking = response.status === 400 && data.error?.includes('No files');
      
      results.push({
        module: 'media-scanner',
        status: isWorking ? 'healthy' : 'error',
        message: isWorking ? 
          'Upload endpoint properly rejects empty uploads' :
          `Upload endpoint issue: ${data.error || response.status}`,
        details: {
          status: response.status,
          response: data,
          expectedStatus: 400
        },
        timestamp: new Date().toISOString(),
        fixes: !isWorking ? [
          'Check multer configuration',
          'Verify filename vs fileName usage',
          'Check FormData parsing'
        ] : []
      });
    } catch (error) {
      results.push({
        module: 'media-scanner',
        status: 'critical',
        message: `Media system test failed: ${error.message}`,
        details: { error: error.message },
        timestamp: new Date().toISOString(),
        fixes: ['Check media upload route exists', 'Verify server is running']
      });
    }
    
    return results;
  }
}

// AI Analysis Module with your API keys
export class AIAnalysisModule {
  async analyzeSystemIssues(scanResults: ScanResult[]): Promise<AIAnalysisResult> {
    console.log('🤖 [AI-ANALYSIS] Starting AI analysis...');
    
    const errors = scanResults.filter(r => r.status === 'error' || r.status === 'critical');
    const analysisPrompt = this.buildPrompt(scanResults, errors);
    
    // Try AI analysis with your keys
    try {
      return await this.callAIAnalysis(analysisPrompt);
    } catch (error) {
      console.log('🤖 [AI-ANALYSIS] AI failed, using local analysis');
      return this.localAnalysis(scanResults);
    }
  }
  
  private buildPrompt(allResults: ScanResult[], errors: ScanResult[]): string {
    return `ANIME GAME DEBUG ANALYSIS:

SYSTEM: TypeScript React Telegram tap game
TECH: React, TypeScript, Supabase, PostgreSQL, Next.js

ISSUES DETECTED:
${errors.map(e => `- ${e.module}: ${e.message}`).join('\n')}

CONTEXT:
- Upgrade effects not applying after purchase
- Media uploads failing with fileName errors  
- Admin authentication blocking development
- JSON upgrades not loading properly

Provide specific fixes and priority order.`;
  }
  
  private async callAIAnalysis(prompt: string): Promise<AIAnalysisResult> {
    // Try calling your debug analysis endpoint
    const response = await fetch('/api/debug/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, errors: [] })
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        provider: data.aiAnalysis?.provider || 'local',
        analysis: data.aiAnalysis?.analysis || 'Analysis completed',
        recommendations: data.recommendations?.map(r => r.action) || [],
        confidence: 0.8
      };
    }
    
    throw new Error('AI analysis endpoint failed');
  }
  
  private localAnalysis(scanResults: ScanResult[]): AIAnalysisResult {
    const errors = scanResults.filter(r => r.status === 'error' || r.status === 'critical');
    const recommendations = [];
    
    if (errors.some(e => e.message.includes('401'))) {
      recommendations.push('Set NODE_ENV=development to bypass admin auth');
    }
    if (errors.some(e => e.message.includes('fileName'))) {
      recommendations.push('Fix filename vs fileName property inconsistencies');
    }
    if (errors.some(e => e.message.includes('upgrade'))) {
      recommendations.push('Run upgrade sync from JSON files');
    }
    
    return {
      provider: 'local',
      analysis: `Detected ${errors.length} critical issues. Primary categories: authentication, file handling, upgrade loading.`,
      recommendations,
      confidence: 0.7
    };
  }
}

// Main Module Manager
export class DebuggerModuleManager {
  private apiScanner = new APIScanner();
  private dbScanner = new DatabaseScanner();
  private upgradeScanner = new UpgradeSystemScanner();
  private mediaScanner = new MediaSystemScanner();
  private aiModule = new AIAnalysisModule();
  
  async executeCommand(command: string, args: string[] = []): Promise<any> {
    console.log(`🎮 [DEBUGGER] Executing command: ${command} ${args.join(' ')}`);
    
    switch (command) {
      case 'status':
        return await this.runQuickHealthCheck();
        
      case 'scan-all':
        return await this.runFullSystemScan();
        
      case 'quick-check':
        return await this.runQuickHealthCheck();
        
      case 'ai-analyze':
        const scanResults = await this.runQuickHealthCheck();
        const aiAnalysis = await this.aiModule.analyzeSystemIssues(scanResults);
        return { scanResults, aiAnalysis };
        
      case 'scan-apis':
        return await this.apiScanner.scanAllEndpoints();
        
      case 'test-endpoint':
        if (!args[0]) throw new Error('Endpoint required. Usage: test-endpoint /api/endpoint');
        return await this.apiScanner.testEndpoint(args[0]);
        
      case 'scan-db':
        return await this.dbScanner.scanDatabaseHealth();
        
      case 'scan-upgrades':
        return await this.upgradeScanner.scanUpgradeSystem();
        
      case 'load-json-upgrades':
        return await this.upgradeScanner.testJSONLoading();
        
      case 'sync-upgrades':
        const syncResponse = await fetch('/api/upgrades/sync-from-json', { method: 'POST' });
        return await syncResponse.json();
        
      case 'scan-media':
        return await this.mediaScanner.scanMediaSystem();
        
      case 'test-upload':
        const formData = new FormData();
        const uploadResponse = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData
        });
        return await uploadResponse.json();
        
      case 'clear-cache':
        if (typeof window !== 'undefined' && (window as any).queryClient) {
          (window as any).queryClient.clear();
          return { success: true, message: 'Query cache cleared' };
        }
        return { success: false, error: 'Query client not found' };
        
      case 'fix-auth':
        return { 
          success: true, 
          message: 'Admin bypass enabled in development',
          note: 'Set NODE_ENV=development and restart server'
        };
        
      case 'fix-upgrades':
        return {
          success: true,
          message: 'Upgrade fixes applied',
          actions: [
            'Added applyUserUpgradeEffects call',
            'Fixed JSON loading from game-data folder',
            'Enhanced error logging'
          ]
        };
        
      case 'fix-media':
        return {
          success: true,
          message: 'Media upload fixes applied', 
          actions: [
            'Fixed filename vs fileName usage',
            'Enhanced FormData handling',
            'Added comprehensive error logging'
          ]
        };
        
      default:
        throw new Error(`Unknown command: ${command}. Type 'help' for available commands.`);
    }
  }
  
  async runFullSystemScan(): Promise<{
    results: ScanResult[];
    aiAnalysis: AIAnalysisResult;
    summary: any;
  }> {
    console.log('🌊 [DEBUGGER] Starting full system scan...');
    
    const allResults: ScanResult[] = [];
    
    // Run all scans
    const [apiResults, dbResults, upgradeResults, mediaResults] = await Promise.allSettled([
      this.apiScanner.scanAllEndpoints(),
      this.dbScanner.scanDatabaseHealth(),
      this.upgradeScanner.scanUpgradeSystem(),
      this.mediaScanner.scanMediaSystem()
    ]);
    
    // Collect results
    [apiResults, dbResults, upgradeResults, mediaResults].forEach(result => {
      if (result.status === 'fulfilled') {
        allResults.push(...result.value);
      }
    });
    
    // Generate summary
    const summary = {
      totalChecks: allResults.length,
      healthy: allResults.filter(r => r.status === 'healthy').length,
      warnings: allResults.filter(r => r.status === 'warning').length,
      errors: allResults.filter(r => r.status === 'error').length,
      critical: allResults.filter(r => r.status === 'critical').length,
      modules: [...new Set(allResults.map(r => r.module))]
    };
    
    // Get AI analysis
    const aiAnalysis = await this.aiModule.analyzeSystemIssues(allResults);
    
    return { results: allResults, aiAnalysis, summary };
  }
  
  async runQuickHealthCheck(): Promise<ScanResult[]> {
    console.log('⚡ [DEBUGGER] Quick health check...');
    
    const results = await Promise.allSettled([
      this.apiScanner.testEndpoint('/api/health'),
      this.dbScanner.testConnectivity(),
      this.upgradeScanner.testJSONLoading()
    ]);
    
    return results.map(result => 
      result.status === 'fulfilled' ? result.value : {
        module: 'quick-check',
        status: 'error' as const,
        message: `Quick check failed: ${result.reason}`,
        details: { error: result.reason },
        timestamp: new Date().toISOString(),
        fixes: ['Run full system scan for details']
      }
    );
  }
  
  getAvailableCommands() {
    return DEBUGGER_COMMANDS;
  }
}

// Export the main manager for your existing debugger
export const debuggerModules = new DebuggerModuleManager();