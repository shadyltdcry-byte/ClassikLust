/**
 * upgradeLoaderRoutes.ts - LOADS UPGRADES FROM JSON FILES
 * This route loads upgrade definitions from game-data/upgrades/*.json
 * and syncs them with the database
 */

import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { SupabaseStorage } from '../shared/SupabaseStorage';

const router = Router();
const storage = SupabaseStorage.getInstance();

// Get the directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load all upgrade definitions from JSON files
 */
function loadUpgradeDefinitionsFromJSON(): any[] {
  try {
    const upgradesDir = path.join(__dirname, '../../game-data/upgrades');
    
    console.log('📂 [UPGRADE-LOADER] Loading upgrades from:', upgradesDir);
    
    if (!fs.existsSync(upgradesDir)) {
      console.error('❌ [UPGRADE-LOADER] Upgrades directory not found:', upgradesDir);
      return [];
    }
    
    const files = fs.readdirSync(upgradesDir).filter(f => f.endsWith('.json'));
    console.log('📂 [UPGRADE-LOADER] Found JSON files:', files);
    
    const allUpgrades: any[] = [];
    
    for (const file of files) {
      try {
        const filePath = path.join(upgradesDir, file);
        const rawContent = fs.readFileSync(filePath, 'utf-8');
        
        if (rawContent.trim() === '' || rawContent === '[]') {
          console.warn(`⚠️ [UPGRADE-LOADER] Empty file: ${file}`);
          continue;
        }
        
        const parsed = JSON.parse(rawContent);
        
        if (Array.isArray(parsed)) {
          console.log(`✅ [UPGRADE-LOADER] Loaded ${parsed.length} upgrades from ${file}`);
          allUpgrades.push(...parsed.map(upgrade => ({ 
            ...upgrade, 
            sourceFile: file,
            currentLevel: 0 // Initialize at 0
          })));
        } else if (parsed && typeof parsed === 'object') {
          console.log(`✅ [UPGRADE-LOADER] Loaded 1 upgrade from ${file}`);
          allUpgrades.push({ 
            ...parsed, 
            sourceFile: file,
            currentLevel: 0
          });
        } else {
          console.warn(`⚠️ [UPGRADE-LOADER] Invalid JSON structure in ${file}:`, parsed);
        }
      } catch (error) {
        console.error(`❌ [UPGRADE-LOADER] Failed to parse ${file}:`, error.message);
      }
    }
    
    console.log(`✅ [UPGRADE-LOADER] Total upgrades loaded: ${allUpgrades.length}`);
    return allUpgrades;
  } catch (error) {
    console.error('❌ [UPGRADE-LOADER] Error loading upgrade definitions:', error);
    return [];
  }
}

/**
 * GET /api/upgrades/definitions - Load upgrades from JSON files
 */
router.get('/definitions', async (req, res) => {
  try {
    console.log('📂 [UPGRADE-LOADER] Request for upgrade definitions...');
    
    const definitions = loadUpgradeDefinitionsFromJSON();
    
    console.log(`📂 [UPGRADE-LOADER] Returning ${definitions.length} upgrade definitions`);
    console.log('📂 [UPGRADE-LOADER] Categories found:', [...new Set(definitions.map(u => u.category))]);
    
    res.json({
      success: true,
      count: definitions.length,
      upgrades: definitions,
      categories: [...new Set(definitions.map(u => u.category))],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [UPGRADE-LOADER] Error loading definitions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load upgrade definitions',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/upgrades/sync-from-json - Sync JSON upgrades to database
 */
router.post('/sync-from-json', async (req, res) => {
  try {
    console.log('🔄 [UPGRADE-SYNC] Starting upgrade sync from JSON files...');
    
    const jsonUpgrades = loadUpgradeDefinitionsFromJSON();
    
    if (jsonUpgrades.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No upgrade definitions found in JSON files',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`🔄 [UPGRADE-SYNC] Syncing ${jsonUpgrades.length} upgrades to database...`);
    
    const syncResults = {
      created: 0,
      updated: 0,
      errors: 0,
      details: []
    };
    
    for (const upgrade of jsonUpgrades) {
      try {
        // Check if upgrade exists in database
        const existingUpgrade = await storage.getUpgradeByKey(upgrade.key || upgrade.id);
        
        if (existingUpgrade) {
          // Update existing upgrade
          const updated = await storage.updateUpgrade(existingUpgrade.id, {
            ...upgrade,
            currentLevel: existingUpgrade.currentLevel // Preserve current level
          });
          
          if (updated) {
            syncResults.updated++;
            syncResults.details.push({ 
              action: 'updated', 
              upgrade: upgrade.name, 
              id: existingUpgrade.id 
            });
            console.log(`✅ [UPGRADE-SYNC] Updated: ${upgrade.name}`);
          }
        } else {
          // Create new upgrade
          const created = await storage.createUpgrade({
            ...upgrade,
            currentLevel: 0 // New upgrades start at level 0
          });
          
          if (created) {
            syncResults.created++;
            syncResults.details.push({ 
              action: 'created', 
              upgrade: upgrade.name, 
              id: created.id 
            });
            console.log(`✅ [UPGRADE-SYNC] Created: ${upgrade.name}`);
          }
        }
      } catch (upgradeError) {
        syncResults.errors++;
        syncResults.details.push({ 
          action: 'error', 
          upgrade: upgrade.name, 
          error: upgradeError.message 
        });
        console.error(`❌ [UPGRADE-SYNC] Error with ${upgrade.name}:`, upgradeError);
      }
    }
    
    console.log('✅ [UPGRADE-SYNC] Sync complete:', syncResults);
    
    res.json({
      success: true,
      message: 'Upgrade sync completed',
      results: syncResults,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [UPGRADE-SYNC] Sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync upgrades from JSON',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/upgrades/status - Get upgrade system status
 */
router.get('/status', async (req, res) => {
  try {
    const jsonUpgrades = loadUpgradeDefinitionsFromJSON();
    const dbUpgrades = await storage.getAllUpgrades();
    
    const status = {
      jsonFiles: {
        count: jsonUpgrades.length,
        categories: [...new Set(jsonUpgrades.map(u => u.category))],
        upgrades: jsonUpgrades.map(u => ({ id: u.id, name: u.name, category: u.category }))
      },
      database: {
        count: dbUpgrades?.length || 0,
        categories: [...new Set((dbUpgrades || []).map(u => u.category))],
        upgrades: (dbUpgrades || []).map(u => ({ id: u.id, name: u.name, category: u.category }))
      },
      sync: {
        inSync: jsonUpgrades.length === (dbUpgrades?.length || 0),
        recommendation: jsonUpgrades.length !== (dbUpgrades?.length || 0) ? 
          'Run /api/upgrades/sync-from-json to sync' : 'System is in sync'
      }
    };
    
    res.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [UPGRADE-STATUS] Status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check upgrade status',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;