-- Add license fields to driver_profiles table
-- Run this migration in Supabase SQL Editor

-- Add new columns for Indian driving license details
ALTER TABLE driver_profiles
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS issue_date DATE,
ADD COLUMN IF NOT EXISTS expiry_date DATE,
ADD COLUMN IF NOT EXISTS license_class TEXT,
ADD COLUMN IF NOT EXISTS license_image_url TEXT,
ADD COLUMN IF NOT EXISTS fathers_name TEXT,
ADD COLUMN IF NOT EXISTS blood_group TEXT,
ADD COLUMN IF NOT EXISTS issuing_authority TEXT,
ADD COLUMN IF NOT EXISTS validity_nt DATE,
ADD COLUMN IF NOT EXISTS validity_tr DATE;

-- Create storage bucket for driver licenses if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-licenses', 'driver-licenses', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the driver-licenses bucket
CREATE POLICY "Users can upload their own license images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'driver-licenses' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own license images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'driver-licenses' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own license images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'driver-licenses' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own license images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'driver-licenses' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Update the profile completion check to include new required fields
-- You may want to adjust this based on which fields are truly required
COMMENT ON COLUMN driver_profiles.full_name IS 'Full name as it appears on the Indian driving license';
COMMENT ON COLUMN driver_profiles.date_of_birth IS 'Date of birth from Indian driving license';
COMMENT ON COLUMN driver_profiles.issue_date IS 'License issue date';
COMMENT ON COLUMN driver_profiles.expiry_date IS 'License expiry date (primary validity)';
COMMENT ON COLUMN driver_profiles.license_class IS 'Class of vehicle (e.g., MCWG, LMV)';
COMMENT ON COLUMN driver_profiles.license_image_url IS 'URL to uploaded license PDF';
COMMENT ON COLUMN driver_profiles.fathers_name IS 'Father/Guardian name (S/D/W of)';
COMMENT ON COLUMN driver_profiles.blood_group IS 'Blood group from license';
COMMENT ON COLUMN driver_profiles.issuing_authority IS 'License issuing authority';
COMMENT ON COLUMN driver_profiles.validity_nt IS 'Validity for non-transport vehicles';
COMMENT ON COLUMN driver_profiles.validity_tr IS 'Validity for transport vehicles';
