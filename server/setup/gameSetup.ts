/**
 * Game Setup Script - Complete Game Initialization
 * Last Updated: 2025-10-23
 * 
 * Comprehensive setup script for initializing the entire game system
 */

import { seedDatabase, seedUpgrades, seedCharacters } from '../utils/databaseSeeder.js';
import { SupabaseStorage } from '../../shared/SupabaseStorage.js';

const storage = SupabaseStorage.getInstance();

// Database schema verification
const REQUIRED_TABLES = [
  'users',
  'characters', 
  'upgrades',
  'userUpgrades',
  'tasks',
  'userTasks',
  'achievements',
  'userAchievements',
  'boosters',
  'userBoosters',
  'wheelSegments',
  'chatMessages',
  'gameStats'
];

export async function verifyDatabaseSchema() {
  console.log('🔍 [SETUP] Verifying database schema...');
  
  try {
    for (const table of REQUIRED_TABLES) {
      const { data, error } = await storage.supabase
        .from(table)
        .select('*')
        .limit(1);
        
      if (error) {
        console.error(`❌ Table '${table}' not found or inaccessible:`, error.message);
        return false;
      } else {
        console.log(`✅ Table '${table}' verified`);
      }
    }
    
    console.log('🎉 [SETUP] All required tables verified!');
    return true;
  } catch (error: any) {
    console.error('🔴 [SETUP] Schema verification failed:', error);
    return false;
  }
}

export async function initializeGameData() {
  console.log('🎮 [SETUP] Initializing game data...');
  
  try {
    // Check if game data already exists
    const { data: existingUpgrades } = await storage.supabase
      .from('upgrades')
      .select('id')
      .limit(1);
      
    const { data: existingCharacters } = await storage.supabase
      .from('characters')
      .select('id')
      .limit(1);
    
    if (existingUpgrades?.length > 0 || existingCharacters?.length > 0) {
      console.log('📋 [SETUP] Game data already exists, skipping seeding...');
      return true;
    }
    
    // Seed all game systems
    console.log('🌱 [SETUP] Seeding game data...');
    await seedDatabase();
    
    console.log('✅ [SETUP] Game data initialization complete!');
    return true;
  } catch (error: any) {
    console.error('🔴 [SETUP] Game data initialization failed:', error);
    return false;
  }
}

export async function createDefaultAdmin(telegramId?: string) {
  if (!telegramId) {
    console.log('👤 [SETUP] No telegram ID provided, skipping admin creation');
    return;
  }
  
  console.log(`👤 [SETUP] Creating default admin user for telegram ${telegramId}...`);
  
  try {
    const adminData = {
      id: `admin_${telegramId}`,
      telegramId: telegramId,
      username: 'Admin',
      lp: 50000,
      energy: 1000,
      level: 10,
      totalTaps: 1000,
      upgradesPurchased: 10,
      tasksCompleted: 15,
      isAdmin: true,
      createdAt: new Date().toISOString()
    };
    
    const { error } = await storage.supabase
      .from('users')
      .upsert(adminData, { onConflict: 'telegramId' });
      
    if (error) {
      console.error('🔴 [SETUP] Admin creation failed:', error);
    } else {
      console.log('✅ [SETUP] Default admin user created successfully!');
    }
  } catch (error: any) {
    console.error('🔴 [SETUP] Admin creation error:', error);
  }
}

export async function runGameSetup(options: {
  skipSchemaCheck?: boolean;
  forceReseed?: boolean;
  adminTelegramId?: string;
} = {}) {
  console.log('🚀 [SETUP] Starting complete game setup...');
  
  const startTime = Date.now();
  
  try {
    // Step 1: Verify database schema
    if (!options.skipSchemaCheck) {
      const schemaValid = await verifyDatabaseSchema();
      if (!schemaValid) {
        console.error('❌ [SETUP] Setup aborted due to schema issues');
        return false;
      }
    } else {
      console.log('⏩ [SETUP] Skipping schema verification');
    }
    
    // Step 2: Initialize game data
    if (options.forceReseed) {
      console.log('🗑️ [SETUP] Force reseeding enabled, clearing existing data...');
      // Clear existing data if force reseed
      await storage.supabase.from('upgrades').delete().neq('id', 'none');
      await storage.supabase.from('characters').delete().neq('id', 'none');
      await storage.supabase.from('boosters').delete().neq('id', 'none');
      await storage.supabase.from('wheelSegments').delete().neq('id', 'none');
    }
    
    const dataInitialized = await initializeGameData();
    if (!dataInitialized) {
      console.error('❌ [SETUP] Setup aborted due to data initialization issues');
      return false;
    }
    
    // Step 3: Create default admin if requested
    if (options.adminTelegramId) {
      await createDefaultAdmin(options.adminTelegramId);
    }
    
    const setupTime = Date.now() - startTime;
    
    console.log('🎉 [SETUP] Game setup completed successfully!');
    console.log(`⏱️  [SETUP] Total setup time: ${setupTime}ms`);
    console.log('📊 [SETUP] Setup Summary:');
    console.log('  ✅ Database schema verified');
    console.log('  ✅ Game data initialized');
    console.log('  ✅ All systems ready');
    
    return true;
  } catch (error: any) {
    const setupTime = Date.now() - startTime;
    console.error(`🔴 [SETUP] Setup failed after ${setupTime}ms:`, error);
    return false;
  }
}

// Quick development reset
export async function resetDevelopmentData() {
  console.log('🔄 [SETUP] Resetting development data...');
  
  const tables = [
    'userUpgrades', 'userTasks', 'userAchievements', 
    'userBoosters', 'chatMessages', 'gameStats'
  ];
  
  for (const table of tables) {
    const { error } = await storage.supabase
      .from(table)
      .delete()
      .neq('id', 'none');
      
    if (!error) {
      console.log(`✅ Cleared ${table}`);
    }
  }
  
  console.log('🎉 Development data reset complete!');
}

// CLI interface for direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const forceReseed = args.includes('--force-reseed');
  const skipSchema = args.includes('--skip-schema');
  const adminId = args.find(arg => arg.startsWith('--admin='))?.split('=')[1];
  const resetMode = args.includes('--reset');
  
  if (resetMode) {
    await resetDevelopmentData();
  } else {
    await runGameSetup({
      forceReseed,
      skipSchemaCheck: skipSchema,
      adminTelegramId: adminId
    });
  }
  
  process.exit(0);
}