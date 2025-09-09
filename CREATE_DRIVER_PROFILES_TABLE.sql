-- Create driver_profiles table for driver profile completion
-- Run this in your Supabase SQL Editor

-- Create the driver_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS driver_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Personal Details
  full_name TEXT,
  date_of_birth DATE,
  blood_group TEXT,
  phone_number TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  
  -- License Details
  license_number TEXT,
  license_type TEXT,
  license_expiry DATE,
  license_image_url TEXT,
  
  -- Vehicle Details
  vehicle_type TEXT,
  vehicle_model TEXT,
  vehicle_year INTEGER,
  vehicle_registration TEXT,
  vehicle_insurance_expiry DATE,
  vehicle_image_url TEXT,
  
  -- Experience Details
  years_of_experience INTEGER,
  previous_companies TEXT[],
  specializations TEXT[],
  preferred_routes TEXT[],
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_driver_profiles_user_id ON driver_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_license_number ON driver_profiles(license_number);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_vehicle_registration ON driver_profiles(vehicle_registration);

-- Enable RLS
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own driver profile" ON driver_profiles;
CREATE POLICY "Users can view their own driver profile" ON driver_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own driver profile" ON driver_profiles;
CREATE POLICY "Users can insert their own driver profile" ON driver_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own driver profile" ON driver_profiles;
CREATE POLICY "Users can update their own driver profile" ON driver_profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own driver profile" ON driver_profiles;
CREATE POLICY "Users can delete their own driver profile" ON driver_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_driver_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_driver_profiles_updated_at ON driver_profiles;
CREATE TRIGGER trigger_update_driver_profiles_updated_at
  BEFORE UPDATE ON driver_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_profiles_updated_at();

-- Verify the table was created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'driver_profiles'
ORDER BY ordinal_position;
