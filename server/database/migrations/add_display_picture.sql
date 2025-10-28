-- Add displayPicture column to users table
-- This allows players to select a custom display picture from the character gallery

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "displayPicture" TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_display_picture ON users("displayPicture");

-- Add comment for clarity
COMMENT ON COLUMN users."displayPicture" IS 'Path to custom display picture selected from character gallery';

-- Example data (optional)
-- UPDATE users SET "displayPicture" = '/uploads/character_pic.jpg' WHERE id = 'some-user-id';

CONSOLE_LOG('✅ Added displayPicture column to users table');
