/**
 * LevelUp.tsx - API-Only Level Up System
 * Last Edited: 2025-10-24 by Assistant - Purged hardcoded arrays, JSON-first architecture
 */

import React from 'react';
import { useGame } from '@/context/GameProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trophy, Gift, CheckCircle, AlertCircle, Lock, Unlock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiRequest } from '@/lib/queryClient';

interface LevelUpProps {
  onLevelUp?: (newLevel: number) => void;
}

export default function LevelUp({ onLevelUp }: LevelUpProps) {
  const { playerData } = useGame();
  const queryClient = useQueryClient();

  // Fetch level requirements from API
  const { data: levelData, isLoading } = useQuery({
    queryKey: ['/api/level', playerData.id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/level?userId=${playerData.id}`);
      return await response.json();
    },
    enabled: !!playerData.id
  });

  // Level up mutation
  const levelUpMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/level/claim', {
        userId: playerData.id
      });
      if (!response.ok) {
        throw new Error('Failed to level up');
      }
      return await response.json();
    },
    onSuccess: (data) => {
      toast.success(`Congratulations! You've reached level ${data.newLevel}!`);
      onLevelUp?.(data.newLevel);
      queryClient.invalidateQueries({ queryKey: ['/api/level'] });
      queryClient.invalidateQueries({ queryKey: ['/api/player'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to level up');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const xpPercentage = levelData?.xpPercentage || 0;
  const canLevelUp = levelData?.canLevelUp || false;
  const nextLevel = levelData?.nextLevel || playerData.level + 1;
  const requirements = levelData?.requirements || [];
  const previewRewards = levelData?.previewRewards || {};

  return (
    <div className="space-y-6">
      {/* Current Level Status */}
      <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-xl">Level {playerData.level}</CardTitle>
                <CardDescription className="text-purple-300">
                  {playerData.xp} / {playerData.xpToNext} XP
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-purple-300 border-purple-500">
              Player Level
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-300 mb-2">
                <span>Experience Progress</span>
                <span>{xpPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={xpPercentage} className="h-3 bg-gray-700" />
            </div>

            <Button
              onClick={() => levelUpMutation.mutate()}
              disabled={!canLevelUp || levelUpMutation.isPending}
              className={`w-full ${
                canLevelUp 
                  ? 'bg-purple-600 hover:bg-purple-700' 
                  : 'bg-gray-600 cursor-not-allowed'
              }`}
            >
              {levelUpMutation.isPending 
                ? 'Leveling Up...' 
                : canLevelUp 
                ? `Level Up to ${nextLevel}!` 
                : 'Requirements Not Met'
              }
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requirements and Rewards */}
      <Card className="bg-gray-800/50 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-yellow-500" />
            Next Level Requirements
          </CardTitle>
          <CardDescription className="text-gray-400">
            Level {nextLevel} requirements and rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Requirements List */}
          {requirements.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-white font-semibold mb-3">Requirements:</h4>
              {requirements.map((req: any, index: number) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    req.isMet 
                      ? 'bg-green-900/20 border-green-500/30 text-green-300' 
                      : 'bg-red-900/20 border-red-500/30 text-red-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {req.isMet ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span>{req.description}</span>
                  </div>
                  <Badge variant={req.isMet ? "default" : "destructive"}>
                    {req.isMet ? 'Complete' : 'Incomplete'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <Trophy className="h-4 w-4" />
              <AlertDescription>
                {canLevelUp 
                  ? 'All requirements met! You can level up now.' 
                  : 'Loading requirements...'}
              </AlertDescription>
            </Alert>
          )}

          {/* Rewards Preview */}
          {Object.keys(previewRewards).length > 0 && (
            <div>
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Gift className="w-4 h-4 text-purple-400" />
                Level Up Rewards
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {previewRewards.lp && (
                  <div className="bg-purple-900/30 p-3 rounded-lg text-center">
                    <div className="text-purple-300 text-lg font-bold">
                      +{previewRewards.lp.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">LP Bonus</div>
                  </div>
                )}
                {previewRewards.coins && (
                  <div className="bg-yellow-900/30 p-3 rounded-lg text-center">
                    <div className="text-yellow-300 text-lg font-bold">
                      +{previewRewards.coins}
                    </div>
                    <div className="text-xs text-gray-400">Coins</div>
                  </div>
                )}
                {previewRewards.maxEnergy && (
                  <div className="bg-blue-900/30 p-3 rounded-lg text-center">
                    <div className="text-blue-300 text-lg font-bold">
                      +{previewRewards.maxEnergy}
                    </div>
                    <div className="text-xs text-gray-400">Max Energy</div>
                  </div>
                )}
                {previewRewards.lpPerHour && (
                  <div className="bg-green-900/30 p-3 rounded-lg text-center">
                    <div className="text-green-300 text-lg font-bold">
                      +{previewRewards.lpPerHour}
                    </div>
                    <div className="text-xs text-gray-400">LP/Hour</div>
                  </div>
                )}
              </div>

              {previewRewards.unlocks && previewRewards.unlocks.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-white font-medium mb-2">New Unlocks:</h5>
                  <div className="space-y-1">
                    {previewRewards.unlocks.map((unlock: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-purple-300">
                        <Unlock className="w-4 h-4" />
                        <span className="text-sm">{unlock}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}