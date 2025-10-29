import React, { useState, useEffect } from 'react';
import { AlertCircle, Bug, Zap, RefreshCw } from 'lucide-react';

interface ErrorLoggerProps {
  isVisible: boolean;
}

interface ErrorEntry {
  id: string;
  timestamp: string;
  type: 'api-error' | 'console-error' | 'network-error' | 'component-error';
  message: string;
  details: any;
  endpoint?: string;
  status?: number;
}

export default function ErrorLogger({ isVisible }: ErrorLoggerProps) {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (isVisible && !isMonitoring) {
      startErrorMonitoring();
    }
  }, [isVisible, isMonitoring]);

  const startErrorMonitoring = () => {
    console.log('🔍 [ERROR-LOGGER] Starting comprehensive error monitoring...');
    setIsMonitoring(true);

    // Intercept console errors
    const originalError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      addError({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: 'console-error',
        message,
        details: args
      });
      originalError.apply(console, args);
    };

    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch.apply(window, args);
        
        // Log failed API calls
        if (!response.ok) {
          const url = typeof args[0] === 'string' ? args[0] : args[0].url;
          const errorBody = await response.clone().text();
          
          addError({
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            type: 'api-error',
            message: `API Error: ${response.status} ${response.statusText}`,
            details: {
              url,
              status: response.status,
              statusText: response.statusText,
              responseBody: errorBody,
              requestArgs: args
            },
            endpoint: url,
            status: response.status
          });
        }
        
        return response;
      } catch (error) {
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || 'unknown';
        
        addError({
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          type: 'network-error',
          message: `Network Error: ${error.message}`,
          details: {
            url,
            error: error.message,
            stack: error.stack,
            requestArgs: args
          },
          endpoint: url
        });
        
        throw error;
      }
    };

    // Intercept unhandled rejections
    window.addEventListener('unhandledrejection', (event) => {
      addError({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: 'component-error',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        details: {
          reason: event.reason,
          promise: event.promise
        }
      });
    });

    console.log('✅ [ERROR-LOGGER] Error monitoring active');
  };

  const addError = (error: ErrorEntry) => {
    console.log(`🚨 [ERROR-LOGGER] New error detected:`, error);
    setErrors(prev => [error, ...prev].slice(0, 50)); // Keep last 50 errors
  };

  const clearErrors = () => {
    setErrors([]);
    console.log('🧽 [ERROR-LOGGER] Error log cleared');
  };

  const getErrorIcon = (type: ErrorEntry['type']) => {
    switch (type) {
      case 'api-error': return <Zap className="w-4 h-4 text-red-400" />;
      case 'network-error': return <RefreshCw className="w-4 h-4 text-orange-400" />;
      case 'console-error': return <Bug className="w-4 h-4 text-yellow-400" />;
      default: return <AlertCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getErrorColor = (type: ErrorEntry['type']) => {
    switch (type) {
      case 'api-error': return 'border-red-500 bg-red-900/20';
      case 'network-error': return 'border-orange-500 bg-orange-900/20';
      case 'console-error': return 'border-yellow-500 bg-yellow-900/20';
      default: return 'border-red-500 bg-red-900/20';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-bold text-white">Live Error Monitor</h3>
          <span className={`px-2 py-1 rounded text-xs font-bold ${
            isMonitoring ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
          }`}>
            {isMonitoring ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{errors.length} errors logged</span>
          <button
            onClick={clearErrors}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white"
          >
            Clear
          </button>
        </div>
      </div>

      {errors.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Bug className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No errors detected yet</p>
          <p className="text-xs mt-1">Monitoring all API calls, console logs, and network requests...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div key={error.id} className={`border rounded-lg p-3 ${getErrorColor(error.type)}`}>
              <div className="flex items-start gap-2">
                {getErrorIcon(error.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono bg-gray-800 px-2 py-1 rounded text-gray-300">
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded font-bold ${
                      error.type === 'api-error' ? 'bg-red-500/20 text-red-300' :
                      error.type === 'network-error' ? 'bg-orange-500/20 text-orange-300' :
                      'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {error.type.toUpperCase()}
                    </span>
                    {error.endpoint && (
                      <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded font-mono">
                        {error.endpoint}
                      </span>
                    )}
                    {error.status && (
                      <span className={`text-xs px-2 py-1 rounded font-bold ${
                        error.status >= 400 && error.status < 500 ? 'bg-orange-500/20 text-orange-300' :
                        error.status >= 500 ? 'bg-red-500/20 text-red-300' :
                        'bg-green-500/20 text-green-300'
                      }`}>
                        {error.status}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-white text-sm font-medium mb-2">{error.message}</p>
                  
                  {error.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                        Show Details
                      </summary>
                      <pre className="text-xs bg-gray-800/50 p-2 rounded mt-1 overflow-x-auto text-gray-300">
                        {JSON.stringify(error.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}