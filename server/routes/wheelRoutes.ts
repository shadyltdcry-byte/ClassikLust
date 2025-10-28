import type { Express, Request, Response } from 'express';
import { createSuccessResponse, createErrorResponse } from '../utils/helpers';
import { SupabaseStorage } from '../../shared/SupabaseStorage';
import { WheelStorage, WheelPrize } from '../../shared/WheelStorage';
import { FileStorage } from '../../shared/FileStorage';

const wheel = WheelStorage.getInstance();
const storage = SupabaseStorage.getInstance();
const files = FileStorage.getInstance();

function isEligible(prize: WheelPrize, user: any): boolean {
  if (prize.vipOnly && !user.vipStatus) return false;
  if (prize.nsfw && !user.nsfwConsent) return false;
  if (prize.minLevel && (user.level || 1) < prize.minLevel) return false;
  // event gating could check files.getSettings() or active tags; for now pass-through
  return true;
}

function weightedPick(items: { prize: WheelPrize; weight: number }[]): WheelPrize | null {
  const total = items.reduce((s, i) => s += i.weight, 0);
  if (total <= 0) return null;
  let r = Math.random() * total;
  for (const i of items) { r -= i.weight; if (r <= 0) return i.prize; }
  return items[items.length - 1].prize;
}

async function applyReward(user: any, prize: WheelPrize) {
  const updates: any = {};
  switch (prize.type) {
    case 'lp':
      updates.lp = (user.lp || 0) + (prize.amount || 0);
      break;
    case 'energy':
      updates.energy = Math.min(user.maxEnergy || 1000, (user.energy || 0) + (prize.amount || 0));
      break;
    case 'charisma':
      updates.charisma = (user.charisma || 0) + (prize.amount || 0);
      break;
    case 'mediaTagUnlock':
      // no DB write required for JSON unlock; boost via triggers elsewhere
      break;
    case 'booster':
      // placeholder: could insert into boosters with duration = amount minutes
      break;
    case 'upgradeId':
      // optional: grant a free level or discount marker in userUpgrades
      break;
  }
  if (Object.keys(updates).length) {
    await storage.supabase.from('users').update(updates).eq('id', user.id);
  }
}

export function registerWheelRoutes(app: Express) {
  // List prizes (JSON-first)
  app.get('/api/wheel/prizes', async (_req: Request, res: Response) => {
    try {
      const prizes = await wheel.getPrizes();
      res.json(prizes);
    } catch (e: any) {
      res.status(500).json(createErrorResponse(e.message || 'Failed to load prizes'));
    }
  });

  // Spin
  app.post('/api/wheel/spin', async (req: Request, res: Response) => {
    try {
      const { userId } = req.body || {};
      if (!userId) return res.status(400).json(createErrorResponse('userId is required'));

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json(createErrorResponse('User not found'));

      // Enforce cooldown from settings
      const settings = await files.getGameSettings();
      const hours = settings.wheelSpinCooldown ?? 24;
      const last = user.lastWheelSpin ? new Date(user.lastWheelSpin).getTime() : 0;
      const now = Date.now();
      if (last && now - last < hours * 3600 * 1000) {
        const remainMs = hours * 3600 * 1000 - (now - last);
        return res.status(429).json(createErrorResponse(`Cooldown: ${Math.ceil(remainMs/60000)} min left`));
      }

      const prizes = (await wheel.getPrizes()).filter(p => isEligible(p, user));
      if (prizes.length === 0) return res.status(404).json(createErrorResponse('No eligible prizes'));
      const picked = weightedPick(prizes.map(p => ({ prize: p, weight: p.weight })));
      if (!picked) return res.status(500).json(createErrorResponse('Spin failed'));

      await applyReward(user, picked);

      // Log reward and update cooldown
      await storage.supabase.from('wheelRewards').insert({
        userId,
        reward: picked.id,
        amount: picked.amount || 0,
      });
      await storage.supabase.from('users').update({ lastWheelSpin: new Date().toISOString() }).eq('id', userId);

      res.json(createSuccessResponse({ result: picked }));
    } catch (e: any) {
      res.status(500).json(createErrorResponse(e.message || 'Spin failed'));
    }
  });
}
