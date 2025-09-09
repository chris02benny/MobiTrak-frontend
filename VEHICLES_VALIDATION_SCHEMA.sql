-- Enhanced Vehicles Table Schema with Validation Support
-- Run these commands in your Supabase SQL Editor

-- 1. Update vehicles table with enhanced validation fields
DO $$ 
BEGIN
  -- Add vehicle_class column if it doesn't exist (replacing vehicle_type for validation)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'vehicle_class') THEN
    ALTER TABLE vehicles ADD COLUMN vehicle_class TEXT CHECK (vehicle_class IN ('LMV', 'HMV', 'MCWG', 'MCWOG'));
  END IF;
  
  -- Update existing vehicle_type constraint to include new classes if needed
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'vehicle_type') THEN
    -- Drop existing constraint if it exists
    ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_vehicle_type_check;
    -- Add updated constraint
    ALTER TABLE vehicles ADD CONSTRAINT vehicles_vehicle_type_check 
      CHECK (vehicle_type IN ('sedan', 'suv', 'hatchback', 'truck', 'bus', 'van', 'motorcycle', 'other'));
  END IF;
  
  -- Add registration number validation constraint
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'registration_number') THEN
    ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_registration_number_format;
    ALTER TABLE vehicles ADD CONSTRAINT vehicles_registration_number_format 
      CHECK (registration_number ~ '^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$');
  END IF;
  
  -- Add chassis number validation constraint
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'chassis_number') THEN
    ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_chassis_number_format;
    ALTER TABLE vehicles ADD CONSTRAINT vehicles_chassis_number_format 
      CHECK (chassis_number ~ '^[A-Z0-9]{10,20}$');
  END IF;
  
  -- Add owner name validation constraint
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'owner_name') THEN
    ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_owner_name_format;
    ALTER TABLE vehicles ADD CONSTRAINT vehicles_owner_name_format 
      CHECK (owner_name ~ '^[A-Za-z\s]{3,}$');
  END IF;
  
  -- Add year validation constraint
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'year') THEN
    ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_year_range;
    ALTER TABLE vehicles ADD CONSTRAINT vehicles_year_range 
      CHECK (year >= 1980 AND year <= EXTRACT(YEAR FROM CURRENT_DATE));
  END IF;
END $$;

-- 2. Create indexes for better performance on validation fields
CREATE INDEX IF NOT EXISTS idx_vehicles_registration_number ON vehicles(registration_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_chassis_number ON vehicles(chassis_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_business_id ON vehicles(business_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_class ON vehicles(vehicle_class);

-- 3. Create a function to validate vehicle data before insert/update
CREATE OR REPLACE FUNCTION validate_vehicle_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate make (non-empty)
  IF NEW.make IS NULL OR trim(NEW.make) = '' THEN
    RAISE EXCEPTION 'Vehicle make cannot be empty';
  END IF;
  
  -- Validate model (non-empty, minimum 2 characters)
  IF NEW.model IS NULL OR trim(NEW.model) = '' OR length(trim(NEW.model)) < 2 THEN
    RAISE EXCEPTION 'Vehicle model must be at least 2 characters';
  END IF;
  
  -- Validate year (between 1980 and current year)
  IF NEW.year IS NULL OR NEW.year < 1980 OR NEW.year > EXTRACT(YEAR FROM CURRENT_DATE) THEN
    RAISE EXCEPTION 'Vehicle year must be between 1980 and %', EXTRACT(YEAR FROM CURRENT_DATE);
  END IF;
  
  -- Validate vehicle class (required)
  IF NEW.vehicle_class IS NULL OR NEW.vehicle_class = '' THEN
    RAISE EXCEPTION 'Vehicle class is required';
  END IF;
  
  -- Validate registration number format
  IF NEW.registration_number IS NULL OR NOT (NEW.registration_number ~ '^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$') THEN
    RAISE EXCEPTION 'Registration number must follow format: KA01AB1234';
  END IF;
  
  -- Validate chassis number format
  IF NEW.chassis_number IS NULL OR NOT (NEW.chassis_number ~ '^[A-Z0-9]{10,20}$') THEN
    RAISE EXCEPTION 'Chassis number must be 10-20 uppercase letters and digits';
  END IF;
  
  -- Validate owner name format
  IF NEW.owner_name IS NULL OR NOT (NEW.owner_name ~ '^[A-Za-z\s]{3,}$') THEN
    RAISE EXCEPTION 'Owner name must be at least 3 characters and contain only letters and spaces';
  END IF;
  
  -- Ensure uppercase for registration and chassis numbers
  NEW.registration_number = upper(NEW.registration_number);
  NEW.chassis_number = upper(NEW.chassis_number);
  
  -- Set updated_at timestamp
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to run validation function
DROP TRIGGER IF EXISTS trigger_validate_vehicle_data ON vehicles;
CREATE TRIGGER trigger_validate_vehicle_data
  BEFORE INSERT OR UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION validate_vehicle_data();

-- 5. Create RLS policies for vehicles table (if not already exists)
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Policy for business owners to see their own vehicles
DROP POLICY IF EXISTS "Business owners can view their vehicles" ON vehicles;
CREATE POLICY "Business owners can view their vehicles" ON vehicles
  FOR SELECT USING (business_id = auth.uid());

-- Policy for business owners to insert their own vehicles
DROP POLICY IF EXISTS "Business owners can insert their vehicles" ON vehicles;
CREATE POLICY "Business owners can insert their vehicles" ON vehicles
  FOR INSERT WITH CHECK (business_id = auth.uid());

-- Policy for business owners to update their own vehicles
DROP POLICY IF EXISTS "Business owners can update their vehicles" ON vehicles;
CREATE POLICY "Business owners can update their vehicles" ON vehicles
  FOR UPDATE USING (business_id = auth.uid()) WITH CHECK (business_id = auth.uid());

-- Policy for business owners to delete their own vehicles
DROP POLICY IF EXISTS "Business owners can delete their vehicles" ON vehicles;
CREATE POLICY "Business owners can delete their vehicles" ON vehicles
  FOR DELETE USING (business_id = auth.uid());

-- 6. Create storage bucket for vehicle files (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-files', 'vehicle-files', false)
ON CONFLICT (id) DO NOTHING;

-- 7. Create storage policies for vehicle files
DROP POLICY IF EXISTS "Business owners can upload vehicle files" ON storage.objects;
CREATE POLICY "Business owners can upload vehicle files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'vehicle-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Business owners can view their vehicle files" ON storage.objects;
CREATE POLICY "Business owners can view their vehicle files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'vehicle-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Business owners can update their vehicle files" ON storage.objects;
CREATE POLICY "Business owners can update their vehicle files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'vehicle-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Business owners can delete their vehicle files" ON storage.objects;
CREATE POLICY "Business owners can delete their vehicle files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'vehicle-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
