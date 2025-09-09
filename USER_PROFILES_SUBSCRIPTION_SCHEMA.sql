-- User Profiles Subscription Schema Update
-- Run these commands in your Supabase SQL Editor to ensure subscription fields exist

-- Add subscription-related columns to user_profiles table if they don't exist
DO $$ 
BEGIN
  -- Add subscription_type column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'subscription_type') THEN
    ALTER TABLE user_profiles ADD COLUMN subscription_type TEXT DEFAULT 'free' CHECK (subscription_type IN ('free', 'pro'));
  END IF;
  
  -- Add vehicle_limit column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'vehicle_limit') THEN
    ALTER TABLE user_profiles ADD COLUMN vehicle_limit INTEGER DEFAULT 5;
  END IF;
  
  -- Add cabin_monitoring_enabled column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'cabin_monitoring_enabled') THEN
    ALTER TABLE user_profiles ADD COLUMN cabin_monitoring_enabled BOOLEAN DEFAULT false;
  END IF;
  
  -- Add subscription_start_date column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'subscription_start_date') THEN
    ALTER TABLE user_profiles ADD COLUMN subscription_start_date TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add subscription_end_date column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'subscription_end_date') THEN
    ALTER TABLE user_profiles ADD COLUMN subscription_end_date TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Update existing business users to have default subscription settings
UPDATE user_profiles 
SET 
  subscription_type = COALESCE(subscription_type, 'free'),
  vehicle_limit = COALESCE(vehicle_limit, 5),
  cabin_monitoring_enabled = COALESCE(cabin_monitoring_enabled, false)
WHERE role = 'business';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription ON user_profiles(subscription_type, role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_business_id ON user_profiles(id) WHERE role = 'business';

-- Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create or update RLS policies for user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Verify the schema
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND column_name IN ('subscription_type', 'vehicle_limit', 'cabin_monitoring_enabled', 'subscription_start_date', 'subscription_end_date')
ORDER BY column_name;
