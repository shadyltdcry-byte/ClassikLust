
/**
 * GameManagerDB.tsx  
 *
 * Core helper for energy regeneration and taps 
 * Last Edited: 2025-08-18 by Assistant
 * 
 * ⚠️ DO NOT PUT LOGIC HERE - This is purely for DB operations
 */

import fs from 'fs';
import path from 'path';

// Constants
export const TAP_VALUE = 1;
export const ENERGY_COST = 1;
export const MAX_ENERGY = 1000;
export const ENERGY_RECOVERY_RATE = 5;
export const PASSIVE_LP_RATE = 125;
export const PASSIVE_CAP_HOURS = 8;
export const PLAYER_DATA_DIR = './data/players';

// Types
interface Player {
  id: string;
  name: string;
  level: number;
  lp: number;
  energy: number;
  maxEnergy: number;
  lastLogin: number;
  upgrades?: any[];
  activeBoosters?: any;
  isVIP?: boolean;
}

// Ensure the player directory exists
export const createPlayerFolder = (playerId: string): void => {
  const playerDirPath = path.join(PLAYER_DATA_DIR, playerId);
  if (!fs.existsSync(playerDirPath)) {
    fs.mkdirSync(playerDirPath, { recursive: true });
  }
};

// Player management functions
export const getPlayer = async (playerId: string): Promise<Player> => {
  createPlayerFolder(playerId);
  const playerPath = path.join(PLAYER_DATA_DIR, playerId, 'player.json');
  
  if (fs.existsSync(playerPath)) {
    const fileContent = fs.readFileSync(playerPath, 'utf8');
    return JSON.parse(fileContent);
  }
  
  // Return default player
  return {
    id: playerId,
    name: `Player ${playerId}`,
    level: 1,
    lp: 5000,
    energy: 800,
    maxEnergy: 1000,
    lastLogin: Date.now()
  };
};

export const updatePlayer = async (playerId: string, player: Player): Promise<void> => {
  createPlayerFolder(playerId);
  const playerPath = path.join(PLAYER_DATA_DIR, playerId, 'player.json');
  fs.writeFileSync(playerPath, JSON.stringify(player, null, 2));
};

// Save conversation to a JSON file
export const saveConversation = async (playerId: string, conversation: any): Promise<void> => {
  createPlayerFolder(playerId);
  const playerConversationPath = path.join(PLAYER_DATA_DIR, playerId, 'conversations.json');

  let conversations: any[] = [];
  if (fs.existsSync(playerConversationPath)) {
    const fileContent = fs.readFileSync(playerConversationPath, 'utf8');
    conversations = JSON.parse(fileContent);
  }
  conversations.push(conversation);

  fs.writeFileSync(playerConversationPath, JSON.stringify(conversations, null, 2));
};

// Fetch conversations for a player from a JSON file
export const fetchConversations = async (playerId: string): Promise<any[]> => {
  const playerConversationPath = path.join(PLAYER_DATA_DIR, playerId, 'conversations.json');

  if (fs.existsSync(playerConversationPath)) {
    const fileContent = fs.readFileSync(playerConversationPath, 'utf8');
    return JSON.parse(fileContent);
  }
  return [];
};

export const handleTap = async (playerId: string): Promise<Player> => {
  const player = await getPlayer(playerId);
  if (player.energy <= 0) {
    throw new Error("Not enough energy!");
  }
  player.lp += TAP_VALUE;
  player.energy -= ENERGY_COST;
  await updatePlayer(playerId, player);
  return player;
};

export const calculatePassiveIncome = async (playerId: string): Promise<Player> => {
  const player = await getPlayer(playerId);
  const now = Date.now();
  const lastLogin = player.lastLogin || now;
  const elapsedHours = Math.floor((now - lastLogin) / (1000 * 60 * 60));
  const cappedHours = Math.min(elapsedHours, PASSIVE_CAP_HOURS);
  const earned = cappedHours * PASSIVE_LP_RATE;
  player.lp += earned;
  player.lastLogin = now;
  await updatePlayer(playerId, player);
  return player;
};

export const recoverEnergy = async (playerId: string): Promise<Player> => {
  const player = await getPlayer(playerId);
  if (player.energy < MAX_ENERGY) {
    player.energy = Math.min(player.energy + ENERGY_RECOVERY_RATE, MAX_ENERGY);
    await updatePlayer(playerId, player);
  }
  return player;
};

export const onPlayerLogin = async (playerId: string): Promise<Player> => {
  let player = await calculatePassiveIncome(playerId);
  await recoverEnergy(playerId);
  player.lastLogin = Date.now();
  await updatePlayer(playerId, player);
  return player;
};
