/**
 * GameProvider.tsx - Central Game State Management
 * Last Edited: 2025-10-24 by Assistant - Purged upgrade defaults for JSON-first architecture
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';

// Types based on your game's requirements
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
  xp: number;
  xpToNext: number;
  avatar?: string;
  lastTickTimestamp: number;
  offlineMultiplier: number;
  pendingOfflineLP?: number;
  offlineDuration?: number;
  isVip: boolean;
  nsfwEnabled: boolean;
  charismaPoints: number;

  // Active effects
  activeBoosters: Array<{
    id: string;
    name: string;
    effect: string;
    duration: number;
    startTime: number;
  }>;

  // Character data
  selectedCharacter?: any;
  characters: any[];
  inventory: any[];

  // Progress tracking
  achievements: string[];
  completedTasks: string[];
  dailyRewardsClaimed: string[];

  // Settings
  settings: {
    soundEnabled: boolean;
    notificationsEnabled: boolean;
    autoSave: boolean;
  };
}

interface GameState {
  playerData: PlayerData;
  isLoading: boolean;
  lastSaveTime: number;
  gameVersion: string;
  
  // API-loaded data (no defaults)
  upgrades: any[];
  tasks: any[];
  achievements: any[];
}

type GameAction =
  | { type: 'SET_PLAYER_DATA'; payload: Partial<PlayerData> }
  | { type: 'TAP'; payload?: { multiplier?: number } }
  | { type: 'UPDATE_TICK' }
  | { type: 'LEVEL_UP' }
  | { type: 'SELECT_CHARACTER'; payload: any }
  | { type: 'ADD_CHARACTER'; payload: any }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SYNC_WITH_SERVER'; payload: Partial<PlayerData> }
  | { type: 'CLAIM_OFFLINE_LP' }
  | { type: 'SET_UPGRADES'; payload: any[] }
  | { type: 'SET_TASKS'; payload: any[] }
  | { type: 'SET_ACHIEVEMENTS'; payload: any[] }
  | { type: 'RESET_GAME' };

// Generate a proper UUID for the player
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const getStoredUserId = () => {
  return localStorage.getItem('telegramUserId') || generateUUID();
};

const initialPlayerData: PlayerData = {
  id: getStoredUserId(),
  name: 'Player',
  level: 1,
  lp: 5000,
  lpPerHour: 100,
  lpPerTap: 10,
  energy: 1000,
  maxEnergy: 1000,
  coins: 0,
  xp: 0,
  xpToNext: 100,
  lastTickTimestamp: Date.now(),
  offlineMultiplier: 1,
  isVip: false,
  nsfwEnabled: false,
  charismaPoints: 0,
  activeBoosters: [],
  selectedCharacter: null,
  characters: [],
  inventory: [],
  achievements: [],
  completedTasks: [],
  dailyRewardsClaimed: [],
  settings: {
    soundEnabled: true,
    notificationsEnabled: true,
    autoSave: true,
  },
};

const initialState: GameState = {
  playerData: initialPlayerData,
  isLoading: true,
  lastSaveTime: Date.now(),
  gameVersion: '1.0.0',
  // API-loaded data starts empty
  upgrades: [],
  tasks: [],
  achievements: [],
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_PLAYER_DATA':
      return {
        ...state,
        playerData: { ...state.playerData, ...action.payload },
      };

    case 'TAP':
      const tapMultiplier = action.payload?.multiplier || 1;
      const tapReward = Math.floor(state.playerData.lpPerTap * tapMultiplier);
      const energyCost = 1;

      if (state.playerData.energy < energyCost) {
        return state;
      }

      return {
        ...state,
        playerData: {
          ...state.playerData,
          lp: state.playerData.lp + tapReward,
          energy: Math.max(0, state.playerData.energy - energyCost),
          xp: state.playerData.xp + Math.floor(tapReward / 10),
        },
      };

    case 'UPDATE_TICK':
      const now = Date.now();
      const timeDiff = now - state.playerData.lastTickTimestamp;
      const hoursPassed = timeDiff / (1000 * 60 * 60);

      const energyRegenRate = 1 / 3;
      const energyToAdd = Math.floor((timeDiff / 1000) * energyRegenRate);
      const newEnergy = Math.min(state.playerData.maxEnergy, state.playerData.energy + energyToAdd);

      const minOfflineMinutes = 5;
      const minutesPassed = timeDiff / (1000 * 60);
      
      if (minutesPassed < minOfflineMinutes) {
        return {
          ...state,
          playerData: {
            ...state.playerData,
            energy: newEnergy,
            lastTickTimestamp: now,
          },
        };
      }

      const maxOfflineHours = 3;
      const effectiveHours = Math.min(hoursPassed, maxOfflineHours);
      const offlineLP = Math.floor(state.playerData.lpPerHour * effectiveHours * state.playerData.offlineMultiplier);

      return {
        ...state,
        playerData: {
          ...state.playerData,
          pendingOfflineLP: offlineLP,
          offlineDuration: timeDiff,
          energy: newEnergy,
          lastTickTimestamp: now,
        },
      };

    case 'LEVEL_UP':
      if (state.playerData.xp < state.playerData.xpToNext) {
        return state;
      }

      const newLevel = state.playerData.level + 1;
      const remainingXP = state.playerData.xp - state.playerData.xpToNext;
      const newXPRequired = Math.floor(state.playerData.xpToNext * 1.5);

      return {
        ...state,
        playerData: {
          ...state.playerData,
          level: newLevel,
          xp: remainingXP,
          xpToNext: newXPRequired,
          maxEnergy: state.playerData.maxEnergy + 10,
          lpPerHour: state.playerData.lpPerHour + 5,
        },
      };

    case 'SELECT_CHARACTER':
      return {
        ...state,
        playerData: {
          ...state.playerData,
          selectedCharacter: action.payload,
        },
      };

    case 'ADD_CHARACTER':
      return {
        ...state,
        playerData: {
          ...state.playerData,
          characters: [...state.playerData.characters, action.payload],
        },
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SYNC_WITH_SERVER':
      return {
        ...state,
        playerData: { ...state.playerData, ...action.payload },
        lastSaveTime: Date.now(),
      };

    case 'CLAIM_OFFLINE_LP':
      const pendingLP = state.playerData.pendingOfflineLP || 0;
      return {
        ...state,
        playerData: {
          ...state.playerData,
          lp: state.playerData.lp + pendingLP,
          pendingOfflineLP: undefined,
          offlineDuration: undefined,
        },
      };

    case 'SET_UPGRADES':
      return {
        ...state,
        upgrades: action.payload,
      };

    case 'SET_TASKS':
      return {
        ...state,
        tasks: action.payload,
      };

    case 'SET_ACHIEVEMENTS':
      return {
        ...state,
        achievements: action.payload,
      };

    case 'RESET_GAME':
      return {
        ...initialState,
        isLoading: false,
      };

    default:
      return state;
  }
}

interface GameContextType {
  // State
  playerData: PlayerData;
  isLoading: boolean;
  gameVersion: string;
  upgrades: any[];
  tasks: any[];
  achievements: any[];

  // Actions
  setPlayerData: (data: Partial<PlayerData>) => void;
  tap: (multiplier?: number) => void;
  levelUp: () => void;
  selectCharacter: (character: any) => void;
  addCharacter: (character: any) => void;
  claimOfflineIncome: () => void;
  loadUpgrades: () => Promise<void>;
  loadTasks: () => Promise<void>;
  loadAchievements: () => Promise<void>;
  saveGame: () => Promise<void>;
  loadGame: () => Promise<void>;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: React.ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const saveToLocalStorage = (data: PlayerData) => {
    try {
      localStorage.setItem('gameData', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  };

  const loadFromLocalStorage = (): Partial<PlayerData> | null => {
    try {
      const saved = localStorage.getItem('gameData');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      return null;
    }
  };

  // Auto-save to localStorage
  useEffect(() => {
    if (!state.isLoading && state.playerData.settings.autoSave) {
      saveToLocalStorage(state.playerData);
    }
  }, [state.playerData, state.isLoading]);

  // Load game data on mount
  const loadGame = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const savedData = loadFromLocalStorage();
      if (savedData) {
        if (!savedData || (savedData.lp && savedData.lp <= 0) && (savedData.energy && savedData.energy <= 0) && (savedData.lpPerHour && savedData.lpPerHour <= 0)) {
          console.warn('Found invalid saved data, clearing localStorage');
          localStorage.removeItem('gameData');
          dispatch({ type: 'SET_PLAYER_DATA', payload: {
            lp: 5000,
            energy: 1000,
            maxEnergy: 1000,
            lpPerHour: 250,
            lpPerTap: 1.5,
            level: 1
          }});
        } else {
          dispatch({ type: 'SET_PLAYER_DATA', payload: savedData });
        }
      }

      // Sync with server
      try {
        const response = await apiRequest('GET', `/api/player/${state.playerData.id}`);
        if (response.ok) {
          const serverData = await response.json();
          dispatch({ type: 'SYNC_WITH_SERVER', payload: serverData });
          dispatch({ type: 'UPDATE_TICK' });
        }
      } catch (serverError) {
        console.warn('Failed to sync with server:', serverError);
        dispatch({ type: 'UPDATE_TICK' });
      }
    } catch (error) {
      console.error('Failed to load game:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.playerData.id]);

  // Load upgrades from API
  const loadUpgrades = useCallback(async () => {
    try {
      const response = await apiRequest('GET', `/api/upgrades?userId=${state.playerData.id}`);
      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SET_UPGRADES', payload: data.data || [] });
      }
    } catch (error) {
      console.error('Failed to load upgrades:', error);
      dispatch({ type: 'SET_UPGRADES', payload: [] });
    }
  }, [state.playerData.id]);

  // Load tasks from API
  const loadTasks = useCallback(async () => {
    try {
      const response = await apiRequest('GET', `/api/tasks?userId=${state.playerData.id}`);
      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SET_TASKS', payload: data.data || [] });
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      dispatch({ type: 'SET_TASKS', payload: [] });
    }
  }, [state.playerData.id]);

  // Load achievements from API
  const loadAchievements = useCallback(async () => {
    try {
      const response = await apiRequest('GET', `/api/achievements?userId=${state.playerData.id}`);
      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SET_ACHIEVEMENTS', payload: data.data || [] });
      }
    } catch (error) {
      console.error('Failed to load achievements:', error);
      dispatch({ type: 'SET_ACHIEVEMENTS', payload: [] });
    }
  }, [state.playerData.id]);

  // Save game data
  const saveGame = useCallback(async () => {
    try {
      saveToLocalStorage(state.playerData);
      await apiRequest('PUT', `/api/player/${state.playerData.id}`, state.playerData);
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  }, [state.playerData]);

  // Initialize game on mount
  useEffect(() => {
    loadGame();
  }, []);

  // Load API data after player is loaded
  useEffect(() => {
    if (!state.isLoading && state.playerData.id) {
      loadUpgrades();
      loadTasks();
      loadAchievements();
    }
  }, [state.isLoading, state.playerData.id, loadUpgrades, loadTasks, loadAchievements]);

  // Action creators
  const actions = {
    setPlayerData: (data: Partial<PlayerData>) =>
      dispatch({ type: 'SET_PLAYER_DATA', payload: data }),

    tap: (multiplier?: number) =>
      dispatch({ type: 'TAP', payload: { multiplier } }),

    levelUp: () =>
      dispatch({ type: 'LEVEL_UP' }),

    selectCharacter: (character: any) =>
      dispatch({ type: 'SELECT_CHARACTER', payload: character }),

    addCharacter: (character: any) =>
      dispatch({ type: 'ADD_CHARACTER', payload: character }),

    claimOfflineIncome: async () => {
      dispatch({ type: 'CLAIM_OFFLINE_LP' });
      
      try {
        await apiRequest('PUT', `/api/player/${state.playerData.id}`, {
          lastTick: new Date()
        });
      } catch (error) {
        console.warn('Failed to sync offline claim:', error);
      }
    },

    resetGame: () =>
      dispatch({ type: 'RESET_GAME' }),

    loadUpgrades,
    loadTasks,
    loadAchievements,
    saveGame,
    loadGame,
  };

  const contextValue: GameContextType = {
    playerData: state.playerData,
    isLoading: state.isLoading,
    gameVersion: state.gameVersion,
    upgrades: state.upgrades,
    tasks: state.tasks,
    achievements: state.achievements,
    ...actions,
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};