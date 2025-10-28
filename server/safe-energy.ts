import { SupabaseStorage } from '../shared/SupabaseStorage';
const storage = SupabaseStorage.getInstance();

const ENERGY_REGEN_INTERVAL = 60 * 1000; // 1 min
let energyInterval: NodeJS.Timeout | null = null;

async function regenerateEnergy() {
  try {
    // SupabaseStorage doesn't have getAllUsers method yet, disable energy regen for now
    console.log('[Energy Regen] Skipping - getAllUsers not implemented in SupabaseStorage');
    return;
  } catch (err) {
    console.error("[Energy Regen] Error:", err);
  }
}

export function startEnergyRegen() {
  if (energyInterval) return;
  energyInterval = setInterval(regenerateEnergy, ENERGY_REGEN_INTERVAL);
  console.log("[Energy Regen] Started.");
}
