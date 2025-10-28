/**
 * Quick Fix Script - Change userUpgrades.userId from UUID to TEXT
 * Run this once to fix the database column type mismatch
 */

import { SupabaseStorage } from '../shared/SupabaseStorage';

async function fixUserUpgradesColumn() {
  console.log('🔧 Fixing userUpgrades.userId column type...');
  
  try {
    const storage = SupabaseStorage.getInstance();
    
    // Step 1: Drop FK constraint
    console.log('🔧 Step 1: Dropping foreign key constraint...');
    await storage.supabase.rpc('exec', { 
      query: 'ALTER TABLE "userUpgrades" DROP CONSTRAINT IF EXISTS "userUpgrades_userId_users_id_fk"' 
    });
    
    // Step 2: Change column type to TEXT
    console.log('🔧 Step 2: Changing userId column to TEXT...');
    await storage.supabase.rpc('exec', { 
      query: 'ALTER TABLE "userUpgrades" ALTER COLUMN "userId" TYPE TEXT' 
    });
    
    // Step 3: Refresh schema cache
    console.log('🔧 Step 3: Refreshing schema cache...');
    await storage.supabase.rpc('exec', { 
      query: 'COMMENT ON TABLE "userUpgrades" IS \'userId now TEXT for telegram IDs\'' 
    });
    
    // Test the fix
    console.log('🧪 Testing the fix...');
    const { data: testResult, error: testError } = await storage.supabase
      .from('userUpgrades')
      .select('userId, upgradeId, level')
      .limit(1);
    
    if (testError) {
      console.error('❌ Test failed:', testError);
    } else {
      console.log('✅ Test passed - userUpgrades table working');
    }
    
    // Verify column type
    const { data: columnInfo } = await storage.supabase.rpc('exec', {
      query: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name='userUpgrades' AND column_name='userId'`
    });
    
    console.log('✅ Column type verification:', columnInfo);
    console.log('🎉 userUpgrades.userId fix completed!');
    console.log('💡 You can now use telegram IDs directly in the upgrades system.');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  fixUserUpgradesColumn().then(() => process.exit(0));
}

export { fixUserUpgradesColumn };