import { promises as fs } from 'fs';
import { join } from 'path';

export interface WheelPrize {
  id: string;
  label: string;
  type: 'lp' | 'energy' | 'charisma' | 'booster' | 'mediaTagUnlock' | 'upgradeId';
  amount?: number;
  weight: number;
  vipOnly?: boolean;
  nsfw?: boolean;
  eventTag?: string;
  minLevel?: number;
}

export class WheelStorage {
  private static instance: WheelStorage;
  private cache: WheelPrize[] | null = null;
  private filePath = join(process.cwd(), 'game-data', 'wheel', 'prizes.json');

  static getInstance() {
    if (!WheelStorage.instance) WheelStorage.instance = new WheelStorage();
    return WheelStorage.instance;
  }

  async getPrizes(): Promise<WheelPrize[]> {
    if (this.cache) return this.cache;
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      this.cache = JSON.parse(raw) as WheelPrize[];
      return this.cache;
    } catch {
      await fs.mkdir(join(process.cwd(), 'game-data', 'wheel'), { recursive: true });
      const defaults: WheelPrize[] = [
        { id: 'lp_100', label: '+100 LP', type: 'lp', amount: 100, weight: 30 },
        { id: 'lp_300', label: '+300 LP', type: 'lp', amount: 300, weight: 15 },
        { id: 'energy_200', label: '+200 Energy', type: 'energy', amount: 200, weight: 20 },
        { id: 'charisma_10', label: '+10 Charisma', type: 'charisma', amount: 10, weight: 10 },
        { id: 'booster_tap2x', label: '2x Tap Booster (15m)', type: 'booster', amount: 15, weight: 8 },
        { id: 'unlock_event_tag', label: 'Unlock: Halloween Set', type: 'mediaTagUnlock', weight: 5, eventTag: 'event:halloween2025' },
        { id: 'upgrade_discount', label: 'Upgrade: mega-tap', type: 'upgradeId', weight: 3 },
        { id: 'lp_1000_vip', label: '+1000 LP (VIP)', type: 'lp', amount: 1000, weight: 2, vipOnly: true }
      ];
      await fs.writeFile(this.filePath, JSON.stringify(defaults, null, 2), 'utf8');
      this.cache = defaults;
      return defaults;
    }
  }
}
