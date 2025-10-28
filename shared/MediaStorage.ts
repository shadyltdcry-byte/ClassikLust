import { promises as fs } from 'fs';
import { join } from 'path';
import type { MediaFile } from './schema';

export interface MediaQueryOptions {
  tags?: string[];
  nsfw?: boolean;
  vip?: boolean;
  enabledForChat?: boolean;
  enabledForRandomSend?: boolean;
  limit?: number;
}

export interface RandomOptions extends MediaQueryOptions {
  excludeRecentSeconds?: number;
  diversityTags?: string[]; // prefer different tags than last sent
}

export class MediaStorage {
  private static instance: MediaStorage;
  private basePath: string;
  private cache: Map<string, MediaFile[]> = new Map();
  private indexByCharacter: Map<string, string[]> = new Map();
  private indexByTag: Map<string, string[]> = new Map();

  constructor() {
    this.basePath = join(process.cwd(), 'character-data');
    MediaStorage.instance = this;
    console.log('[MediaStorage] Initialized');
  }

  static getInstance(): MediaStorage {
    if (!MediaStorage.instance) MediaStorage.instance = new MediaStorage();
    return MediaStorage.instance;
  }

  private async readCharacterMedia(characterId: string): Promise<MediaFile[]> {
    const key = `${characterId}/media/index.json`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const filePath = join(this.basePath, characterId, 'media', 'index.json');
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      const list: MediaFile[] = JSON.parse(raw) || [];
      this.cache.set(key, list);
      this.buildIndexes(characterId, list);
      return list;
    } catch {
      await fs.mkdir(join(this.basePath, characterId, 'media'), { recursive: true });
      await fs.writeFile(filePath, '[]', 'utf8');
      this.cache.set(key, []);
      this.buildIndexes(characterId, []);
      return [];
    }
  }

  private buildIndexes(characterId: string, list: MediaFile[]) {
    this.indexByCharacter.set(characterId, list.map(m => m.id as any));
    for (const m of list) {
      const tags: string[] = (m as any).tags || [];
      for (const t of tags) {
        const arr = this.indexByTag.get(t) || [];
        if (!arr.includes(m.id as any)) arr.push(m.id as any);
        this.indexByTag.set(t, arr);
      }
    }
  }

  private async writeCharacterMedia(characterId: string, list: MediaFile[]) {
    const key = `${characterId}/media/index.json`;
    const filePath = join(this.basePath, characterId, 'media', 'index.json');
    await fs.mkdir(join(this.basePath, characterId, 'media'), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(list, null, 2), 'utf8');
    this.cache.set(key, list);
    this.buildIndexes(characterId, list);
  }

  async getMediaByCharacter(characterId: string, opts: MediaQueryOptions = {}): Promise<MediaFile[]> {
    const list = await this.readCharacterMedia(characterId);
    let filtered = list;

    if (opts.enabledForChat !== undefined) filtered = filtered.filter(m => m.enabledForChat === opts.enabledForChat);
    if (opts.enabledForRandomSend !== undefined) filtered = filtered.filter(m => (m as any).enabledForRandomSend === opts.enabledForRandomSend);
    if (opts.vip !== undefined) filtered = filtered.filter(m => m.isVip === opts.vip);
    if (opts.nsfw !== undefined) filtered = filtered.filter(m => m.isNsfw === opts.nsfw);
    if (opts.tags && opts.tags.length) {
      filtered = filtered.filter(m => {
        const tags: string[] = (m as any).tags || [];
        return opts.tags!.every(t => tags.includes(t));
      });
    }

    if (opts.limit && filtered.length > opts.limit) return filtered.slice(0, opts.limit);
    return filtered;
  }

  async upsertMedia(characterId: string, item: any): Promise<any> {
    const list = await this.readCharacterMedia(characterId);
    const idx = list.findIndex(m => m.id === item.id);
    const now = new Date();
    if (idx === -1) list.push({ ...item, updatedAt: now } as any);
    else list[idx] = { ...list[idx], ...item, updatedAt: now } as any;
    await this.writeCharacterMedia(characterId, list);
    return item;
  }

  async deleteMedia(characterId: string, id: string): Promise<boolean> {
    const list = await this.readCharacterMedia(characterId);
    const next = list.filter(m => m.id !== id);
    if (next.length === list.length) return false;
    await this.writeCharacterMedia(characterId, next);
    return true;
  }

  // Weighted random selection with simple anti-repeat hook (cooldown handled at route level)
  async getRandomMedia(characterId: string, opts: RandomOptions = {}): Promise<MediaFile | undefined> {
    const pool = await this.getMediaByCharacter(characterId, { ...opts, enabledForRandomSend: true });
    if (pool.length === 0) return undefined;

    // weights
    const weights = pool.map(m => (m as any).sendWeight || 1);
    const sum = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  }
}
