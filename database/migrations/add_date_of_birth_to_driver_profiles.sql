-- Add date_of_birth field to driver_profiles table
-- This migration adds the date_of_birth field for the new profile completion flow

-- Add date_of_birth column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'driver_profiles' 
        AND column_name = 'date_of_birth'
    ) THEN
        ALTER TABLE driver_profiles 
        ADD COLUMN date_of_birth DATE;
    END IF;
END $$;

-- Add comment to the column
COMMENT ON COLUMN driver_profiles.date_of_birth IS 'Driver date of birth for profile completion';

-- Update any existing profiles to have profile_complete = false if date_of_birth is missing
UPDATE driver_profiles 
SET profile_complete = false 
WHERE date_of_birth IS NULL 
AND profile_complete = true;
