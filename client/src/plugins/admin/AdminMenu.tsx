import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Users, Zap, Bug, Database } from "lucide-react";
import AdminCharactersPanel from "@/components/admin/AdminCharactersPanel";
import AdminGameplayPanel from "@/components/admin/AdminGameplayPanel";
import AdminDebugPanel from "@/components/admin/AdminDebugPanel";
import AdminSystemPanel from "@/components/admin/AdminSystemPanel";

interface AdminMenuProps { onClose?: () => void; }

export default function AdminMenu({ onClose }: AdminMenuProps) {
  const [activeTab, setActiveTab] = useState("characters");

  return (
    <Dialog open onOpenChange={() => onClose?.()}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[90vh] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-0">
        <DialogHeader className="relative px-6 pt-6">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Admin Control Panel
          </DialogTitle>
          <Button onClick={onClose} className="absolute top-4 right-4 bg-transparent hover:bg-red-600/20 border-none" variant="ghost" size="sm">
            <X className="w-4 h-4 text-white" />
          </Button>
        </DialogHeader>
        <div className="px-6 pb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 gap-2 bg-transparent p-2">
              <TabsTrigger value="characters" className="bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:border-purple-500 rounded-lg transition-all shadow-sm">
                <Users className="w-4 h-4 mr-2" /> Characters
              </TabsTrigger>
              <TabsTrigger value="gameplay" className="bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:border-purple-500 rounded-lg transition-all shadow-sm">
                <Zap className="w-4 h-4 mr-2" /> Gameplay
              </TabsTrigger>
              <TabsTrigger value="debug" className="bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:border-purple-500 rounded-lg transition-all shadow-sm">
                <Bug className="w-4 h-4 mr-2" /> Debug Tools
              </TabsTrigger>
              <TabsTrigger value="system" className="bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:border-purple-500 rounded-lg transition-all shadow-sm">
                <Database className="w-4 h-4 mr-2" /> System
              </TabsTrigger>
            </TabsList>

            {/* Dedicated scroll container; removes clipping */}
            <div className="h-[70vh] overflow-y-auto pr-2">
              <TabsContent value="characters" className="m-0"><AdminCharactersPanel /></TabsContent>
              <TabsContent value="gameplay" className="m-0"><AdminGameplayPanel /></TabsContent>
              <TabsContent value="debug" className="m-0"><AdminDebugPanel /></TabsContent>
              <TabsContent value="system" className="m-0"><AdminSystemPanel /></TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
