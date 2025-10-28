import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Settings, RefreshCw, Trash2, CheckCircle, AlertTriangle, Activity } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import FileManagerCore from "@/plugins/core/FileManagerCore";
import MediaFileCleanup from "@/components/admin/MediaFileCleanup";

export default function AdminSystemPanel() {
  const [showFileManager, setShowFileManager] = useState(false);
  const [showMediaFileCleanup, setShowMediaFileCleanup] = useState(false);
  const [systemStats, setSystemStats] = useState({
    uptime: '2h 15m',
    memory: '45%',
    cpu: '12%',
    errors: 0,
    warnings: 2
  });

  const refreshSystemStats = () => {
    setSystemStats({
      uptime: `${Math.floor(Math.random() * 5)}h ${Math.floor(Math.random() * 60)}m`,
      memory: `${Math.floor(Math.random() * 80 + 20)}%`,
      cpu: `${Math.floor(Math.random() * 30 + 5)}%`,
      errors: Math.floor(Math.random() * 3),
      warnings: Math.floor(Math.random() * 5)
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">System Management</h2>
        <p className="text-gray-400">System administration and maintenance tools</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* File Manager */}
        <Card className="bg-gray-800 border-gray-700 hover:border-blue-500/50 transition-colors cursor-pointer"
              onClick={() => setShowFileManager(true)}>
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              File Manager
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm">Manage system files and media uploads</p>
          </CardContent>
        </Card>

        {/* Media File Cleanup */}
        <Card className="bg-gray-800 border-gray-700 hover:border-red-500/50 transition-colors cursor-pointer"
              onClick={() => setShowMediaFileCleanup(true)}>
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              Media Cleanup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm">Clean up unused media files and optimize storage</p>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Dialog>
          <DialogTrigger asChild>
            <Card className="bg-gray-800 border-gray-700 hover:border-green-500/50 transition-colors cursor-pointer">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-green-400" />
                  System Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm">Configure system-wide settings and preferences</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-green-400" />
                System Settings
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-gray-800 rounded-lg">
                <h3 className="font-semibold mb-2">🎮 Game Settings</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Auto-save:</span>
                    <Badge className="bg-green-600">✅ Enabled</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Debug Mode:</span>
                    <Badge className="bg-blue-600">🔧 Active</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Luna Monitor:</span>
                    <Badge className="bg-purple-600">🌙 Running</Badge>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-800 rounded-lg">
                <h3 className="font-semibold mb-2">⚡ Performance</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Cache:</span>
                    <Badge className="bg-green-600">🚀 Optimized</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Database:</span>
                    <Badge className="bg-green-600">📡 Connected</Badge>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* System Status */}
        <Dialog>
          <DialogTrigger asChild>
            <Card className="bg-gray-800 border-gray-700 hover:border-yellow-500/50 transition-colors cursor-pointer">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-yellow-400" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm">Monitor system health and performance metrics</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-yellow-400" />
                System Status
                <Button onClick={refreshSystemStats} size="sm" variant="outline" className="ml-auto">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="font-semibold text-sm">Health</span>
                  </div>
                  <Badge className="bg-green-600">✅ All Good</Badge>
                </div>
                <div className="p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span className="font-semibold text-sm">Uptime</span>
                  </div>
                  <span className="text-lg font-mono">{systemStats.uptime}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">💾 Memory</span>
                    <span className="text-sm font-mono">{systemStats.memory}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full transition-all" style={{width: systemStats.memory}}></div>
                  </div>
                </div>
                <div className="p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">⚡ CPU</span>
                    <span className="text-sm font-mono">{systemStats.cpu}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full transition-all" style={{width: systemStats.cpu}}></div>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-gray-800 rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  🚨 Issues
                </h3>
                <div className="flex gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">{systemStats.errors}</div>
                    <div className="text-xs text-gray-400">Errors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{systemStats.warnings}</div>
                    <div className="text-xs text-gray-400">Warnings</div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* File Manager Modal */}
      {showFileManager && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">File Manager</h3>
              <Button variant="ghost" onClick={() => setShowFileManager(false)}>×</Button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <FileManagerCore />
            </div>
          </div>
        </div>
      )}

      {/* Media File Cleanup Modal */}
      {showMediaFileCleanup && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">Media File Cleanup</h3>
              <Button variant="ghost" onClick={() => setShowMediaFileCleanup(false)}>×</Button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <MediaFileCleanup />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}