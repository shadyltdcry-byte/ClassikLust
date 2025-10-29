import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, RefreshCw, Bug, Database, Upload, Settings, Zap, FileText } from 'lucide-react';
import SystemDiagnostics from './SystemDiagnostics';
import ErrorLogger from './ErrorLogger';

interface DebugTest {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'testing' | 'pending';
  message: string;
  details?: any;
  timestamp: string;
}

export default function ComprehensiveDebugPanel() {
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'errors' | 'tests'>('tests');
  const [tests, setTests] = useState<DebugTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runAllTests = async () => {
    setIsRunning(true);
    setTests([]);
    
    console.log('🚀 [COMPREHENSIVE-DEBUG] Starting all tests...');
    
    const testResults: DebugTest[] = [];
    
    const addTest = (test: DebugTest) => {
      testResults.push(test);
      setTests([...testResults]);
      console.log(`🔍 [TEST] ${test.name}: ${test.status} - ${test.message}`);
    };

    // TEST 1: Load upgrades from JSON files
    addTest({
      id: 'json-upgrades',
      name: 'JSON Upgrade Loading',
      status: 'testing',
      message: 'Loading upgrade definitions from JSON files...',
      timestamp: new Date().toISOString()
    });
    
    try {
      const jsonResponse = await fetch('/api/upgrades/definitions');
      const jsonData = await jsonResponse.json();
      
      addTest({
        id: 'json-upgrades',
        name: 'JSON Upgrade Loading',
        status: jsonResponse.ok ? 'pass' : 'fail',
        message: jsonResponse.ok ? 
          `Loaded ${jsonData.count || 0} upgrades from JSON files` : 
          `Failed to load JSON upgrades: ${jsonData.error}`,
        details: jsonData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      addTest({
        id: 'json-upgrades',
        name: 'JSON Upgrade Loading',
        status: 'fail',
        message: `JSON loading error: ${error.message}`,
        details: { error: error.message },
        timestamp: new Date().toISOString()
      });
    }

    // TEST 2: Admin authentication
    addTest({
      id: 'admin-auth',
      name: 'Admin Authentication',
      status: 'testing',
      message: 'Testing admin access...',
      timestamp: new Date().toISOString()
    });
    
    try {
      const adminResponse = await fetch('/api/admin/upgrades', {
        headers: {
          'x-admin-bypass': 'development'
        }
      });
      const adminData = await adminResponse.json();
      
      addTest({
        id: 'admin-auth',
        name: 'Admin Authentication',
        status: adminResponse.ok ? 'pass' : 'fail',
        message: adminResponse.ok ? 
          'Admin access granted' : 
          `Admin access denied: ${adminData.error || adminResponse.status}`,
        details: {
          status: adminResponse.status,
          response: adminData,
          bypassHeaderSent: true
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      addTest({
        id: 'admin-auth',
        name: 'Admin Authentication',
        status: 'fail',
        message: `Admin auth test failed: ${error.message}`,
        details: { error: error.message },
        timestamp: new Date().toISOString()
      });
    }

    // TEST 3: Media upload endpoint
    addTest({
      id: 'media-upload',
      name: 'Media Upload Endpoint',
      status: 'testing',
      message: 'Testing media upload availability...',
      timestamp: new Date().toISOString()
    });
    
    try {
      const mediaResponse = await fetch('/api/media/upload', {
        method: 'POST',
        body: new FormData() // Empty form to test endpoint
      });
      const mediaData = await mediaResponse.json();
      
      addTest({
        id: 'media-upload',
        name: 'Media Upload Endpoint',
        status: mediaResponse.status === 400 ? 'pass' : 'fail', // 400 means it's working but needs files
        message: mediaResponse.status === 400 ? 
          'Media endpoint working (correctly rejected empty upload)' : 
          `Media endpoint issue: ${mediaData.error || mediaResponse.status}`,
        details: {
          status: mediaResponse.status,
          response: mediaData
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      addTest({
        id: 'media-upload',
        name: 'Media Upload Endpoint',
        status: 'fail',
        message: `Media upload test failed: ${error.message}`,
        details: { error: error.message },
        timestamp: new Date().toISOString()
      });
    }

    // TEST 4: User data retrieval
    addTest({
      id: 'user-data',
      name: 'User Data Retrieval',
      status: 'testing',
      message: 'Testing user data access...',
      timestamp: new Date().toISOString()
    });
    
    try {
      const userResponse = await fetch('/api/user/telegram_5134006535');
      const userData = await userResponse.json();
      
      addTest({
        id: 'user-data',
        name: 'User Data Retrieval', 
        status: userResponse.ok ? 'pass' : 'warning',
        message: userResponse.ok ? 
          `User data loaded: ${userData.username} (LP: ${userData.lp})` : 
          `User data issue: ${userData.error || userResponse.status}`,
        details: userData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      addTest({
        id: 'user-data',
        name: 'User Data Retrieval',
        status: 'fail',
        message: `User data test failed: ${error.message}`,
        details: { error: error.message },
        timestamp: new Date().toISOString()
      });
    }

    // TEST 5: Upgrade purchase simulation (dry run)
    addTest({
      id: 'upgrade-purchase',
      name: 'Upgrade Purchase System',
      status: 'testing',
      message: 'Testing upgrade purchase endpoint...',
      timestamp: new Date().toISOString()
    });
    
    try {
      // Test with invalid data to see error handling
      const purchaseResponse = await fetch('/api/upgrades/energy-tank/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: 'telegram_5134006535',
          testMode: true // Add this to prevent actual purchase
        })
      });
      const purchaseData = await purchaseResponse.json();
      
      addTest({
        id: 'upgrade-purchase',
        name: 'Upgrade Purchase System',
        status: purchaseResponse.ok || purchaseResponse.status === 400 ? 'pass' : 'fail',
        message: purchaseResponse.ok ? 
          'Purchase system working' : 
          `Purchase system response: ${purchaseData.error || purchaseResponse.status}`,
        details: {
          status: purchaseResponse.status,
          response: purchaseData
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      addTest({
        id: 'upgrade-purchase',
        name: 'Upgrade Purchase System',
        status: 'fail',
        message: `Purchase test failed: ${error.message}`,
        details: { error: error.message },
        timestamp: new Date().toISOString()
      });
    }

    setIsRunning(false);
    console.log('✅ [COMPREHENSIVE-DEBUG] All tests complete');
  };

  const getStatusIcon = (status: DebugTest['status']) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'fail': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'testing': return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
      default: return <Settings className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: DebugTest['status']) => {
    switch (status) {
      case 'pass': return 'border-green-500 bg-green-900/20';
      case 'fail': return 'border-red-500 bg-red-900/20';
      case 'warning': return 'border-yellow-500 bg-yellow-900/20';
      case 'testing': return 'border-blue-500 bg-blue-900/20';
      default: return 'border-gray-500 bg-gray-900/20';
    }
  };

  const passCount = tests.filter(t => t.status === 'pass').length;
  const failCount = tests.filter(t => t.status === 'fail').length;
  const warningCount = tests.filter(t => t.status === 'warning').length;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Comprehensive Debug Panel</h2>
            {tests.length > 0 && (
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
          
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 rounded text-white flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Testing...' : 'Run All Tests'}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-4 bg-gray-800/50 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'tests'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            System Tests
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'diagnostics'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Database className="w-4 h-4" />
            Diagnostics
          </button>
          <button
            onClick={() => setActiveTab('errors')}
            className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'errors'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            Live Errors
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'tests' && (
          <div>
            {tests.length === 0 && !isRunning ? (
              <div className="text-center py-8 text-gray-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No tests run yet</p>
                <p className="text-xs mt-1">Click "Run All Tests" to start comprehensive system testing</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tests.map((test) => (
                  <div key={test.id} className={`border rounded-lg p-4 ${getStatusColor(test.status)}`}>
                    <div className="flex items-start gap-3">
                      {getStatusIcon(test.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-white">{test.name}</span>
                          <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300">
                            {new Date(test.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-200 mb-2">{test.message}</p>
                        
                        {test.details && (
                          <details className="mt-2">
                            <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">
                              View Technical Details
                            </summary>
                            <div className="mt-2 bg-gray-800/50 p-3 rounded border border-gray-700">
                              <pre className="text-xs text-gray-300 whitespace-pre-wrap overflow-x-auto">
                                {JSON.stringify(test.details, null, 2)}
                              </pre>
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'diagnostics' && (
          <SystemDiagnostics />
        )}

        {activeTab === 'errors' && (
          <ErrorLogger isVisible={true} />
        )}

        {/* Quick Actions */}
        {tests.length > 0 && failCount > 0 && (
          <div className="mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <h3 className="text-red-300 font-bold mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Critical Issues Found
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tests.filter(t => t.status === 'fail').map((issue) => (
                <div key={issue.id} className="bg-red-900/30 p-3 rounded border border-red-500/50">
                  <h4 className="text-red-200 font-medium mb-1">{issue.name}</h4>
                  <p className="text-red-300 text-sm">{issue.message}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-gray-800/50 rounded border border-gray-600">
              <h4 className="text-white font-medium mb-2">Recommended Actions:</h4>
              <div className="text-sm text-gray-300 space-y-1">
                <p>• Run: <code className="bg-gray-700 px-1 rounded">git pull origin main</code> to get latest fixes</p>
                <p>• Run: <code className="bg-gray-700 px-1 rounded">npm install</code> to update dependencies</p>
                <p>• Execute: <code className="bg-gray-700 px-1 rounded">database-migrations/fix-duplicate-upgrades.sql</code></p>
                <p>• Restart server: <code className="bg-gray-700 px-1 rounded">npm run dev</code></p>
                <p>• Set environment: <code className="bg-gray-700 px-1 rounded">NODE_ENV=development</code></p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}