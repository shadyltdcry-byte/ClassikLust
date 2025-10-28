import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getTasksByCategory } from "@/plugins/gameplay/Task";
import { getAchievementsByCategory } from "@/plugins/gameplay/Achievements";

interface TasksPanelProps {
  claimingRewards: Set<string>;
  onClaimReward: (id: string, type: string) => void;
}

export default function TasksPanel({ claimingRewards, onClaimReward }: TasksPanelProps) {
  const [taskFilter, setTaskFilter] = useState("all");

  // Fetch user data for dynamic calculation
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/user/telegram_8276164651'],
  });

  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/stats/telegram_8276164651'],
  });

  // Calculate dynamic tasks and achievements based on real user data
  const userStatsForCalculation = userData ? {
    ...userData,
    totalTaps: (userStats as any)?.totalTaps || 0,
    completedTasks: 0 // TODO: Track completed tasks
  } : null;

  const dynamicTasks = userStatsForCalculation ? getTasksByCategory(taskFilter, userStatsForCalculation) : [];
  const dynamicAchievements = userStatsForCalculation ? getAchievementsByCategory("all", userStatsForCalculation) : [];

  const isLoading = userLoading || statsLoading;

  return (
    <div className="w-full max-w-2xl h-full flex flex-col overflow-hidden">
      {/* Tasks & Achievements Tabs - Fixed Layout */}
      <Tabs defaultValue="tasks" className="w-full h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-2 mb-3 flex-shrink-0 bg-black/40 border border-purple-500/30 p-1">
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Achievements
          </TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="flex-1 flex flex-col overflow-hidden">
          {/* Tasks Header */}
          <div className="p-3 bg-black/30 border-b border-purple-500/30 rounded-t-lg flex-shrink-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Daily Tasks</h3>
                <p className="text-sm text-gray-400">Complete tasks to earn rewards</p>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 flex-wrap">
              {["all", "basic", "energy", "progression"].map((filter) => (
                <Button
                  key={filter}
                  size="sm"
                  variant={taskFilter === filter ? "default" : "outline"}
                  onClick={() => setTaskFilter(filter)}
                  className={`${
                    taskFilter === filter
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "bg-transparent border-purple-500/50 text-purple-400 hover:bg-purple-600/20"
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Task List */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-3 p-4">
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="text-gray-400">Loading tasks...</div>
                  </div>
                ) : dynamicTasks.length === 0 ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="text-gray-400">No tasks available</div>
                  </div>
                ) : (
                dynamicTasks.map((task) => (
                    <Card key={task.id} className="bg-gray-800/50 border-gray-600/50 hover:border-purple-500/50 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{task.icon || "⭐"}</span>
                        <div>
                          <h3 className="font-semibold text-white text-sm">{task.title}</h3>
                          <p className="text-xs text-gray-400">{task.description}</p>
                        </div>
                      </div>
                      <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                        {task.status}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Progress</span>
                        <span>{task.progress || 0}/{task.maxProgress || 1}</span>
                      </div>
                      <Progress value={((task.progress || 0) / (task.maxProgress || 1)) * 100} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-green-400">
                        Reward: {task.reward || "50 LP"}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => {
                          console.log('Claiming task:', task.id);
                          onClaimReward(task.id, 'task');
                        }}
                        disabled={claimingRewards.has(task.id) || task.status !== 'completed'}
                        className="bg-purple-600 hover:bg-purple-700 text-xs px-3 py-1 disabled:opacity-50"
                      >
                        {claimingRewards.has(task.id) ? 'Claiming...' : task.status === 'completed' ? 'Claim' : 'In Progress'}
                      </Button>
                    </div>
                  </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </TabsContent>

      {/* Achievements Tab */}
      <TabsContent value="achievements" className="flex-1 flex flex-col">
        {/* Achievements Header */}
        <div className="p-4 bg-black/30 border-b border-yellow-500/30 rounded-t-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Achievements</h3>
              <p className="text-sm text-gray-400">Unlock achievements to earn bonus rewards</p>
            </div>
          </div>
        </div>

        {/* Achievements List */}
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
                dynamicAchievements.map((achievement: any) => (
                  <Card key={achievement.id} className="bg-gray-800/50 border-gray-600/50 hover:border-yellow-500/50 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{achievement.icon || "🏆"}</span>
                          <div>
                            <h3 className="font-semibold text-white text-sm">{achievement.name || achievement.title}</h3>
                            <p className="text-xs text-gray-400">{achievement.description}</p>
                          </div>
                        </div>
                        <Badge variant={achievement.completed ? 'default' : 'secondary'} className="bg-yellow-600">
                          {achievement.completed ? 'Unlocked' : achievement.status || 'Locked'}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Progress</span>
                          <span>{achievement.progress || 0}/{achievement.target || achievement.maxProgress || 1}</span>
                        </div>
                        <Progress value={((achievement.progress || 0) / (achievement.target || achievement.maxProgress || 1)) * 100} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-yellow-400">
                          Reward: {achievement.reward?.amount || achievement.reward || "100"} {achievement.reward?.type?.toUpperCase() || "LP"}
                        </span>
                        <Button
                          size="sm"
                          disabled={!achievement.completed || claimingRewards.has(achievement.id)}
                          onClick={() => onClaimReward(achievement.id, 'achievement')}
                          className="bg-yellow-600 hover:bg-yellow-700 text-xs px-3 py-1"
                        >
                          {claimingRewards.has(achievement.id) ? 'Claiming...' : 
                           achievement.completed ? 'Claim' : 'Locked'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </TabsContent>
    </Tabs>
    </div>
  );
}