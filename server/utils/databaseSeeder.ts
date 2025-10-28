/**
 * Database Seeder - Comprehensive Game Data Population
 * Last Updated: 2025-10-23
 * 
 * Populates all game systems with default data for testing and production
 */

import { SupabaseStorage } from "../../shared/SupabaseStorage";

const storage = SupabaseStorage.getInstance();

// Default upgrade templates
const DEFAULT_UPGRADES = [
  {
    id: "upgrade_basic_tap",
    name: "Enhanced Tapping",
    description: "Increases LP gained per tap",
    category: "lpPerTap",
    baseCost: 100,
    costMultiplier: 1.5,
    baseEffect: 1,
    effectMultiplier: 1.2,
    maxLevel: 25,
    icon: "👆",
    rarity: "common"
  },
  {
    id: "upgrade_idle_income",
    name: "Passive Income",
    description: "Generate LP automatically over time",
    category: "lpPerHour",
    baseCost: 250,
    costMultiplier: 1.8,
    baseEffect: 10,
    effectMultiplier: 1.5,
    maxLevel: 20,
    icon: "⏰",
    rarity: "common"
  },
  {
    id: "upgrade_energy_boost",
    name: "Energy Amplifier",
    description: "Increases maximum energy capacity",
    category: "energy",
    baseCost: 500,
    costMultiplier: 2.0,
    baseEffect: 50,
    effectMultiplier: 1.3,
    maxLevel: 15,
    icon: "⚡",
    rarity: "rare"
  },
  {
    id: "upgrade_lucky_charm",
    name: "Lucky Charm",
    description: "Chance for bonus LP on taps",
    category: "special",
    baseCost: 1000,
    costMltiplier: 2.5,
    baseEffect: 5, // 5% chance
    effectMultiplier: 1.1,
    maxLevel: 10,
    icon: "🍀",
    rarity: "legendary"
  },
  {
    id: "upgrade_combo_master",
    name: "Combo Master",
    description: "Build up combo multipliers for massive LP",
    category: "special",
    baseCost: 2000,
    costMultiplier: 3.0,
    baseEffect: 2, // 2x combo multiplier
    effectMultiplier: 1.2,
    maxLevel: 8,
    icon: "🔥",
    rarity: "legendary"
  }
];

// Default character templates
const DEFAULT_CHARACTERS = [
  {
    id: "char_default_girl",
    name: "Sakura",
    description: "A cheerful anime girl who loves tapping games",
    imageUrl: "/default-character.jpg",
    rarity: "common",
    stats: {
      charm: 85,
      energy: 90,
      luck: 75
    },
    unlockRequirement: {
      type: "default",
      value: 0
    },
    specialAbility: "Beginner's Luck: +10% LP for first 100 taps"
  },
  {
    id: "char_ninja_girl",
    name: "Kira",
    description: "A stealthy ninja with lightning-fast tapping skills",
    imageUrl: "/characters/ninja-girl.jpg",
    rarity: "rare",
    stats: {
      charm: 90,
      energy: 95,
      luck: 80
    },
    unlockRequirement: {
      type: "level",
      value: 5
    },
    specialAbility: "Shadow Strike: Every 10th tap deals 3x LP"
  },
  {
    id: "char_magical_girl",
    name: "Luna",
    description: "A magical girl with incredible powers",
    imageUrl: "/characters/magical-girl.jpg",
    rarity: "legendary",
    stats: {
      charm: 100,
      energy: 100,
      luck: 95
    },
    unlockRequirement: {
      type: "achievement",
      value: "achievement_wealthy"
    },
    specialAbility: "Moonlight Blessing: Doubles all LP gains for 30 seconds"
  }
];

// Default booster templates
const DEFAULT_BOOSTERS = [
  {
    id: "booster_double_lp",
    name: "Double LP",
    description: "Doubles LP gains for 5 minutes",
    duration: 300, // 5 minutes in seconds
    effect: { type: "multiplier", stat: "lp", value: 2.0 },
    cost: { type: "lp", value: 500 },
    icon: "💰",
    rarity: "common"
  },
  {
    id: "booster_energy_refill",
    name: "Energy Refill",
    description: "Instantly restores full energy",
    duration: 0, // Instant effect
    effect: { type: "restore", stat: "energy", value: 1000 },
    cost: { type: "lp", value: 200 },
    icon: "⚡",
    rarity: "common"
  },
  {
    id: "booster_mega_multiplier",
    name: "Mega Multiplier",
    description: "5x LP gains for 2 minutes",
    duration: 120, // 2 minutes
    effect: { type: "multiplier", stat: "lp", value: 5.0 },
    cost: { type: "lp", value: 2000 },
    icon: "🚀",
    rarity: "legendary"
  }
];

// Default wheel segments
const DEFAULT_WHEEL_SEGMENTS = [
  { id: "wheel_lp_small", name: "50 LP", probability: 0.25, reward: { type: "lp", value: 50 }, color: "#FFD700" },
  { id: "wheel_lp_medium", name: "100 LP", probability: 0.20, reward: { type: "lp", value: 100 }, color: "#FF6B6B" },
  { id: "wheel_lp_large", name: "250 LP", probability: 0.15, reward: { type: "lp", value: 250 }, color: "#4ECDC4" },
  { id: "wheel_energy", name: "Energy Refill", probability: 0.15, reward: { type: "energy", value: 500 }, color: "#45B7D1" },
  { id: "wheel_booster", name: "2x LP Booster", probability: 0.10, reward: { type: "booster", value: "booster_double_lp" }, color: "#96CEB4" },
  { id: "wheel_jackpot", name: "JACKPOT!", probability: 0.05, reward: { type: "lp", value: 1000 }, color: "#FECA57" },
  { id: "wheel_character", name: "Character Unlock", probability: 0.05, reward: { type: "character", value: "random" }, color: "#FF9FF3" },
  { id: "wheel_nothing", name: "Try Again", probability: 0.05, reward: { type: "nothing", value: 0 }, color: "#74B9FF" }
];

export async function seedDatabase() {
  console.log('🌱 [SEEDER] Starting database population...');
  
  try {
    // Seed Upgrades
    console.log('🔧 [SEEDER] Seeding upgrades...');
    for (const upgrade of DEFAULT_UPGRADES) {
      const { error } = await storage.supabase
        .from('upgrades')
        .upsert(upgrade, { onConflict: 'id' });
      
      if (error) {
        console.warn(`Failed to seed upgrade ${upgrade.id}:`, error.message);
      } else {
        console.log(`✅ Seeded upgrade: ${upgrade.name}`);
      }
    }
    
    // Seed Characters
    console.log('👾 [SEEDER] Seeding characters...');
    for (const character of DEFAULT_CHARACTERS) {
      const { error } = await storage.supabase
        .from('characters')
        .upsert(character, { onConflict: 'id' });
      
      if (error) {
        console.warn(`Failed to seed character ${character.id}:`, error.message);
      } else {
        console.log(`✅ Seeded character: ${character.name}`);
      }
    }
    
    // Seed Boosters
    console.log('🚀 [SEEDER] Seeding boosters...');
    for (const booster of DEFAULT_BOOSTERS) {
      const { error } = await storage.supabase
        .from('boosters')
        .upsert(booster, { onConflict: 'id' });
      
      if (error) {
        console.warn(`Failed to seed booster ${booster.id}:`, error.message);
      } else {
        console.log(`✅ Seeded booster: ${booster.name}`);
      }
    }
    
    // Seed Wheel Segments
    console.log('🎡 [SEEDER] Seeding wheel segments...');
    for (const segment of DEFAULT_WHEEL_SEGMENTS) {
      const { error } = await storage.supabase
        .from('wheelSegments')
        .upsert(segment, { onConflict: 'id' });
      
      if (error) {
        console.warn(`Failed to seed wheel segment ${segment.id}:`, error.message);
      } else {
        console.log(`✅ Seeded wheel segment: ${segment.name}`);
      }
    }
    
    console.log('🎉 [SEEDER] Database seeding completed successfully!');
    console.log('📋 [SEEDER] Summary:');
    console.log(`  - ${DEFAULT_UPGRADES.length} upgrades`);
    console.log(`  - ${DEFAULT_CHARACTERS.length} characters`);
    console.log(`  - ${DEFAULT_BOOSTERS.length} boosters`);
    console.log(`  - ${DEFAULT_WHEEL_SEGMENTS.length} wheel segments`);
    
  } catch (error: any) {
    console.error('🔴 [SEEDER] Fatal error during seeding:', error);
    throw error;
  }
}

// Individual seeding functions for modular use
export async function seedUpgrades() {
  console.log('🔧 [SEEDER] Seeding upgrades only...');
  for (const upgrade of DEFAULT_UPGRADES) {
    const { error } = await storage.supabase
      .from('upgrades')
      .upsert(upgrade, { onConflict: 'id' });
    
    if (!error) {
      console.log(`✅ Seeded: ${upgrade.name}`);
    }
  }
}

export async function seedCharacters() {
  console.log('👾 [SEEDER] Seeding characters only...');
  for (const character of DEFAULT_CHARACTERS) {
    const { error } = await storage.supabase
      .from('characters')
      .upsert(character, { onConflict: 'id' });
    
    if (!error) {
      console.log(`✅ Seeded: ${character.name}`);
    }
  }
}

// Quick development reset function
export async function resetUserProgress(userId: string) {
  console.log(`🔄 [SEEDER] Resetting progress for user ${userId}...`);
  
  const tables = ['userUpgrades', 'userTasks', 'userAchievements', 'userBoosters'];
  
  for (const table of tables) {
    const { error } = await storage.supabase
      .from(table)
      .delete()
      .eq('userId', userId);
    
    if (!error) {
      console.log(`✅ Cleared ${table}`);
    }
  }
  
  // Reset user stats to defaults
  const { error } = await storage.supabase
    .from('users')
    .update({
      lp: 1000,
      energy: 1000,
      level: 1,
      totalTaps: 0,
      upgradesPurchased: 0,
      tasksCompleted: 0
    })
    .eq('id', userId);
    
  if (!error) {
    console.log(`✅ Reset user stats`);
  }
  
  console.log('🎉 User progress reset complete!');
}