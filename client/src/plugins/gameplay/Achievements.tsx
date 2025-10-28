
/**
 * Achievements.tsx - Achievement Data Management  
 * Last Edited: 2025-08-19 by Assistant
 *
 * Pure data logic for achievements - NO GUI components
 */

export interface Achievements {
  id: string;
  title: string;
  description: string;
  progress: number;
  maxProgress: number;
  reward: string;
  status: 'completed' | 'in_progress' | 'locked';
  category: string;
  icon: string;
}

export const mockAchievements: Achievements[] = [
  {
    id: "achievement_1",
    title: "First Steps",
    description: "Complete your first task",
    progress: 1,
    maxProgress: 1,
    reward: "100 LP",
    status: "completed",
    category: "beginner",
    icon: "🎯"
  },
  {
    id: "achievement_2",
    title: "Tap Master",
    description: "Tap character 100 times",
    progress: 45,
    maxProgress: 100,
    reward: "500 LP",
    status: "in_progress",
    category: "interaction",
    icon: "👆"
  },
  {
    id: "achievement_3",
    title: "Level Up",
    description: "Reach level 5", 
    progress: 3,
    maxProgress: 5,
    reward: "1000 LP + Energy Boost",
    status: "in_progress",
    category: "progression",
    icon: "⬆️"
  },
  {
    id: "achievement_4",
    title: "Collector",
    description: "Unlock 5 different characters",
    progress: 1,
    maxProgress: 5,
    reward: "Special Character Unlock",
    status: "in_progress",
    category: "collection",
    icon: "📦"
  },
  {
    id: "achievement_5",
    title: "VIP Status",
    description: "Purchase VIP membership",
    progress: 0,
    maxProgress: 1,
    reward: "VIP Benefits Access", 
    status: "locked",
    category: "premium",
    icon: "👑"
  }
];

// Dynamic achievement calculation based on real user data
export const calculateDynamicAchievements = (userStats: any): Achievements[] => {
  const baseAchievements: Omit<Achievements, 'progress' | 'status'>[] = [
    {
      id: "achievement_1",
      title: "First Steps",
      description: "Complete your first task",
      maxProgress: 1,
      reward: "100 LP",
      category: "beginner",
      icon: "🎯"
    },
    {
      id: "achievement_2",
      title: "Tap Master",
      description: "Tap character 100 times",
      maxProgress: 100,
      reward: "500 LP",
      category: "interaction",
      icon: "👆"
    },
    {
      id: "achievement_3",
      title: "Level Up Master",
      description: "Reach level 5", 
      maxProgress: 5,
      reward: "1000 LP + Energy Boost",
      category: "progression",
      icon: "⬆️"
    },
    {
      id: "achievement_4",
      title: "LP Millionaire",
      description: "Earn 5000 LP total",
      maxProgress: 5000,
      reward: "Special Character Unlock",
      category: "collection",
      icon: "📦"
    }
  ];

  return baseAchievements.map(achievement => {
    let progress = 0;
    
    switch (achievement.id) {
      case "achievement_1": // First Steps - check if any task completed
        progress = userStats.completedTasks > 0 ? 1 : 0;
        break;
      case "achievement_2": // Tap Master
        progress = Math.min(userStats.totalTaps || 0, achievement.maxProgress);
        break;
      case "achievement_3": // Level Up Master
        progress = Math.min(userStats.level || 1, achievement.maxProgress);
        break;
      case "achievement_4": // LP Millionaire
        progress = Math.min(userStats.lp || 0, achievement.maxProgress);
        break;
    }
    
    const status: Achievements['status'] = progress >= achievement.maxProgress ? 'completed' : 'in_progress';
    
    return {
      ...achievement,
      progress,
      status
    };
  });
};

export const getAchievementsByCategory = (category?: string, userStats?: any) => {
  const dynamicAchievements = userStats ? calculateDynamicAchievements(userStats) : mockAchievements;
  if (!category || category === "all") return dynamicAchievements;
  return dynamicAchievements.filter(achievements => achievements.category === category);
};

export const claimAchievementsReward = (achievementsId: string) => {
  console.log("Claiming achievement reward:", achievementsId);
  // TODO: Implement actual reward claiming logic with API call
  return { success: true, message: "Achievement reward claimed successfully!" };
};

export default function Achievements({ onClaimPrize }: { onClaimPrize?: () => void }) {
  // This component should only be called from GameGUI for rendering
  // All GUI logic should be in GameGUI.tsx
  return null;
}
