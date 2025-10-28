/**
 * Default Leveled Achievements
 * Based on user's preferred structure with scalable levels
 */

export interface LeveledAchievement {
  id: string;
  name: string;
  description: string;
  category: string;
  baseRequirement: {
    type: string;
    baseTarget: number;
    multiplier: number;
  };
  levels: {
    level: number;
    target: number;
    reward: {
      type: string;
      amount: number;
    };
  }[];
  maxLevel: number;
  icon: string;
  sortOrder: number;
}

export const DEFAULT_ACHIEVEMENTS: LeveledAchievement[] = [
  {
    id: "first-steps",
    name: "First Steps",
    description: "Tap a character to start your journey",
    category: "tapping",
    baseRequirement: {
      type: "totalTaps",
      baseTarget: 1,
      multiplier: 5
    },
    levels: [
      { level: 1, target: 1, reward: { type: "lp", amount: 100 } },
      { level: 2, target: 5, reward: { type: "lp", amount: 150 } },
      { level: 3, target: 25, reward: { type: "lp", amount: 200 } },
      { level: 4, target: 125, reward: { type: "lp", amount: 300 } },
      { level: 5, target: 625, reward: { type: "lp", amount: 500 } },
      { level: 6, target: 3125, reward: { type: "lp", amount: 750 } },
      { level: 7, target: 15625, reward: { type: "lp", amount: 1000 } },
      { level: 8, target: 78125, reward: { type: "lp", amount: 1500 } },
      { level: 9, target: 390625, reward: { type: "lp", amount: 2000 } },
      { level: 10, target: 1953125, reward: { type: "lp", amount: 3000 } }
    ],
    maxLevel: 10,
    icon: "🎯",
    sortOrder: 1
  },
  {
    id: "getting-started", 
    name: "Getting Started",
    description: "Level up to increase your power",
    category: "progression",
    baseRequirement: {
      type: "userLevel",
      baseTarget: 2,
      multiplier: 2
    },
    levels: [
      { level: 1, target: 2, reward: { type: "lp", amount: 500 } },
      { level: 2, target: 4, reward: { type: "lp", amount: 750 } },
      { level: 3, target: 8, reward: { type: "lp", amount: 1000 } },
      { level: 4, target: 16, reward: { type: "lp", amount: 1500 } },
      { level: 5, target: 32, reward: { type: "lp", amount: 2000 } },
      { level: 6, target: 64, reward: { type: "lp", amount: 3000 } },
      { level: 7, target: 128, reward: { type: "lp", amount: 4000 } },
      { level: 8, target: 256, reward: { type: "lp", amount: 6000 } },
      { level: 9, target: 512, reward: { type: "lp", amount: 8000 } },
      { level: 10, target: 1024, reward: { type: "lp", amount: 10000 } }
    ],
    maxLevel: 10,
    icon: "⬆️",
    sortOrder: 2
  },
  {
    id: "point-collector",
    name: "Point Collector", 
    description: "Accumulate Lust Points through gameplay",
    category: "progression",
    baseRequirement: {
      type: "totalLpEarned",
      baseTarget: 1000,
      multiplier: 10
    },
    levels: [
      { level: 1, target: 1000, reward: { type: "lp", amount: 200 } },
      { level: 2, target: 10000, reward: { type: "lp", amount: 500 } },
      { level: 3, target: 100000, reward: { type: "lp", amount: 1000 } },
      { level: 4, target: 1000000, reward: { type: "lp", amount: 2000 } },
      { level: 5, target: 10000000, reward: { type: "lp", amount: 5000 } },
      { level: 6, target: 100000000, reward: { type: "lp", amount: 10000 } },
      { level: 7, target: 1000000000, reward: { type: "lp", amount: 20000 } },
      { level: 8, target: 10000000000, reward: { type: "lp", amount: 50000 } },
      { level: 9, target: 100000000000, reward: { type: "lp", amount: 100000 } },
      { level: 10, target: 1000000000000, reward: { type: "lp", amount: 250000 } }
    ],
    maxLevel: 10,
    icon: "💰",
    sortOrder: 3
  },
  {
    id: "chat-enthusiast",
    name: "Chat Enthusiast",
    description: "Send messages to characters",
    category: "chatting",
    baseRequirement: {
      type: "chatMessagesSent",
      baseTarget: 1,
      multiplier: 3
    },
    levels: [
      { level: 1, target: 1, reward: { type: "lp", amount: 100 } },
      { level: 2, target: 3, reward: { type: "lp", amount: 200 } },
      { level: 3, target: 9, reward: { type: "lp", amount: 300 } },
      { level: 4, target: 27, reward: { type: "lp", amount: 500 } },
      { level: 5, target: 81, reward: { type: "lp", amount: 750 } },
      { level: 6, target: 243, reward: { type: "lp", amount: 1000 } },
      { level: 7, target: 729, reward: { type: "lp", amount: 1500 } },
      { level: 8, target: 2187, reward: { type: "lp", amount: 2000 } },
      { level: 9, target: 6561, reward: { type: "lp", amount: 3000 } },
      { level: 10, target: 19683, reward: { type: "lp", amount: 5000 } }
    ],
    maxLevel: 10,
    icon: "💬",
    sortOrder: 4
  },
  {
    id: "energy-master",
    name: "Energy Master",
    description: "Use energy through gameplay",
    category: "interaction",
    baseRequirement: {
      type: "totalEnergyUsed",
      baseTarget: 100,
      multiplier: 5
    },
    levels: [
      { level: 1, target: 100, reward: { type: "lp", amount: 150 } },
      { level: 2, target: 500, reward: { type: "lp", amount: 300 } },
      { level: 3, target: 2500, reward: { type: "lp", amount: 500 } },
      { level: 4, target: 12500, reward: { type: "lp", amount: 750 } },
      { level: 5, target: 62500, reward: { type: "lp", amount: 1000 } },
      { level: 6, target: 312500, reward: { type: "lp", amount: 1500 } },
      { level: 7, target: 1562500, reward: { type: "lp", amount: 2000 } },
      { level: 8, target: 7812500, reward: { type: "lp", amount: 3000 } },
      { level: 9, target: 39062500, reward: { type: "lp", amount: 4000 } },
      { level: 10, target: 195312500, reward: { type: "lp", amount: 6000 } }
    ],
    maxLevel: 10,
    icon: "⚡",
    sortOrder: 5
  }
];