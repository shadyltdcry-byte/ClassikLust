import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Trophy, Target, Activity, Zap } from "lucide-react";
import LevelUp from "@/plugins/gameplay/LevelUp";
import Upgrades from "@/plugins/gameplay/Upgrades";
import TaskManagement from "@/components/admin/TaskManagement";
import Achievements from "@/plugins/gameplay/Achievements";
import LevelManagement from "@/components/admin/LevelManagement";
import UpgradeManagement from "@/components/admin/UpgradeManagement";
import AchievementManagement from "@/components/admin/AchievementManagement";
import WheelPrizeManager from "@/components/wheel/WheelPrizeManager";

export default function AdminGameplayPanel() {
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showWheelPrizeManager, setShowWheelPrizeManager] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Gameplay Management</h2>
        <p className="text-gray-400">Manage game mechanics, progression, and rewards</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Level Management */}
        <Card className="bg-gray-800 border-gray-700 hover:border-blue-500/50 transition-colors cursor-pointer"
              onClick={() => setShowLevelUp(true)}>
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Level System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm">Configure level requirements and progression</p>
          </CardContent>
        </Card>

        {/* Upgrade Management */}
        <Card className="bg-gray-800 border-gray-700 hover:border-purple-500/50 transition-colors cursor-pointer"
              onClick={() => setShowUpgrades(true)}>
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              Upgrades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm">Manage upgrade tiers and costs</p>
          </CardContent>
        </Card>

        {/* Task Management */}
        <Card className="bg-gray-800 border-gray-700 hover:border-green-500/50 transition-colors cursor-pointer"
              onClick={() => setShowTasks(true)}>
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-green-400" />
              Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm">Create and manage daily tasks</p>
          </CardContent>
        </Card>

        {/* Achievement Management */}
        <Card className="bg-gray-800 border-gray-700 hover:border-yellow-500/50 transition-colors cursor-pointer"
              onClick={() => setShowAchievements(true)}>
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm">Configure achievement levels and rewards</p>
          </CardContent>
        </Card>

        {/* Wheel Prize Management */}
        <Card className="bg-gray-800 border-gray-700 hover:border-orange-500/50 transition-colors cursor-pointer"
              onClick={() => setShowWheelPrizeManager(true)}>
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-400" />
              Wheel Prizes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 text-sm">Manage wheel game rewards and probabilities</p>
          </CardContent>
        </Card>
      </div>

      {/* Level Management Modal */}
      {showLevelUp && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">Level Management</h3>
              <Button variant="ghost" onClick={() => setShowLevelUp(false)}>×</Button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <LevelManagement />
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Management Modal */}
      {showUpgrades && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">Upgrade Management</h3>
              <Button variant="ghost" onClick={() => setShowUpgrades(false)}>×</Button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* SECURITY FIX: Only show admin components, not user components */}
              <UpgradeManagement />
            </div>
          </div>
        </div>
      )}

      {/* Task Management Modal */}
      {showTasks && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">Task Management</h3>
              <Button variant="ghost" onClick={() => setShowTasks(false)}>×</Button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <TaskManagement />
            </div>
          </div>
        </div>
      )}

      {/* Achievement Management Modal */}
      {showAchievements && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">Achievement Management</h3>
              <Button variant="ghost" onClick={() => setShowAchievements(false)}>×</Button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <AchievementManagement />
            </div>
          </div>
        </div>
      )}

      {/* Wheel Prize Management Modal */}
      {showWheelPrizeManager && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">Wheel Prize Management</h3>
              <Button variant="ghost" onClick={() => setShowWheelPrizeManager(false)}>×</Button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <WheelPrizeManager 
                isOpen={showWheelPrizeManager} 
                onClose={() => setShowWheelPrizeManager(false)} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}