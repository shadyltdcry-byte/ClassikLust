import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Eye, EyeOff, RotateCcw, LogOut } from 'lucide-react';

interface SessionDebugOverlayProps {
  userId: string | null;
  authSource: 'telegram' | 'supabase' | 'guest' | null;
  sessionAge: number;
  lastLoginMethod: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  onLogout: () => void;
}

export default function SessionDebugOverlay({
  userId,
  authSource,
  sessionAge,
  lastLoginMethod,
  isAuthenticated,
  isLoading,
  error,
  onLogout
}: SessionDebugOverlayProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  // Only show in development
  if (!import.meta.env.DEV) return null;

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        className="fixed top-4 right-4 z-50 bg-gray-800 hover:bg-gray-700 text-white p-2"
        size="sm"
        data-testid="debug-show-button"
      >
        <Eye className="w-4 h-4" />
      </Button>
    );
  }

  const getAuthSourceColor = () => {
    switch (authSource) {
      case 'telegram': return 'bg-blue-500';
      case 'supabase': return 'bg-green-500';
      case 'guest': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = () => {
    if (isLoading) return 'bg-orange-500';
    if (error) return 'bg-red-500';
    if (isAuthenticated) return 'bg-green-500';
    return 'bg-gray-500';
  };

  const formatSessionAge = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const clearAllStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <Card className="fixed top-4 right-4 z-50 w-80 bg-gray-900 border-gray-700 text-white shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            🛠️ Session Debug
            <Badge 
              className={`${getStatusColor()} text-white text-xs`}
              data-testid="debug-status-badge"
            >
              {isLoading ? 'Loading' : error ? 'Error' : isAuthenticated ? 'Auth' : 'None'}
            </Badge>
          </span>
          <div className="flex gap-1">
            <Button
              onClick={() => setIsMinimized(!isMinimized)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-gray-700 p-1"
              data-testid="debug-minimize-button"
            >
              {isMinimized ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </Button>
            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-gray-700 p-1"
              data-testid="debug-close-button"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="space-y-3 text-xs">
          {/* User ID */}
          <div className="flex justify-between">
            <span className="text-gray-400">User ID:</span>
            <span 
              className="font-mono text-white truncate max-w-32"
              title={userId || 'None'}
              data-testid="debug-user-id"
            >
              {userId || 'None'}
            </span>
          </div>

          {/* Auth Source */}
          <div className="flex justify-between">
            <span className="text-gray-400">Auth Source:</span>
            <Badge 
              className={`${getAuthSourceColor()} text-white text-xs`}
              data-testid="debug-auth-source"
            >
              {authSource || 'None'}
            </Badge>
          </div>

          {/* Session Age */}
          <div className="flex justify-between">
            <span className="text-gray-400">Session Age:</span>
            <span 
              className="text-white"
              data-testid="debug-session-age"
            >
              {formatSessionAge(sessionAge)}
            </span>
          </div>

          {/* Last Login Method */}
          <div className="flex justify-between">
            <span className="text-gray-400">Login Method:</span>
            <span 
              className="text-white font-mono text-xs"
              data-testid="debug-login-method"
            >
              {lastLoginMethod}
            </span>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded p-2">
              <div className="text-red-300 text-xs break-words" data-testid="debug-error">
                {error}
              </div>
            </div>
          )}

          {/* Storage Info */}
          <div className="border-t border-gray-700 pt-2 space-y-1">
            <div className="text-gray-400 text-xs">LocalStorage:</div>
            {['telegramAuthToken', 'telegramUserId', 'guestUserId'].map(key => {
              const value = localStorage.getItem(key);
              return (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-gray-500">{key.replace('telegram_', '')}:</span>
                  <span className="text-gray-300 font-mono text-xs">
                    {value ? '✓' : '✗'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-gray-700">
            <Button
              onClick={onLogout}
              variant="destructive"
              size="sm"
              className="flex-1 text-xs h-7"
              data-testid="debug-logout-button"
            >
              <LogOut className="w-3 h-3 mr-1" />
              Logout
            </Button>
            <Button
              onClick={clearAllStorage}
              variant="outline"
              size="sm"
              className="flex-1 text-xs h-7 border-gray-600 text-gray-300 hover:bg-gray-700"
              data-testid="debug-clear-storage-button"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Clear
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}