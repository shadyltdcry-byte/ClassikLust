-- Add poses JSONB column to mediaFiles table
-- Run this in Supabase SQL editor or your database console

-- Add the poses column as JSONB with default empty array
ALTER TABLE "mediaFiles" 
ADD COLUMN IF NOT EXISTS "poses" jsonb DEFAULT '[]'::jsonb;

-- Add a comment to document the column
COMMENT ON COLUMN "mediaFiles"."poses" IS 'Array of pose tags (e.g., ["sitting", "bikini"]) stored as JSONB';

-- Optional: Create an index for faster queries on poses
CREATE INDEX IF NOT EXISTS "idx_mediaFiles_poses" ON "mediaFiles" USING GIN ("poses");

-- Verify the migration
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'mediaFiles' 
AND column_name = 'poses';

SELECT 'Migration completed successfully!' as status;