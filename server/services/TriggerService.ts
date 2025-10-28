import { MediaStorage } from "../../shared/MediaStorage";
import { SupabaseStorage } from "../../shared/SupabaseStorage";

export interface TriggerEvent {
  userId: string;
  characterId: string;
  type: 'chat' | 'level_up' | 'task_claim' | 'achievement_claim' | 'time_tick';
  text?: string; // for chat
  tags?: string[]; // explicit tag unlocks
  reward?: any; // from tasks/achievements/levels
}

// Lightweight in-memory booster map per user to influence random selection weights
class BoosterEngine {
  private static instance: BoosterEngine;
  private boosts = new Map<string, Map<string, number>>(); // userId -> tag -> boost multiplier
  private decayHalfLifeMs = 15 * 60 * 1000; // 15 minutes
  private lastUpdate = new Map<string, number>();

  static getInstance() {
    if (!BoosterEngine.instance) BoosterEngine.instance = new BoosterEngine();
    return BoosterEngine.instance;
  }

  private decay(userId: string) {
    const now = Date.now();
    const last = this.lastUpdate.get(userId) || now;
    const delta = now - last;
    if (delta <= 0) return;

    const map = this.boosts.get(userId);
    if (!map) return;

    const decayFactor = Math.pow(0.5, delta / this.decayHalfLifeMs);
    for (const [tag, mult] of map.entries()) {
      const next = 1 + (mult - 1) * decayFactor;
      if (next <= 1.02) {
        map.delete(tag);
      } else {
        map.set(tag, next);
      }
    }
    this.lastUpdate.set(userId, now);
  }

  getEffectiveWeight(userId: string, tags: string[], baseWeight = 1): number {
    this.decay(userId);
    const map = this.boosts.get(userId);
    if (!map) return baseWeight;
    let weight = baseWeight;
    for (const t of tags) {
      const mult = map.get(t);
      if (mult) weight *= mult;
    }
    return weight;
  }

  boostTags(userId: string, tags: string[], factor = 1.5) {
    this.decay(userId);
    const map = this.boosts.get(userId) || new Map<string, number>();
    for (const t of tags) {
      const current = map.get(t) || 1;
      map.set(t, Math.min(current * factor, 5)); // cap
    }
    this.boosts.set(userId, map);
    this.lastUpdate.set(userId, Date.now());
  }
}

export class TriggerService {
  private static instance: TriggerService;
  private media = MediaStorage.getInstance();
  private storage = SupabaseStorage.getInstance();
  private boosters = BoosterEngine.getInstance();

  static getInstance() {
    if (!TriggerService.instance) TriggerService.instance = new TriggerService();
    return TriggerService.instance;
  }

  async handle(event: TriggerEvent) {
    switch (event.type) {
      case 'chat':
        await this.onChat(event);
        break;
      case 'level_up':
        await this.onLevelUp(event);
        break;
      case 'task_claim':
      case 'achievement_claim':
        await this.onReward(event);
        break;
      case 'time_tick':
        await this.onTick(event);
        break;
    }
  }

  private async onChat(e: TriggerEvent) {
    if (!e.text) return;
    const text = e.text.toLowerCase();
    const keywordTagMap: Record<string, string[]> = {
      wave: ['pose:wave'],
      wink: ['pose:wink'],
      sleepy: ['mood:sleepy'],
      happy: ['mood:happy'],
      beach: ['set:beach'],
      halloween: ['event:halloween2025']
    };
    const hitTags = Object.entries(keywordTagMap)
      .filter(([k]) => text.includes(k))
      .flatMap(([, v]) => v);
    if (hitTags.length) this.boosters.boostTags(e.userId, hitTags, 1.6);
  }

  private async onLevelUp(e: TriggerEvent) {
    // Simple boost on level milestone
    const user = await this.storage.getUser(e.userId);
    if (!user) return;
    const tags = [`level:${user.level}`];
    this.boosters.boostTags(e.userId, tags, 1.4);
  }

  private async onReward(e: TriggerEvent) {
    const reward = e.reward;
    if (!reward) return;
    // Recognize unlock reward patterns and boost related tags for visibility
    if (Array.isArray(reward)) {
      const unlockedTags = reward.filter((r: any) => r.type === 'mediaTagUnlock').map((r: any) => r.tag);
      if (unlockedTags.length) this.boosters.boostTags(e.userId, unlockedTags, 2.0);
    }
  }

  private async onTick(e: TriggerEvent) {
    // Time-based nudge: lightly boost event or daily tags during certain UTC hours
    const hour = new Date().getUTCHours();
    if (hour === 0) this.boosters.boostTags(e.userId, ['daily:reset'], 1.3);
  }

  // Helper to get a weighted random item considering user boosts
  async getRandomForChat(userId: string, characterId: string) {
    const list = await this.media.getMediaByCharacter(characterId, { enabledForRandomSend: true });
    if (list.length === 0) return undefined;

    const weights = list.map(m => {
      const tags: string[] = (m as any).tags || [];
      const base = (m as any).sendWeight || 1;
      return this.boosters.getEffectiveWeight(userId, tags, base);
    });
    const sum = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum;
    for (let i = 0; i < list.length; i++) {
      r -= weights[i];
      if (r <= 0) return list[i];
    }
    return list[list.length - 1];
  }
}
