/**
 * Schema Guard - Validates database schema at startup
 * Prevents "column does not exist" errors by checking required columns
 */

import { SupabaseStorage } from '../../shared/SupabaseStorage';

// Required columns for each table
const REQUIRED_SCHEMA = {
  users: [
    'id', 'telegramId', 'username', 'level', 'lp', 
    'energy', 'maxEnergy', 'lpPerTap', 'createdAt', 'updatedAt'
  ],
  characters: [
    'id', 'name', 'description', 'createdAt', 'updatedAt'
  ],
  mediafiles: [
    'id', 'characterId', 'fileName', 'filePath', 'fileType',
    'isNsfw', 'isVip', 'isEvent', 'enabledForChat', 'randomSendChance',
    'createdAt', 'updatedAt'
  ],
  upgrades: [
    'id', 'name', 'description', 'baseCost', 'hourlyBonus', 
    'tapBonus', 'category', 'maxLevel', 'createdAt'
  ],
  achievements: [
    'id', 'name', 'description', 'category', 'reward', 
    'rewardType', 'icon', 'sortOrder', 'createdAt'
  ],
  levelrequirements: [
    'id', 'level', 'lpRequired', 'name', 'description'
  ],
  chatmessages: [
    'id', 'userId', 'characterId', 'senderType', 'message', 'createdAt'
  ],
  wheelrewards: [
    'id', 'userId', 'reward', 'amount', 'spunAt'
  ]
};

export async function validateDatabaseSchema(): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    console.log('[SchemaGuard] Validating database schema...');
    const storage = SupabaseStorage.getInstance();
    const supabase = storage.supabase;
    
    // Check each table's columns
    for (const [tableName, requiredColumns] of Object.entries(REQUIRED_SCHEMA)) {
      console.log(`[SchemaGuard] Checking table: ${tableName}`);
      
      try {
        // Try to query column information
        const { data, error } = await supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_name', tableName)
          .eq('table_schema', 'public');
          
        if (error) {
          errors.push(`Failed to check ${tableName}: ${error.message}`);
          continue;
        }
        
        const existingColumns = data?.map(row => row.column_name) || [];
        const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
        
        if (missingColumns.length > 0) {
          errors.push(`Table '${tableName}' missing columns: ${missingColumns.join(', ')}`);
        }
        
        // Check for potential camelCase issues
        const camelCaseColumns = existingColumns.filter(col => 
          col !== col.toLowerCase() && requiredColumns.includes(col.toLowerCase())
        );
        
        if (camelCaseColumns.length > 0) {
          warnings.push(`Table '${tableName}' has camelCase columns (should be lowercase): ${camelCaseColumns.join(', ')}`);
        }
        
        console.log(`[SchemaGuard] ✅ ${tableName}: ${existingColumns.length} columns found`);
        
      } catch (tableError) {
        // If we can't check the table, try a simple select to see if it exists
        try {
          const { error: selectError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
            
          if (selectError) {
            errors.push(`Table '${tableName}' does not exist or is inaccessible`);
          }
        } catch {
          errors.push(`Table '${tableName}' does not exist`);
        }
      }
    }
    
    const valid = errors.length === 0;
    
    if (valid) {
      console.log('[SchemaGuard] ✅ Database schema validation passed');
    } else {
      console.error('[SchemaGuard] ❌ Database schema validation failed:');
      errors.forEach(error => console.error(`  - ${error}`));
    }
    
    if (warnings.length > 0) {
      console.warn('[SchemaGuard] ⚠️ Schema warnings:');
      warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
    
    return { valid, errors, warnings };
    
  } catch (error) {
    console.error('[SchemaGuard] Fatal error during schema validation:', error);
    return {
      valid: false,
      errors: [`Fatal validation error: ${error}`],
      warnings: []
    };
  }
}

// Helper function to generate migration suggestions
export function generateMigrationSuggestions(errors: string[]): string {
  const suggestions = [
    '\n🔧 DATABASE SCHEMA ISSUES DETECTED:',
    '\n📋 To fix these issues:',
    '1. Import the bootstrap SQL: psql -d your_db -f database/bootstrap.sql',
    '2. Or manually run the missing column additions',
    '3. Restart your application after schema changes',
    '\n🚨 DO NOT run old migration files - use bootstrap.sql only!',
    '\nErrors found:'
  ];
  
  errors.forEach(error => {
    suggestions.push(`  ❌ ${error}`);
  });
  
  return suggestions.join('\n');
}

// Auto-run schema validation (call this in server startup)
export async function ensureDatabaseSchema(): Promise<void> {
  const result = await validateDatabaseSchema();
  
  if (!result.valid) {
    const suggestions = generateMigrationSuggestions(result.errors);
    console.error(suggestions);
    
    // Optionally, exit the process if schema is invalid
    // process.exit(1);
    
    throw new Error('Database schema validation failed. Check logs for details.');
  }
}