# Database Setup Guide

## 🚨 **IMPORTANT: Use Bootstrap Only!**

**DO NOT** run any old migration files. They contain mixed/conflicting schema changes that will break your database.

## ✅ **Quick Setup (Fresh Database)**

### 1. Import the Bootstrap SQL
```bash
# For Supabase (via psql)
psql -h db.your-project.supabase.co -U postgres -d postgres -f database/bootstrap.sql

# For local PostgreSQL
psql -U postgres -d your_database -f database/bootstrap.sql
```

### 2. Verify Schema
Run this query to confirm all tables exist:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see: `achievements`, `characters`, `chatmessages`, `levelrequirements`, `mediafiles`, `upgrades`, `usercharacters`, `userupgrades`, `users`, `wheelrewards`

### 3. Start Your App
The schema guard will validate everything at startup and warn you of any issues.

## 🎯 **Schema Philosophy**

- **Database columns**: All lowercase (PostgreSQL default)
- **Application layer**: CamelCase (handled by SupabaseStorage mapping)
- **Computed stats**: LP/hour is calculated from upgrades, not stored as a column
- **No snake_case**: Avoids the camelCase ↔ snake_case hell

## 🔧 **Column Mapping Reference**

The app uses these mappings (handled automatically):

| Application (camelCase) | Database (lowercase) |
|-------------------------|----------------------|
| `characterId`           | `characterid`        |
| `filePath`              | `filepath`           |
| `fileName`              | `filename`           |
| `fileType`              | `filetype`           |
| `isNsfw`                | `isnsfw`             |
| `isVip`                 | `isvip`              |
| `enabledForChat`        | `enabledforchat`     |
| `randomSendChance`      | `randomsendchance`   |
| `requiredLevel`         | `requiredlevel`      |
| `createdAt`             | `createdat`          |
| `updatedAt`             | `updatedat`          |

## 🚀 **What's Included**

- **8 Tables**: All game data structures
- **Sample Data**: 2 characters, 5 upgrades, 4 achievements
- **Indexes**: Optimized queries for common operations
- **Triggers**: Auto-update timestamps
- **UUID Extension**: Proper ID generation

## 🛡️ **Schema Guard**

The app includes a schema guard (`server/utils/schemaGuard.ts`) that:
- Validates required columns at startup
- Detects camelCase/lowercase mismatches
- Provides clear error messages and migration hints
- Prevents "column does not exist" runtime errors

## 📝 **Future Changes**

When adding new features:
1. Update `bootstrap.sql` with new tables/columns
2. Update `REQUIRED_SCHEMA` in `schemaGuard.ts`
3. Update field mapping in `SupabaseStorage.ts`
4. Bump the schema version comment at the top of `bootstrap.sql`

**Never** create separate migration files - maintain one authoritative bootstrap that can be imported fresh.

## 🐛 **Troubleshooting**

If you see "column does not exist" errors:

1. **Check the console logs** - schema guard will tell you exactly what's missing
2. **Re-import bootstrap.sql** - this fixes 99% of schema issues
3. **Restart your app** - clears PostgREST schema cache
4. **Check your Supabase dashboard** - verify table structure matches bootstrap

## 💀 **Don't Do This**

- ❌ Run old migration files
- ❌ Mix snake_case and camelCase in the same table
- ❌ Query non-existent columns like `lpperhour`
- ❌ Use `.single()` when multiple rows might exist (use `.maybeSingle()`)
- ❌ Skip the schema guard validation

---

**tl;dr**: Import `bootstrap.sql` once, delete old migrations, profit! 🎮✨