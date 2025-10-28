import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Terminal, Bug, Code, Activity, Monitor } from "lucide-react";
import useGameDebugger, { GameDebugger } from "@/hooks/useGameDebugger";
import DebuggerConsole from "@/components/debug/DebuggerConsole";

// Backend Debugger Component
const AdminBackendDebugger = ({ gameDebugger }: { gameDebugger: any }) => {
  const [commandInput, setCommandInput] = useState("");
  const [commandOutput, setCommandOutput] = useState("");

  const runCommand = async () => {
    if (!commandInput.trim()) {
      setCommandOutput("Please enter a command.");
      return;
    }

    setCommandOutput("Executing command...");

    try {
      // Real backend debugging commands
      switch (commandInput.toLowerCase().trim()) {
        case 'status':
          const healthResponse = await fetch('/api/health');
          const healthData = await healthResponse.json();
          setCommandOutput(`🚀 SERVER STATUS:\n${JSON.stringify(healthData, null, 2)}`);
          break;

        case 'stats':
          const userResponse = await fetch('/api/user/telegram_8276164651');
          const userData = await userResponse.json();
          setCommandOutput(`📊 USER STATS:\nLP: ${userData.lp}\nEnergy: ${userData.energy}\nLevel: ${userData.level || 1}`);
          break;

        case 'performance':
          setCommandOutput(`⚡ PERFORMANCE METRICS:\nRender Count: ${gameDebugger.debugState.renderCount}\nAPI Calls: ${gameDebugger.debugState.apiCalls}\nLast Update: ${new Date(gameDebugger.debugState.lastUpdate).toLocaleTimeString()}`);
          break;

        case 'memory':
          if ('memory' in performance) {
            const mem = (performance as any).memory;
            setCommandOutput(`🧠 MEMORY USAGE:\nUsed: ${(mem.usedJSHeapSize / 1048576).toFixed(2)} MB\nTotal: ${(mem.totalJSHeapSize / 1048576).toFixed(2)} MB\nLimit: ${(mem.jsHeapSizeLimit / 1048576).toFixed(2)} MB`);
          } else {
            setCommandOutput("Memory info not available");
          }
          break;

        case 'clear':
          setCommandOutput("");
          break;

        case 'help':
          setCommandOutput(`🔧 AVAILABLE COMMANDS:\n• status - Server health check\n• stats - User statistics\n• performance - Performance metrics\n• memory - Memory usage\n• clear - Clear output\n• help - Show this help`);
          break;

        default:
          setCommandOutput(`❌ Unknown command: "${commandInput}"\nType 'help' for available commands.`);
      }

      setCommandInput("");
    } catch (error: any) {
      setCommandOutput(`💥 ERROR: ${error.message}`);
    }
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Terminal className="w-5 h-5" />
        Backend Debugger
      </h3>

      <div className="space-y-3">
        <div>
          <Label className="text-white text-sm">Command Input</Label>
          <div className="flex gap-2">
            <Input
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="Enter command (e.g., 'status', 'reload', 'stats')"
              className="bg-gray-700 border-gray-600 text-white flex-1"
              onKeyPress={(e) => e.key === 'Enter' && runCommand()}
            />
            <Button
              onClick={runCommand}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Terminal className="w-4 h-4 mr-2" />
              Run
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-white text-sm">Output</Label>
          <div className="bg-gray-900 border border-gray-600 rounded-lg p-3 min-h-24 max-h-48 overflow-y-auto">
            <pre className="text-xs text-green-400 whitespace-pre-wrap">
              {commandOutput || "No output yet..."}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminDebugPanel() {
  const [showReactDebugger, setShowReactDebugger] = useState(false);

  // Initialize React debugger for admin use
  const reactDebugger = useGameDebugger();

  // Make trackApiCall globally available for API monitoring
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).trackApiCall = reactDebugger.trackApiCall;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).trackApiCall;
      }
    };
  }, [reactDebugger.trackApiCall]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Debug Tools</h2>
        <p className="text-gray-400">Debug and monitor system performance</p>
      </div>

      {/* React State Debugger - Primary debugger */}
      <div className="mb-6">
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-orange-500/30 hover:border-orange-500/70 transition-colors cursor-pointer shadow-lg"
              onClick={() => setShowReactDebugger(true)}>
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Monitor className="w-5 h-5 text-orange-400" />
              🔧 React State Debugger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 text-sm font-medium">🎯 Real-time React state monitoring with color-coded logging system</p>
            <div className="mt-2 flex gap-2">
              <Badge variant="secondary" className="text-xs bg-orange-500/20 text-orange-300">Active</Badge>
              <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-300">Enhanced</Badge>
              <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-300">
                {reactDebugger.debugState.renderCount} Renders
              </Badge>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
              <div className="bg-black/30 rounded p-2">
                <span className="text-gray-400">API Calls:</span>
                <span className="text-white ml-2 font-mono">{reactDebugger.debugState.apiCalls}</span>
              </div>
              <div className="bg-black/30 rounded p-2">
                <span className="text-gray-400">Player LP:</span>
                <span className="text-pink-400 ml-2 font-mono">{reactDebugger.debugState.playerLP}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backend Debugger */}
      <AdminBackendDebugger gameDebugger={reactDebugger} />

      {/* Debugger Console - Embedded Static Version */}
      <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-blue-400" />
            🔧 Debugger Console
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DebuggerConsole isOpen={true} isEmbedded={true} />
        </CardContent>
      </Card>

      {/* React State Debugger Modal */}
      {showReactDebugger && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">React State Debugger</h3>
              <Button variant="ghost" onClick={() => setShowReactDebugger(false)}>×</Button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <GameDebugger
                gameState={reactDebugger.debugState}
                onStateChange={reactDebugger.updateDebugState}
                componentRefs={reactDebugger.componentRefs}
                isVisible={true}
                onToggle={() => setShowReactDebugger(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}