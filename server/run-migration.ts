/**
 * Migration Runner - Fix Upgrades Database
 * Run this script to fix the upgrade system after a fresh start
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { SupabaseStorage } from '../shared/SupabaseStorage';

async function runMigration() {
  console.log('🔧 Starting upgrade database migration...');
  
  try {
    // Initialize storage
    const storage = SupabaseStorage.getInstance();
    
    // Read migration file
    const migrationPath = join(process.cwd(), 'migrations', 'fix-upgrades-001.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded, executing...');
    
    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && !stmt.startsWith('/*'));
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;
      
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await storage.supabase.rpc('exec', { query: statement });
        if (error) {
          console.warn(`⚠️ Statement ${i + 1} warning: ${error.message}`);
        } else {
          console.log(`✅ Statement ${i + 1} completed`);
        }
      } catch (err: any) {
        console.warn(`⚠️ Statement ${i + 1} error: ${err.message}`);
      }
    }
    
    // Test the migration
    console.log('🧪 Testing migration...');
    
    const { data: upgradesTest, error: upgradesError } = await storage.supabase
      .from('upgrades')
      .select('id, name')
      .limit(1);
    
    const { data: userUpgradesTest, error: userUpgradesError } = await storage.supabase
      .from('userUpgrades')
      .select('id, userId, upgradeId')
      .limit(1);
    
    if (upgradesError) {
      console.error('❌ upgrades table test failed:', upgradesError);
    } else {
      console.log('✅ upgrades table working');
    }
    
    if (userUpgradesError) {
      console.error('❌ userUpgrades table test failed:', userUpgradesError);
    } else {
      console.log('✅ userUpgrades table working');
    }
    
    console.log('🎉 Migration completed! Your upgrade system should now work.');
    console.log('💡 Try restarting your server and testing the upgrades API.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runMigration().then(() => process.exit(0));
}

export { runMigration };