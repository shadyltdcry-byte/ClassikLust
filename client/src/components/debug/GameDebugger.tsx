import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { 
  Bug, 
  Activity, 
  Eye, 
  Settings, 
  Zap, 
  Heart, 
  Target,
  RefreshCw,
  Database,
  Monitor,
  Code
} from 'lucide-react';

// NOTE: The GameDebugger component itself is not defined in this file.
// It's expected to be imported from a hook or another file.
// Based on the error, we're correcting the import path and assumed export name.

interface DebugState {
  // Player State
  playerId: string;
  playerLevel: number;
  playerLP: number;
  playerEnergy: number;
  playerMaxEnergy: number;

  // Game State
  activeTab: string;
  isTapping: boolean;
  selectedCharacter: any;

  // UI State
  showOfflineDialog: boolean;
  showAdminMenu: boolean;
  showWheelGame: boolean;
  showVIP: boolean;

  // Performance
  renderCount: number;
  lastUpdate: number;
  apiCalls: number;
}

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'success' | 'error' | 'info' | 'warning';
  component: string;
  message: string;
  data?: any;
}

interface GameDebuggerProps {
  // State exposure props - components pass their state here
  gameState: DebugState;
  onStateChange?: (newState: Partial<DebugState>) => void;

  // Component refs for direct state access
  componentRefs?: {
    gameGUI?: any;
    playerStats?: any;
    gameTabs?: any;
    tasksPanel?: any;
    achievementsPanel?: any;
  };

  // Real-time monitoring
  isVisible: boolean;
  onToggle: () => void;

  // Real game state for connection
  realGameState?: {
    selectedCharacter: any;
    user: any;
    activePlugin: string;
    isTapping: boolean;
    guiState: any;
    onToggleModal?: (modal: string) => void;
  };
}

export default function GameDebugger({ 
  gameState, 
  onStateChange, 
  componentRefs,
  isVisible, 
  onToggle,
  realGameState 
}: GameDebuggerProps) {
  const [selectedComponent, setSelectedComponent] = useState('player');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshRate, setRefreshRate] = useState(1000);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Color-coded logging system (inspired by your original debugger!)
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [maxLogs, setMaxLogs] = useState(50);

  // Fix any existing logs with duplicate keys on component mount
  useEffect(() => {
    setLogs(prevLogs => {
      if (prevLogs.length === 0) return prevLogs;

      // Check if any logs have duplicate keys
      const hasInvalidKeys = prevLogs.some((log, index) => 
        prevLogs.findIndex(l => l.id === log.id) !== index
      );

      if (hasInvalidKeys) {
        console.log('🔧 Fixing duplicate log keys...');
        return prevLogs.map((log, index) => ({
          ...log,
          id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`
        }));
      }

      return prevLogs;
    });
  }, []);

  // Add log entry with color coding
  const addLog = (type: LogEntry['type'], component: string, message: string, data?: any) => {
    const newLog: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      component,
      message,
      data
    };

    setLogs(prev => {
      const updated = [newLog, ...prev];
      return updated.slice(0, maxLogs); // Keep only recent logs
    });
  };

  // Component lifecycle tracking
  const trackComponentInit = (componentName: string, success: boolean, error?: string) => {
    if (success) {
      addLog('success', componentName, 'Component initialized successfully');
    } else {
      addLog('error', componentName, `Failed to initialize: ${error || 'Unknown error'}`);
    }
  };

  // Removed old command execution - React State Debugger is view-only for safety

  // Real-time state monitoring
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        // Force re-render to show live data
        onStateChange?.({ lastUpdate: Date.now() });
      }, refreshRate);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, refreshRate, onStateChange]);

  // React State Debugger is read-only - no state mutations for stability

  // Component status tracking
  React.useEffect(() => {
    trackComponentInit('GameDebugger', true);
    addLog('info', 'System', 'Debugger started - Real-time monitoring active');
  }, []);

  // Track state changes (reduced logging frequency)
  const lastLogTimeRef = React.useRef(0);
  React.useEffect(() => {
    if (gameState.lastUpdate) {
      // Only log every 30 seconds instead of every 2 seconds to reduce spam
      const now = Date.now();
      if (now - lastLogTimeRef.current > 30000) { // 30 seconds
        addLog('success', 'StateUpdate', 'Game state synchronized');
        lastLogTimeRef.current = now;
      }
    }
  }, [gameState.lastUpdate]);

  if (!isVisible) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-4 left-4 z-[60] bg-green-600 hover:bg-green-700 border-2 border-green-400"
        size="sm"
      >
        <Bug className="w-4 h-4 mr-2" />
        Debug
      </Button>
    );
  }

  return (
    <>
      {/* Floating Debug Panel */}
      <div 
        className="fixed top-4 left-4 w-96 max-h-[80vh] bg-gray-900/95 border border-green-500/50 rounded-lg shadow-2xl backdrop-blur-sm" 
        style={{
          zIndex: 999999,
          isolation: 'isolate',
          pointerEvents: 'auto',
          position: 'fixed'
        }}
      >
        <div className="flex items-center justify-between p-3 border-b border-green-500/30">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-green-400" />
            <h3 className="font-bold text-white text-sm">Live Debugger</h3>
            <Badge variant="outline" className="text-xs border-green-500/50 text-green-400">
              {autoRefresh ? 'LIVE' : 'PAUSED'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Switch 
              checked={autoRefresh} 
              onCheckedChange={setAutoRefresh}
              className="scale-75"
            />
            <Button onClick={onToggle} variant="ghost" size="sm" className="text-gray-400">
              ×
            </Button>
          </div>
        </div>

        <Tabs value={selectedComponent} onValueChange={setSelectedComponent} className="h-full">
          <TabsList className="w-full bg-gray-800/50 p-1 m-2 grid grid-cols-5 gap-1">
            <TabsTrigger 
              value="logs" 
              className="text-xs min-h-[44px] touch-manipulation cursor-pointer select-none"
              style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' }}
            >
              <Code className="w-3 h-3 mr-1" />
              Logs
            </TabsTrigger>
            <TabsTrigger 
              value="player" 
              className="text-xs min-h-[44px] touch-manipulation cursor-pointer select-none"
              style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' }}
            >
              <Heart className="w-3 h-3 mr-1" />
              Player
            </TabsTrigger>
            <TabsTrigger 
              value="game" 
              className="text-xs min-h-[44px] touch-manipulation cursor-pointer select-none"
              style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' }}
            >
              <Activity className="w-3 h-3 mr-1" />
              Game
            </TabsTrigger>
            <TabsTrigger 
              value="api" 
              className="text-xs min-h-[44px] touch-manipulation cursor-pointer select-none"
              style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' }}
            >
              <Database className="w-3 h-3 mr-1" />
              API
            </TabsTrigger>
            <TabsTrigger 
              value="perf" 
              className="text-xs min-h-[44px] touch-manipulation cursor-pointer select-none"
              style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' }}
            >
              <Monitor className="w-3 h-3 mr-1" />
              Perf
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] px-3 pb-3">
            {/* Logs Tab - Color-coded like your original system! */}
            <TabsContent value="logs" className="space-y-3 mt-0">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <Code className="w-4 h-4 text-blue-400" />
                    Color-Coded Logs
                    <Badge className="text-xs bg-gray-700">{logs.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Button 
                      onClick={() => {
                        console.log('🧹 Force clearing all logs...');
                        setLogs([]);
                        // Force re-render to clear any React cache
                        window.location.hash = '#debugger-cleared';
                      }} 
                      size="sm" 
                      variant="outline"
                      className="text-xs h-6"
                    >
                      Clear Logs
                    </Button>
                    <Input
                      type="number"
                      value={maxLogs}
                      onChange={(e) => setMaxLogs(Number(e.target.value))}
                      className="w-16 h-6 text-xs bg-gray-700 border-gray-600"
                      min="10"
                      max="200"
                    />
                  </div>

                  <div className="space-y-1 max-h-80 overflow-y-auto">
                    {logs.map((log) => (
                      <div key={log.id} className="text-xs p-2 rounded border border-gray-600 bg-gray-700/50">
                        <div className="flex items-center gap-2">
                          {/* Color-coded indicator */}
                          <div className={`w-2 h-2 rounded-full ${
                            log.type === 'success' ? 'bg-green-400' :
                            log.type === 'error' ? 'bg-red-400' :
                            log.type === 'warning' ? 'bg-yellow-400' :
                            'bg-blue-400'
                          }`} />

                          {/* Timestamp */}
                          <span className="text-gray-400 text-xs">{log.timestamp}</span>

                          {/* Component name */}
                          <Badge className={`text-xs px-1 py-0 ${
                            log.type === 'success' ? 'bg-green-600/20 text-green-300 border-green-500/50' :
                            log.type === 'error' ? 'bg-red-600/20 text-red-300 border-red-500/50' :
                            log.type === 'warning' ? 'bg-yellow-600/20 text-yellow-300 border-yellow-500/50' :
                            'bg-blue-600/20 text-blue-300 border-blue-500/50'
                          }`}>
                            {log.component}
                          </Badge>
                        </div>

                        {/* Message */}
                        <div className={`mt-1 ${
                          log.type === 'success' ? 'text-green-300' :
                          log.type === 'error' ? 'text-red-300' :
                          log.type === 'warning' ? 'text-yellow-300' :
                          'text-blue-300'
                        }`}>
                          {log.message}
                        </div>

                        {/* Data */}
                        {log.data && (
                          <pre className="text-xs text-gray-400 mt-1 whitespace-pre-wrap">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}

                    {logs.length === 0 && (
                      <div className="text-center text-gray-400 py-4">
                        No logs yet. Interact with the game to see activity.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Player State Tab */}
            <TabsContent value="player" className="space-y-3 mt-0">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-400" />
                    Player State
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  {/* Live LP Display */}
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Lust Points:</Label>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-pink-600/20 text-pink-300 border-pink-500/50">
                        {Math.floor(gameState.playerLP || 0).toLocaleString() || 'Loading...'}
                      </Badge>
                      <Input
                        type="number"
                        value={gameState.playerLP || 0}
                        readOnly
                        className="w-20 h-6 text-xs bg-gray-800 border-gray-600 text-gray-400"
                      />
                    </div>
                  </div>

                  {/* Live Energy Display */}
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Energy:</Label>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/50">
                        {gameState.playerEnergy || 0}/{gameState.playerMaxEnergy || 1000}
                      </Badge>
                      <Input
                        type="number"
                        value={gameState.playerEnergy || 0}
                        readOnly
                        className="w-20 h-6 text-xs bg-gray-800 border-gray-600 text-gray-400"
                      />
                    </div>
                  </div>

                  {/* Live Level Display */}
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Level:</Label>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-600/20 text-yellow-300 border-yellow-500/50">
                        {gameState.playerLevel || 1}
                      </Badge>
                      <Input
                        type="number"
                        value={gameState.playerLevel || 1}
                        readOnly
                        className="w-20 h-6 text-xs bg-gray-800 border-gray-600 text-gray-400"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Game State Tab */}
            <TabsContent value="game" className="space-y-3 mt-0">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-400" />
                    Game State
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  {/* Active Tab */}
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Active Tab:</Label>
                    <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/50">
                      {realGameState?.activePlugin || gameState.activeTab || 'main'}
                    </Badge>
                  </div>

                  {/* Tapping State */}
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Is Tapping:</Label>
                    <Badge className={`${(realGameState?.isTapping || gameState.isTapping) ? 'bg-green-600/20 text-green-300 border-green-500/50' : 'bg-gray-600/20 text-gray-300 border-gray-500/50'}`}>
                      {(realGameState?.isTapping || gameState.isTapping) ? 'YES' : 'NO'}
                    </Badge>
                  </div>

                  {/* Selected Character */}
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Character:</Label>
                    <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/50">
                      {realGameState?.selectedCharacter?.name || gameState.selectedCharacter?.name || 'None'}
                    </Badge>
                  </div>

                  {/* Player Info */}
                  <div className="space-y-1">
                    <Label className="text-gray-300">Player Info:</Label>
                    <div className="text-xs text-gray-400">
                      LP: {realGameState?.user?.lp || gameState.playerLP || 0} | 
                      Energy: {realGameState?.user?.energy || gameState.playerEnergy || 0}
                    </div>
                  </div>

                  {/* Modal States */}
                  <div className="space-y-2">
                    <Label className="text-gray-300 text-xs">Open Modals:</Label>
                    <div className="grid grid-cols-2 gap-1">
                      <Button 
                        size="sm" 
                        variant={realGameState?.guiState?.showOfflineDialog ? "default" : "outline"}
                        className={`text-xs h-6 ${realGameState?.guiState?.showOfflineDialog ? 'bg-blue-600' : ''}`}
                        onClick={() => realGameState?.onToggleModal?.('offline')}
                        disabled={!realGameState?.onToggleModal}
                      >
                        Offline
                      </Button>
                      <Button 
                        size="sm" 
                        variant={realGameState?.guiState?.showAdminMenu ? "default" : "outline"}
                        className={`text-xs h-6 ${realGameState?.guiState?.showAdminMenu ? 'bg-purple-600' : ''}`}
                        onClick={() => realGameState?.onToggleModal?.('admin')}
                        disabled={!realGameState?.onToggleModal}
                      >
                        Admin
                      </Button>
                      <Button 
                        size="sm" 
                        variant={realGameState?.guiState?.showWheelGame ? "default" : "outline"}
                        className={`text-xs h-6 ${realGameState?.guiState?.showWheelGame ? 'bg-yellow-600' : ''}`}
                        onClick={() => realGameState?.onToggleModal?.('wheel')}
                        disabled={!realGameState?.onToggleModal}
                      >
                        Wheel
                      </Button>
                      <Button 
                        size="sm" 
                        variant={realGameState?.guiState?.showVIP ? "default" : "outline"}
                        className={`text-xs h-6 ${realGameState?.guiState?.showVIP ? 'bg-pink-600' : ''}`}
                        onClick={() => realGameState?.onToggleModal?.('vip')}
                        disabled={!realGameState?.onToggleModal}
                      >
                        VIP
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Monitoring Tab */}
            <TabsContent value="api" className="space-y-3 mt-0">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-400" />
                    API Monitor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">API Calls:</Label>
                    <Badge className="bg-green-600/20 text-green-300 border-green-500/50">
                      {gameState.apiCalls || 0}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Status:</Label>
                    <Badge className="bg-green-600/20 text-green-300 border-green-500/50">
                      Active
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Logs:</Label>
                    <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/50">
                      {logs.filter(l => l.component.includes('API')).length}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Last Update:</Label>
                    <Badge className="bg-gray-600/20 text-gray-300 border-gray-500/50">
                      {gameState.lastUpdate ? new Date(gameState.lastUpdate).toLocaleTimeString() : 'Never'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="perf" className="space-y-3 mt-0">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-yellow-400" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Render Count:</Label>
                    <Badge className="bg-yellow-600/20 text-yellow-300 border-yellow-500/50">
                      {gameState.renderCount || 0}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Refresh Rate:</Label>
                    <Input
                      type="number"
                      value={refreshRate}
                      onChange={(e) => setRefreshRate(Number(e.target.value))}
                      className="w-20 h-6 text-xs bg-gray-700 border-gray-600"
                      min="100"
                      max="5000"
                      step="100"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>

          {/* React State Debugger - Read Only Monitoring */}
          <div className="p-3 border-t border-gray-700">
            <div className="text-center text-xs text-gray-400">
              🔍 React State Debugger - View Only
              <br />
              Real-time monitoring without state mutations
            </div>
          </div>
        </Tabs>
      </div>
    </>
  );
}