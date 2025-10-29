# 🗄️ Database Migration Commands

## Quick Setup for Display Picture Fix

Run these SQL commands in your Supabase SQL editor or database console:

```sql
-- Add telegramId column if missing (for telegram user identification)
ALTER TABLE users ADD COLUMN IF NOT EXISTS "telegramId" text;
CREATE INDEX IF NOT EXISTS idx_users_telegramId ON users("telegramId");

-- Add displayPicture column if missing (for user avatar filenames)
ALTER TABLE users ADD COLUMN IF NOT EXISTS "displayPicture" text;
CREATE INDEX IF NOT EXISTS idx_users_displayPicture ON users("displayPicture");
```

## ✅ What This Fixes:

1. **Display Picture Error**: Fixes `users.telegram does not exist` → uses `users.telegramId`
2. **File Path Storage**: Uses fileName instead of full filePath for display pictures
3. **Telegram User Support**: Proper handling of `telegram_5134006535` format user IDs

## 🔍 Verify Migration:

```sql
-- Check if columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('telegramId', 'displayPicture');
```

Expected output:
```
column_name   | data_type | is_nullable
--------------+-----------+------------
telegramId    | text      | YES
displayPicture| text      | YES
```

## 🧪 Test Display Picture API:

```bash
# Test setting display picture
curl -X POST http://localhost:5000/api/user/set-display-picture \
  -H "Content-Type: application/json" \
  -d '{"userId":"telegram_5134006535","imagePath":"/uploads/uploaded_1761664780540_gy2nt67c2.png"}'

# Expected: 200 OK with user data and displayPicture set
```

## 📝 Migration Notes:

- Uses `IF NOT EXISTS` - safe to run multiple times
- Creates indexes for performance
- Backward compatible with existing UUID users
- Telegram users use `telegramId` column, UUID users use `id` column

## 🚨 Important:

**Run the migration first**, then test the display picture functionality. The API will fail with `42703` error until the `telegramId` column exists.
