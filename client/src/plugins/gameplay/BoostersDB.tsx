/**
 * BoostersDB.tsx
 * Last Edited: 2025-08-17 by Steven
 *
 *
 *
 * Please leave a detailed description
 *      of each function you add
 */



// This file acts as a standalone data layer for the Boosters plugin.
// It contains the mock booster data and functions for data manipulation.
// It does NOT contain any React components or UI elements.

import type { Upgrade } from "@shared/schema";

// --- BOOSTER DATA TYPES ---

export type BoosterData = {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  hourlyBonus: number;
  tapBonus: number;
  maxLevel: number;
  requiredLevel: number;
  icon: string;
  level: number;
};

// Static booster definitions - in production these would come from backend
let mockBoosters: BoosterData[] = [
  {
    id: "special-talent",
    name: "Special Talent",
    description: "Unlock unique abilities and earn more LP.",
    baseCost: 100,
    hourlyBonus: 10,
    tapBonus: 0,
    maxLevel: 10,
    requiredLevel: 1,
    icon: "star",
    level: 0,
  },
  {
    id: "gift-selection",
    name: "Gift Selection",
    description: "Find better gifts and receive more LP.",
    baseCost: 250,
    hourlyBonus: 25,
    tapBonus: 0,
    maxLevel: 15,
    requiredLevel: 5,
    icon: "gift",
    level: 0,
  },
  {
    id: "active-listening",
    name: "Active Listening",
    description: "Your character pays better attention, increasing hourly LP.",
    baseCost: 500,
    hourlyBonus: 50,
    tapBonus: 0,
    maxLevel: 20,
    requiredLevel: 10,
    icon: "headphones",
    level: 0,
  },
  {
    id: "date-experience",
    name: "Date Experience",
    description: "Boosts your LP gain from successful dates.",
    baseCost: 750,
    hourlyBonus: 0,
    tapBonus: 5,
    maxLevel: 25,
    requiredLevel: 15,
    icon: "heart",
    level: 0,
  },
  {
    id: "cooking-mastery",
    name: "Cooking Mastery",
    description: "Improves your cooking skills for a passive LP bonus.",
    baseCost: 1000,
    hourlyBonus: 100,
    tapBonus: 0,
    maxLevel: 30,
    requiredLevel: 20,
    icon: "chefhat",
    level: 0,
  },
];

// --- CORE FUNCTIONS (API Mock) ---

/**
 * Simulates fetching all boosters from the database.
 * @returns {Promise<BoosterData[]>} A promise that resolves with an array of boosters.
 */
export const fetchBoosters = async (): Promise<BoosterData[]> => {
  // Simulate a network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockBoosters;
};

/**
 * Simulates creating a new booster in the database.
 * @param {BoosterData} boosterData The new booster's data.
 * @returns {Promise<BoosterData>} A promise that resolves with the created booster.
 */
export const createBooster = async (boosterData: Omit<BoosterData, "id" | "level">): Promise<BoosterData> => {
  // Simulate a network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  const newBooster: BoosterData = {
    ...boosterData,
    id: `booster_${Date.now()}`,
    level: 0,
  };
  mockBoosters.push(newBooster);
  return newBooster;
};

/**
 * Simulates deleting a booster from the database.
 * @param {string} boosterId The ID of the booster to delete.
 * @returns {Promise<void>} A promise that resolves when the booster is deleted.
 */
export const deleteBooster = async (boosterId: string): Promise<void> => {
  // Simulate a network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  mockBoosters = mockBoosters.filter(b => b.id !== boosterId);
};


