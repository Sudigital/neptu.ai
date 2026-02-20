-- Add preferred_language column to users table if it doesn't exist
-- This handles production databases where the users table was created before
-- the preferred_language column was added to the schema.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'preferred_language'
  ) THEN
    ALTER TABLE "users" ADD COLUMN "preferred_language" text DEFAULT 'en';
  END IF;
END $$;
