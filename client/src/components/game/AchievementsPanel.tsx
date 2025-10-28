import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAchievementsByCategory } from "@/plugins/gameplay/Achievements";

interface AchievementsPanelProps {
  claimingRewards: Set<string>;
  onClaimReward: (id: string, type: string) => void;
}

export default function AchievementsPanel({ claimingRewards, onClaimReward }: AchievementsPanelProps) {
  const [achievementFilter, setAchievementFilter] = useState("all");

  // Fetch user data for dynamic calculation
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/user/telegram_8276164651'],
  });
  
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/stats/telegram_8276164651'],
  });

  // Calculate dynamic achievements based on real user data
  const userStatsForCalculation = userData ? {
    ...userData,
    totalTaps: userStats?.totalTaps || 0,
    completedTasks: 0 // TODO: Track completed tasks
  } : null;

  const dynamicAchievements = userStatsForCalculation ? getAchievementsByCategory(achievementFilter, userStatsForCalculation) : [];
  const isLoading = userLoading || statsLoading;

  return (
    <div className="w-full max-w-2xl h-full flex flex-col">
      {/* Header */}
      <div className="p-4 bg-black/30 border-b border-yellow-500/30 rounded-t-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">Achievements</h3>
            <p className="text-sm text-gray-400">Track your progress and unlock rewards</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{dynamicAchievements.filter((a) => a.status === 'completed').length}</div>
            <div className="text-xs text-gray-400">Completed</div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          {["all", "tapping", "chatting", "progression", "interaction"].map((filter) => (
            <Button
              key={filter}
              size="sm"
              variant={achievementFilter === filter ? "default" : "outline"}
              onClick={() => setAchievementFilter(filter)}
              className={`${
                achievementFilter === filter
                  ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                  : "bg-transparent border-yellow-500/50 text-yellow-400 hover:bg-yellow-600/20"
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Achievement List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-3 p-4">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-gray-400">Loading achievements...</div>
              </div>
            ) : dynamicAchievements.length === 0 ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-gray-400">No achievements available</div>
              </div>
            ) : (
              dynamicAchievements.map((achievement) => {
                const currentLevel = achievement.currentLevel || 1;
                const maxLevel = achievement.maxLevel || 10;
                const progress = achievement.progress || 0;
                const levels = achievement.levels || [];
                
                const currentLevelData = levels.find((l: any) => l.level === currentLevel);
                const nextLevelData = levels.find((l: any) => l.level === currentLevel + 1);
                const target = currentLevelData?.target || achievement.target || 0;
                const nextTarget = nextLevelData?.target || target;
                const reward = currentLevelData?.reward || achievement.reward || { type: 'lp', amount: 0 };
                
                const isCompleted = currentLevel >= maxLevel || achievement.completed;
                const isReadyToClaim = progress >= target && !isCompleted;

                return (
                  <Card key={achievement.id} className="bg-gray-800/50 border-gray-600/50 hover:border-yellow-500/50 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{achievement.icon || '🏆'}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-white text-sm">{achievement.name}</h3>
                              <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                                Level {currentLevel}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-400">{achievement.description}</p>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-300">Progress</div>
                          <div className="text-sm font-bold text-white">{currentLevel}/{maxLevel}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-300">Current Level: {target.toLocaleString()}</span>
                          <span className="text-white font-mono">{progress.toLocaleString()}/{target.toLocaleString()}</span>
                        </div>
                        <Progress value={(progress / target) * 100} className="h-2" />
                        
                        {nextLevelData && !isCompleted && (
                          <div className="text-xs text-gray-400">
                            Next Level: {nextTarget.toLocaleString()} ({nextLevelData.reward?.amount || nextTarget} {nextLevelData.reward?.type?.toUpperCase() || "LP"})
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-green-400">
                          Reward: {reward.amount || reward} {(reward.type || 'lp').toUpperCase()}
                        </span>
                        <Button
                          size="sm"
                          disabled={!isReadyToClaim || claimingRewards.has(achievement.id)}
                          onClick={() => onClaimReward(achievement.id, 'achievement')}
                          className="bg-yellow-600 hover:bg-yellow-700 text-xs px-3 py-1 disabled:opacity-50"
                        >
                          {claimingRewards.has(achievement.id) ? 'Claiming...' : 
                           isCompleted ? 'Completed' :
                           isReadyToClaim ? 'Claim' : 
                           'In Progress'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}