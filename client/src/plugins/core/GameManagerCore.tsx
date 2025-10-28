// GameManagerCore.ts
/**
 * GameManagerCore.ts
 * Singleton game logic manager for taps, energy, LP, boosters, and wheel
 * Last Edited: 2025-08-19 by Assistant
 */

export interface PlayerData {
  id: string;
  level: number;
  lp: number;
  energy: number;
  maxEnergy: number;
  lpPerTap: number;
  lpPerHour: number;
  boosters?: string[];
}

export interface WheelPrize {
  id: number;
  name: string;
  type: string; // "LP" | "Booster" | "Item"
  amount: number;
  rarity: string;
}

class GameManagerCoreClass {
  players: Record<string, PlayerData> = {};

  wheelPrizes: WheelPrize[] = [
    { id: 1, name: "100 LP", type: "LP", amount: 100, rarity: "Common" },
    { id: 2, name: "Booster", type: "Booster", amount: 1, rarity: "Rare" },
    { id: 3, name: "500 LP", type: "LP", amount: 500, rarity: "Uncommon" },
    { id: 4, name: "1000 LP", type: "LP", amount: 1000, rarity: "Epic" },
  ];

  energyRecoveryRate = 5;
  energyRecoveryInterval = 5000; // ms
  maxEnergy = 1000;

  constructor() {
    // Start energy regen loop
    setInterval(() => this.regenEnergyAll(), this.energyRecoveryInterval);
  }

  // --------------------
  // Player methods
  // --------------------
  getPlayer(id: string): PlayerData {
    if (!this.players[id]) {
      this.players[id] = {
        id,
        level: 1,
        lp: 5000,
        energy: 800,
        maxEnergy: this.maxEnergy,
        lpPerTap: 2,
        lpPerHour: 125,
        boosters: [],
      };
    }
    return this.players[id];
  }

  tap(playerId: string): PlayerData | null {
    const player = this.getPlayer(playerId);
    if (player.energy <= 0) return null;
    player.lp += player.lpPerTap;
    player.energy = Math.max(0, player.energy - 1);
    return player;
  }

  regenEnergyAll() {
    Object.values(this.players).forEach(player => {
      player.energy = Math.min(player.maxEnergy, player.energy + this.energyRecoveryRate);
    });
  }

  // --------------------
  // Wheel methods
  // --------------------
  getWheelPrizes(): WheelPrize[] {
    return this.wheelPrizes;
  }

  awardWheelPrize(playerId: string, prize: WheelPrize): PlayerData {
    const player = this.getPlayer(playerId);
    switch(prize.type) {
      case "LP":
        player.lp += prize.amount;
        break;
      case "Booster":
        player.boosters?.push(prize.name);
        break;
      case "Item":
        // add item logic here
        break;
    }
    return player;
  }
}

// Export singleton instance
const GameManagerCore = new GameManagerCoreClass();
export default GameManagerCore;