
/**
 * Task.tsx - Task Data Management
 * Last Edited: 2025-08-19 by Assistant
 *
 * Pure data logic for task management - NO GUI components
 */

export interface Task {
  id: string;
  title: string;
  description: string;
  progress: number;
  maxProgress: number;
  reward: string;
  status: 'active' | 'completed' | 'locked';
  category: string;
  icon: string;
}

export const mockTasks: Task[] = [
  {
    id: "task_1",
    title: "First Tap",
    description: "Tap your character 5 times",
    progress: 3,
    maxProgress: 5,
    reward: "50 LP",
    status: "active",
    category: "basic",
    icon: "👆"
  },
  {
    id: "task_2", 
    title: "Energy Master",
    description: "Reach maximum energy",
    progress: 80,
    maxProgress: 100,
    reward: "100 LP + Energy Boost",
    status: "active",
    category: "energy",
    icon: "⚡"
  },
  {
    id: "task_3",
    title: "Level Up",
    description: "Reach level 3",
    progress: 1,
    maxProgress: 3,
    reward: "200 LP + Upgrade Unlock",
    status: "active", 
    category: "progression",
    icon: "⬆️"
  },
  {
    id: "task_4",
    title: "Coin Collector",
    description: "Collect 1000 coins",
    progress: 450,
    maxProgress: 1000,
    reward: "Special Character Unlock",
    status: "active",
    category: "collection",
    icon: "💰"
  },
  {
    id: "task_5",
    title: "VIP Achievement", 
    description: "Purchase VIP membership",
    progress: 0,
    maxProgress: 1,
    reward: "VIP Benefits Access",
    status: "locked",
    category: "premium",
    icon: "👑"
  }
];

// Dynamic task calculation based on real user data
export const calculateDynamicTasks = (userStats: any): Task[] => {
  const baseTasks: Omit<Task, 'progress' | 'status'>[] = [
    {
      id: "task_1",
      title: "First Tap",
      description: "Tap your character 5 times",
      maxProgress: 5,
      reward: "50 LP",
      category: "basic",
      icon: "👆"
    },
    {
      id: "task_2", 
      title: "Energy Master",
      description: "Reach maximum energy",
      maxProgress: 100,
      reward: "100 LP + Energy Boost",
      category: "energy",
      icon: "⚡"
    },
    {
      id: "task_3",
      title: "Level Up",
      description: "Reach level 3",
      maxProgress: 3,
      reward: "200 LP + Upgrade Unlock",
      category: "progression",
      icon: "⬆️"
    },
    {
      id: "task_4",
      title: "LP Collector",
      description: "Earn 1000 LP total",
      maxProgress: 1000,
      reward: "Special Character Unlock",
      category: "collection",
      icon: "💰"
    }
  ];

  return baseTasks.map(task => {
    let progress = 0;
    
    switch (task.id) {
      case "task_1": // First Tap
        progress = Math.min(userStats.totalTaps || 0, task.maxProgress);
        break;
      case "task_2": // Energy Master  
        progress = Math.min(userStats.energy || 0, task.maxProgress);
        break;
      case "task_3": // Level Up
        progress = Math.min(userStats.level || 1, task.maxProgress);
        break;
      case "task_4": // LP Collector
        progress = Math.min(userStats.lp || 0, task.maxProgress);
        break;
    }
    
    const status: Task['status'] = progress >= task.maxProgress ? 'completed' : 'active';
    
    return {
      ...task,
      progress,
      status
    };
  });
};

export const getTasksByCategory = (category?: string, userStats?: any) => {
  const dynamicTasks = userStats ? calculateDynamicTasks(userStats) : mockTasks;
  if (!category || category === "all") return dynamicTasks;
  return dynamicTasks.filter(task => task.category === category);
};

export const claimTaskReward = (taskId: string) => {
  console.log("Task claimed successfully");
  return { success: true, reward: "Task reward claimed!" };
};

export default function Task({ onClaimPrize }: { onClaimPrize?: () => void }) {
  
  // All GUI  should be in GameGUI.tsx
  return null;
}
