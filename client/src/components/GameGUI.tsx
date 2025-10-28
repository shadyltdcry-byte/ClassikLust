import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/AuthContext";
// Auth is handled at App level
import { Settings } from "lucide-react";
import CharacterDisplay from "@/components/CharacterDisplay";
import CharacterGallery from "@/components/CharacterGallery";
import OfflineIncomeDialog from "@/components/OfflineIncomeDialog";
import AdminMenu from "@/plugins/admin/AdminMenu";
import AIChat from "@/plugins/aicore/AIChat";
import LevelUp from "@/plugins/gameplay/LevelUp";
import Upgrades from "@/plugins/gameplay/Upgrades";
import WheelGame from "@/components/wheel/WheelGame";
import VIP from "@/components/vip/VIP";
import { useGameState } from "@/hooks/use-game-state";
import { useGame } from "@/context/GameProvider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
// Import new focused components
import PlayerStatsPanel from "@/components/game/PlayerStatsPanel";
import GameTabsPanel from "@/components/game/GameTabsPanel";
import FloatingActionIcons from "@/components/ui/FloatingActionIcons";
import GameProgressPanel from "@/components/game/GameProgressPanel";
import TasksPanel from "@/components/game/TasksPanel";
import AchievementsPanel from "@/components/game/AchievementsPanel";
import DebuggerConsole from "@/components/debug/DebuggerConsole";

interface PlayerData {
  id: string;
  name: string;
  level: number;
  lp: number;
  lpPerHour: number;
  lpPerTap: number;
  energy: number;
  maxEnergy: number;
  coins: number;
  lustGems?: number;
  xp: number;
  xpToNext: number;
  avatar?: string;
  activeBoosters?: Array<{ name: string }>;
  isVip?: boolean;
  [key: string]: any;
}

interface GameGUIProps {
  playerData?: PlayerData;
  onPluginAction: (action: string, data?: any) => void;
  onPluginChange?: (plugin: string) => void;
}

interface GUIState {
  activePlugin: string;
  showAdminMenu: boolean;
  showCharacterGallery: boolean;
  showWheelGame: boolean;
  showVIP: boolean;
}

export default function GameGUI({ playerData, onPluginAction }: GameGUIProps) {

  // Use auth context for consistent authentication
  const { userId: authUserId, isLoading: authLoading, error: authError } = useAuth();
  const userId = authUserId || playerData?.id;
  const isAuthenticated = !!userId;

  // Show loading screen during auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading game...</p>
        </div>
      </div>
    );
  }

  // Block all unauthenticated users - NO GUEST MODE
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center text-white max-w-md p-8">
          <h1 className="text-4xl font-bold mb-4">🎮 Character Tap Game</h1>
          <h2 className="text-2xl mb-6">Authentication Required</h2>
          <p className="text-lg mb-8 text-purple-200">
            Please log in through our Telegram bot to access the game.
          </p>
          <div className="bg-blue-900/50 p-6 rounded-lg border border-blue-500/30">
            <h3 className="text-xl font-semibold mb-4">How to Login:</h3>
            <ol className="text-left space-y-2 text-purple-200">
              <li>1. Open Telegram</li>
              <li>2. Find @ClassikLust_Bot</li>
              <li>3. Send /login command</li>
              <li>4. Click the game link directly</li>
              <li className="text-yellow-300 font-semibold">⚠️ Don't copy/paste the URL</li>
            </ol>
          </div>
          {authError && (
            <div className="mt-4 text-sm text-red-300 bg-red-900/30 p-3 rounded">
              {authError}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Use game state hook to get selected character (this already includes user data)
  const { user, character: selectedCharacter, stats, isLoading, tap, isTapping: gameStateTapping } = useGameState();
  
  // Use game provider for offline income (this already includes player data)
  const { playerData: gamePlayerData, claimOfflineIncome } = useGame();
  
  // Toast notifications
  const { toast } = useToast();

  const [guiState, setGUIState] = useState<GUIState>({
    activePlugin: "main",
    showAdminMenu: false,
    showCharacterGallery: false,
    showWheelGame: false,
    showVIP: false,
  });


  // Offline income dialog state
  const [showOfflineDialog, setShowOfflineDialog] = useState(false);
  
  // Watch for offline income to become available
  React.useEffect(() => {
    if ((gamePlayerData?.pendingOfflineLP || 0) > 0 && !showOfflineDialog) {
      setShowOfflineDialog(true);
    }
  }, [gamePlayerData?.pendingOfflineLP, showOfflineDialog]);


  const [isTapping, setIsTapping] = useState(false);
  const [taskFilter, setTaskFilter] = useState("tasks");
  
  // Use game state tapping if available, otherwise use local state
  const actuallyTapping = gameStateTapping || isTapping;

  const updateGUIState = (updates: Partial<GUIState>) => {
    setGUIState(prev => ({ ...prev, ...updates }));
  };

  // Fetch real data for progress calculations
  const { data: allTasks = [] } = useQuery({ queryKey: ['/api/admin/tasks'] });
  const { data: allAchievements = [] } = useQuery({ queryKey: ['/api/admin/achievements'] });

  // Calculate progress percentages from real data
  const calculateTasksProgress = () => {
    const tasks = allTasks as any[];
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter((task: any) => task.completed).length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const calculateAchievementsProgress = () => {
    const achievements = allAchievements as any[];
    if (achievements.length === 0) return 0;
    const completedAchievements = achievements.filter((achievement: any) => achievement.completed).length;
    return Math.round((completedAchievements / achievements.length) * 100);
  };

  // Helper functions for claim rewards
  const [claimingRewards, setClaimingRewards] = useState<Set<string>>(new Set());

  const handleTap = async () => {
    if (!user || user.energy <= 0 || actuallyTapping) return;
    
    // Immediate optimistic UI update for fluid tapping
    const currentLp = parseFloat(user.lp?.toString() || '0');
    const lpGain = user.lpPerTap || 1.5;
    const newLp = currentLp + lpGain;
    const newEnergy = Math.max(0, user.energy - 1);
    
    // Set visual feedback immediately
    setIsTapping(true);
    
    // Optimistically update user data in cache
    queryClient.setQueryData(['/api/user', userId], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        lp: newLp,
        energy: newEnergy
      };
    });
    
    try {
      // Use optimized tap endpoint in background
      const response = await apiRequest('POST', '/api/tap', {
        userId: userId
      });
      
      if (response.ok) {
        const result = await response.json();
        // Update with server response to ensure consistency
        queryClient.setQueryData(['/api/user', userId], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            lp: result.newLp,
            energy: result.newEnergy
          };
        });
      }
    } catch (error) {
      console.error('Tap error:', error);
      // Revert optimistic update on error
      queryClient.setQueryData(['/api/user', userId], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          lp: currentLp,
          energy: user.energy
        };
      });
    }
    
    // Much faster visual feedback reset
    setTimeout(() => setIsTapping(false), 80);
  };

  
  const claimReward = async (id: string, type: 'task' | 'achievement') => {
    // Prevent multiple claims of the same reward
    if (claimingRewards.has(id)) {
      toast({
        title: "Already Claiming",
        description: "Please wait for the previous claim to complete",
        variant: "destructive",
      });
      return;
    }
    
    setClaimingRewards(prev => new Set(prev).add(id));
    
    try {
      console.log(`Claiming ${type} reward:`, id);
      
      const response = await apiRequest('POST', `/api/rewards/claim`, {
        rewardId: id,
        rewardType: type,
        userId: userId || playerData?.id
      });
      
      if (response.ok) {
        const result = await response.json();
        const reward = result.data?.reward || result.reward || "Unknown reward";
        toast({
          title: "Reward Claimed!",
          description: `${reward} added to your account`,
        });
        
        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/tasks'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/achievements'] });
      } else {
        throw new Error('Failed to claim reward');
      }
    } catch (error) {
      console.error(`Error claiming ${type} reward:`, error);
      toast({
        title: "Claim Failed",
        description: `Unable to claim ${type} reward. Please try again.`,
        variant: "destructive",
      });
      // Remove from set immediately on error
      setClaimingRewards(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } finally {
      // Keep in claiming set for 5 seconds to prevent rapid re-claiming
      setTimeout(() => {
        setClaimingRewards(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }, 5000);
    }
  };



  // Main render function for active plugin
  const renderActivePlugin = () => {
    switch (guiState.activePlugin) {
      case "main":
        return (
          <div className="max-w-sm w-full">
            <CharacterDisplay
              character={selectedCharacter} // Use selected character from game state
              user={{
                ...playerData,
                id: playerData?.id || userId || '',
                username: playerData?.username || playerData?.name || 'Player',
                password: '',
                level: playerData?.level || 1,
                lp: playerData?.lp || 1000,
                lpPerHour: playerData?.lpPerHour || 250,
                lpPerTap: playerData?.lpPerTap || 1,
                energy: playerData?.energy || 1000,
                maxEnergy: playerData?.maxEnergy || 1000,
                charisma: playerData?.charismaPoints || 0,
                vipStatus: playerData?.isVip || false,
                nsfwConsent: playerData?.nsfwEnabled || false,
                lastTick: new Date(playerData?.lastTickTimestamp || Date.now()),
                createdAt: new Date(),
                ...(user || {}) // Override with user data if available
              } as any}
              onTap={handleTap}
              onAvatarClick={() => {
                console.log('Avatar clicked, opening gallery');
                updateGUIState({ showCharacterGallery: true });
              }}
              isTapping={actuallyTapping}
              lpPerTap={playerData?.lpPerTap || 1}
              userId={userId} // Add userId for Luna's notifications
            />
          </div>
        );

      case "levelup":
        return <LevelUp />;

      case "upgrades":
        return (
          <div className="w-full max-w-2xl">
            <Upgrades
              playerData={user || playerData} // Use fresh user data from hooks
              onUpgradeAction={(action, data) => {
                // Refresh user data after any upgrade action
                queryClient.invalidateQueries({ queryKey: ['/api/user'] });
                queryClient.invalidateQueries({ queryKey: ['/api/player'] });
                onPluginAction(action, data);
              }}
            />
          </div>
        );

      case "tasks":
        return (
          <div className="flex gap-4 h-full max-w-6xl">
            <div className="flex flex-col gap-4 flex-1">
              <TasksPanel 
                claimingRewards={claimingRewards}
                onClaimReward={(id, type) => claimReward(id, type as "task" | "achievement")}
              />
              <AchievementsPanel 
                claimingRewards={claimingRewards}
                onClaimReward={(id, type) => claimReward(id, type as "task" | "achievement")}
              />
            </div>
            <div className="flex flex-col gap-4">
              <GameProgressPanel 
                type="tasks" 
                progress={calculateTasksProgress()}
              />
              <GameProgressPanel 
                type="achievements" 
                progress={calculateAchievementsProgress()}
              />
            </div>
          </div>
        );

      case "chat":
        return (
          <div className="w-full max-w-2xl h-full">
            {isAuthenticated ? (
              <AIChat userId={userId || playerData?.id} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-white">Please log in to use chat</p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center text-gray-400">
            <p>Select a section from the bottom navigation</p>
          </div>
        );
    }
  };

  // Handle offline income claim
  const handleClaimOfflineIncome = async () => {
    try {
      await claimOfflineIncome();
      setShowOfflineDialog(false);
      // Force refresh user data to show updated LP
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/player'] });
    } catch (error) {
      console.error('Failed to claim offline income:', error);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-gray-900 via-pink-900/20 to-red-900/20 text-white overflow-hidden">
      
      {/* Offline Income Dialog */}
      <OfflineIncomeDialog
        isOpen={showOfflineDialog}
        onClaim={handleClaimOfflineIncome}
        onClose={() => setShowOfflineDialog(false)}
        offlineLP={gamePlayerData?.pendingOfflineLP || 0}
        offlineDuration={gamePlayerData?.offlineDuration || 0}
      />

      {/* Status Bar */}
      <PlayerStatsPanel
        user={user}
        playerData={playerData}
        selectedCharacter={selectedCharacter}
        onAvatarClick={() => {
          console.log('Status bar avatar clicked, opening gallery');
          updateGUIState({ showCharacterGallery: true });
        }}
      />

      {/* Main Content - Fixed Top Spacing */}
      <div className="flex-1 flex items-center justify-center px-4 pt-2 pb-24 overflow-auto">
        <div className="w-full h-full flex items-center justify-center">
          {renderActivePlugin()}
        </div>
      </div>

      {/* Bottom Navigation */}
      <GameTabsPanel
        activePlugin={guiState.activePlugin}
        onPluginChange={(plugin) => updateGUIState({ activePlugin: plugin })}
      />

      {/* Floating Action Icons - Hide on certain screens */}
      {guiState.activePlugin === 'main' && (
        <FloatingActionIcons
          onOpenWheel={() => updateGUIState({ showWheelGame: true })}
          onOpenVIP={() => updateGUIState({ showVIP: true })}
          onOpenAdmin={() => updateGUIState({ showAdminMenu: true })}
          onOpenGallery={() => {
            console.log('Gallery button clicked');
            updateGUIState({ showCharacterGallery: true });
          }}
        />
      )}


      {/* Admin Menu Modal */}
      {guiState.showAdminMenu && (
        <AdminMenu onClose={() => updateGUIState({ showAdminMenu: false })} />
      )}

      {/* Wheel Game Modal */}
      {guiState.showWheelGame && userId && (
        <WheelGame 
          isOpen={guiState.showWheelGame}
          onClose={() => updateGUIState({ showWheelGame: false })}
          userId={userId}
        />
      )}

      {/* VIP Modal */}
      {guiState.showVIP && userId && (
        <VIP 
          isOpen={guiState.showVIP}
          onClose={() => updateGUIState({ showVIP: false })}
          userId={userId}
        />
      )}

      {/* Character Gallery Modal - Fixed z-index to appear above everything */}
      {guiState.showCharacterGallery && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full h-full max-w-7xl max-h-[95vh] overflow-hidden">
            <CharacterGallery 
              isOpen={guiState.showCharacterGallery}
              onClose={() => {
                updateGUIState({ showCharacterGallery: false });
                // Refresh character data when closing gallery
                queryClient.invalidateQueries({ queryKey: ['/api/character/selected'] });
                queryClient.invalidateQueries({ queryKey: ['/api/characters'] });
              }}
              userId={userId || playerData?.id || ''}
              currentCharacterid={selectedCharacter?.id !== 'no-character-selected' ? selectedCharacter?.id : undefined}
              onCharacterSelected={(characterid) => {
                console.log('Character selected:', characterid, 'for user:', userId);
                // Invalidate all related queries to refresh character data
                queryClient.invalidateQueries({ queryKey: ['/api/character/selected'] });
                queryClient.invalidateQueries({ queryKey: ['/api/player'] });
                queryClient.invalidateQueries({ queryKey: ['/api/characters'] });
                updateGUIState({ showCharacterGallery: false });
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
}


/**  Admin Debugger UI Menu Modal 

    
      const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        title="Open Admin UI"
        className="fixed bottom-4 right-4 bg-blue-600 p-3 rounded-full shadow-lg text-white hover:bg-blue-700 z-50"
      >
        <Bug className="w-5 h-5" />
      </button>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
          <div className="bg-gray-900 rounded-lg w-5/6 h-5/6 overflow-auto p-6 relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-red-500"
            >✕</button>
            <AdminUI />
          </div>
        </div>
      )}
    </>
  );
}
*/