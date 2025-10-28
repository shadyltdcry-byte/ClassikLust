import { promises as fs } from 'fs';
import { join } from 'path';

(async () => {
  const file = join(process.cwd(), 'game-data', 'upgrades', 'passive-upgrades.json');
  try {
    const raw = await fs.readFile(file, 'utf8');
    const data = JSON.parse(raw || '[]');
    const exists = Array.isArray(data) && data.some((u: any) => u.id === 'offline-cap');
    if (!exists) {
      data.push({
        id: 'offline-cap',
        key: 'offline-cap',
        name: 'Offline Collector',
        description: 'Increases maximum time for offline LP accrual.',
        category: 'passive',
        icon: 'timer',
        baseCost: 800,
        baseEffect: 30,
        costMultiplier: 1.35,
        effectMultiplier: 30,
        maxLevel: 6,
        requiredLevel: 5,
        sortOrder: 60,
        hourlyBonus: 0,
        tapBonus: 0
      });
      await fs.writeFile(file, JSON.stringify(data, null, 2));
      console.log('Added offline-cap upgrade to passive-upgrades.json');
    } else {
      console.log('offline-cap already exists, no change');
    }
  } catch (e) {
    console.error('Failed to update passive-upgrades.json:', e);
  }
})();
