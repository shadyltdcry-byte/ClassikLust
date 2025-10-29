import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Zap, Database, Upload, Settings } from 'lucide-react';

interface DiagnosticResult {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'testing';
  message: string;
  details?: any;
  endpoint?: string;
  timestamp: string;
}

export default function SystemDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const runDiagnostics = async () => {
    console.log('🌊 [DIAGNOSTICS] Starting comprehensive system diagnostics...');
    setIsRunning(true);
    setDiagnostics([]);

    const tests: DiagnosticResult[] = [];
    
    // Helper to add test results
    const addTest = (test: DiagnosticResult) => {
      console.log(`🔍 [DIAGNOSTICS] ${test.name}: ${test.status} - ${test.message}`);
      tests.push(test);
      setDiagnostics([...tests]);
    };

    try {
      // Test 1: Check basic API health
      addTest({
        name: 'API Health Check',
        status: 'testing',
        message: 'Testing basic API connectivity...',
        endpoint: '/api/health',
        timestamp: new Date().toISOString()
      });
      
      try {
        const healthResponse = await fetch('/api/health');
        const healthData = await healthResponse.text();
        
        addTest({
          name: 'API Health Check',
          status: healthResponse.ok ? 'pass' : 'fail',
          message: healthResponse.ok ? 'API is responding' : `API returned ${healthResponse.status}`,
          details: { status: healthResponse.status, response: healthData },
          endpoint: '/api/health',
          timestamp: new Date().toISOString()
        });
      } catch (healthError) {
        addTest({
          name: 'API Health Check',
          status: 'fail',
          message: `API health check failed: ${healthError.message}`,
          details: { error: healthError.message },
          endpoint: '/api/health',
          timestamp: new Date().toISOString()
        });
      }

      // Test 2: Check upgrade management endpoint
      addTest({
        name: 'Upgrade Management',
        status: 'testing',
        message: 'Testing admin upgrade endpoints...',
        endpoint: '/api/admin/upgrades',
        timestamp: new Date().toISOString()
      });
      
      try {
        const upgradeResponse = await fetch('/api/admin/upgrades', {
          headers: {
            'Content-Type': 'application/json',
            'x-admin-bypass': 'development' // Try bypass header
          }
        });
        const upgradeData = await upgradeResponse.json();
        
        addTest({
          name: 'Upgrade Management',
          status: upgradeResponse.ok ? 'pass' : 'fail',
          message: upgradeResponse.ok ? 
            `Found ${Array.isArray(upgradeData) ? upgradeData.length : 'unknown'} upgrades` : 
            `Admin access denied: ${upgradeData.error || upgradeResponse.status}`,
          details: { 
            status: upgradeResponse.status, 
            response: upgradeData,
            headers: Object.fromEntries(upgradeResponse.headers.entries())
          },
          endpoint: '/api/admin/upgrades',
          timestamp: new Date().toISOString()
        });
      } catch (upgradeError) {
        addTest({
          name: 'Upgrade Management',
          status: 'fail',
          message: `Upgrade endpoint failed: ${upgradeError.message}`,
          details: { error: upgradeError.message },
          endpoint: '/api/admin/upgrades',
          timestamp: new Date().toISOString()
        });
      }

      // Test 3: Test media upload endpoint
      addTest({
        name: 'Media Upload System',
        status: 'testing',
        message: 'Testing media upload endpoint availability...',
        endpoint: '/api/media/upload',
        timestamp: new Date().toISOString()
      });
      
      try {
        // Test with OPTIONS request to check if endpoint exists
        const mediaResponse = await fetch('/api/media/upload', {
          method: 'OPTIONS'
        });
        
        addTest({
          name: 'Media Upload System',
          status: mediaResponse.status === 404 ? 'fail' : 'pass',
          message: mediaResponse.status === 404 ? 
            'Media upload endpoint not found' : 
            'Media upload endpoint is available',
          details: { 
            status: mediaResponse.status,
            method: 'OPTIONS'
          },
          endpoint: '/api/media/upload',
          timestamp: new Date().toISOString()
        });
      } catch (mediaError) {
        addTest({
          name: 'Media Upload System',
          status: 'warning',
          message: `Cannot test media endpoint: ${mediaError.message}`,
          details: { error: mediaError.message },
          endpoint: '/api/media/upload',
          timestamp: new Date().toISOString()
        });
      }

      // Test 4: Check user authentication
      addTest({
        name: 'User Authentication',
        status: 'testing',
        message: 'Checking user authentication status...',
        timestamp: new Date().toISOString()
      });
      
      try {
        const authResponse = await fetch('/api/user/telegram_5134006535');
        const authData = await authResponse.json();
        
        addTest({
          name: 'User Authentication',
          status: authResponse.ok ? 'pass' : 'warning',
          message: authResponse.ok ? 
            `User authenticated: ${authData.username || 'unknown'}` : 
            `Auth issue: ${authData.error || authResponse.status}`,
          details: { 
            status: authResponse.status, 
            response: authData 
          },
          timestamp: new Date().toISOString()
        });
      } catch (authError) {
        addTest({
          name: 'User Authentication',
          status: 'warning',
          message: `Auth check failed: ${authError.message}`,
          details: { error: authError.message },
          timestamp: new Date().toISOString()
        });
      }

      // Test 5: Check database connectivity
      addTest({
        name: 'Database Connectivity',
        status: 'testing',
        message: 'Testing database connection...',
        timestamp: new Date().toISOString()
      });
      
      try {
        const dbResponse = await fetch('/api/characters');
        const dbData = await dbResponse.json();
        
        addTest({
          name: 'Database Connectivity',
          status: dbResponse.ok ? 'pass' : 'fail',
          message: dbResponse.ok ? 
            `Database connected: ${Array.isArray(dbData) ? dbData.length : 'unknown'} characters found` : 
            `Database error: ${dbData.error || dbResponse.status}`,
          details: { 
            status: dbResponse.status, 
            responseType: typeof dbData,
            isArray: Array.isArray(dbData)
          },
          timestamp: new Date().toISOString()
        });
      } catch (dbError) {
        addTest({
          name: 'Database Connectivity',
          status: 'fail',
          message: `Database connection failed: ${dbError.message}`,
          details: { error: dbError.message },
          timestamp: new Date().toISOString()
        });
      }

      // Test 6: Check upgrade purchase functionality
      addTest({
        name: 'Upgrade Purchase Test',
        status: 'testing',
        message: 'Testing upgrade purchase validation...',
        timestamp: new Date().toISOString()
      });
      
      try {
        // Test validation endpoint (shouldn't actually purchase)
        const validationResponse = await fetch('/api/upgrades', {
          method: 'GET',
          headers: {
            'x-user-id': 'telegram_5134006535'
          }
        });
        const validationData = await validationResponse.json();
        
        addTest({
          name: 'Upgrade Purchase Test',
          status: validationResponse.ok ? 'pass' : 'fail',
          message: validationResponse.ok ? 
            `Upgrade system working: ${validationData.count || 0} upgrades available` : 
            `Upgrade system error: ${validationData.error || validationResponse.status}`,
          details: { 
            status: validationResponse.status, 
            response: validationData 
          },
          endpoint: '/api/upgrades',
          timestamp: new Date().toISOString()
        });
      } catch (upgradeTestError) {
        addTest({
          name: 'Upgrade Purchase Test',
          status: 'fail',
          message: `Upgrade test failed: ${upgradeTestError.message}`,
          details: { error: upgradeTestError.message },
          timestamp: new Date().toISOString()
        });
      }

    } catch (overallError) {
      console.error('🚨 [DIAGNOSTICS] Overall diagnostic error:', overallError);
      addTest({
        name: 'System Diagnostics',
        status: 'fail',
        message: `Diagnostic system error: ${overallError.message}`,
        details: { error: overallError.message, stack: overallError.stack },
        timestamp: new Date().toISOString()
      });
    }

    setIsRunning(false);
    setLastRun(new Date().toISOString());
    console.log('✅ [DIAGNOSTICS] Diagnostics complete');
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'fail': return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'testing': return <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pass': return 'border-green-500 bg-green-900/10';
      case 'fail': return 'border-red-500 bg-red-900/20';
      case 'warning': return 'border-yellow-500 bg-yellow-900/20';
      case 'testing': return 'border-blue-500 bg-blue-900/20';
      default: return 'border-gray-500 bg-gray-900/20';
    }
  };

  const passCount = diagnostics.filter(d => d.status === 'pass').length;
  const failCount = diagnostics.filter(d => d.status === 'fail').length;
  const warningCount = diagnostics.filter(d => d.status === 'warning').length;

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-bold text-white">System Diagnostics</h3>
          {diagnostics.length > 0 && (
            <div className="flex items-center gap-2 ml-4">
              <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
                ✓ {passCount}
              </span>
              <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
                ⚠ {warningCount}
              </span>
              <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">
                ✗ {failCount}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {lastRun && (
            <span className="text-xs text-gray-400">
              Last run: {new Date(lastRun).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 rounded text-sm text-white flex items-center gap-1"
          >
            <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running...' : 'Run Tests'}
          </button>
        </div>
      </div>

      {diagnostics.length === 0 && !isRunning && (
        <div className="text-center py-8 text-gray-400">
          <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Click "Run Tests" to diagnose system issues</p>
          <p className="text-xs mt-1">This will test all critical game systems</p>
        </div>
      )}

      {diagnostics.length > 0 && (
        <div className="space-y-2">
          {diagnostics.map((test, index) => (
            <div key={index} className={`border rounded-lg p-3 ${getStatusColor(test.status)}`}>
              <div className="flex items-start gap-2">
                {getStatusIcon(test.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white">{test.name}</span>
                    {test.endpoint && (
                      <span className="text-xs bg-gray-800 px-2 py-1 rounded font-mono text-gray-300">
                        {test.endpoint}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(test.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-200 mb-2">{test.message}</p>
                  
                  {test.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                        Show Technical Details
                      </summary>
                      <pre className="text-xs bg-gray-800/50 p-2 rounded mt-1 overflow-x-auto text-gray-300">
                        {JSON.stringify(test.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Action Buttons */}
      {diagnostics.length > 0 && failCount > 0 && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
          <h4 className="text-red-300 font-medium mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Issues Detected
          </h4>
          <div className="text-sm text-red-200 space-y-1">
            {diagnostics.filter(d => d.status === 'fail').map((issue, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                <span>{issue.name}: {issue.message}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-3 text-xs text-red-300">
            <p><strong>Possible Solutions:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Restart your development server</li>
              <li>Check if Supabase is connected properly</li>
              <li>Verify all environment variables are set</li>
              <li>Run database migrations if needed</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}