-- mobiTrak Business Features Database Schema (Corrected for user_profiles = auth only)
-- Run these commands in your Supabase SQL Editor

-- 1. Create vehicle_labels table for business vehicle categorization
CREATE TABLE IF NOT EXISTS vehicle_labels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#fabb24', -- Default to primary theme color
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Update vehicles table with new fields (only if they don't exist)
DO $$ 
BEGIN
  -- Add business_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'business_id') THEN
    ALTER TABLE vehicles ADD COLUMN business_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE;
  END IF;
  
  -- Add registration_number column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'registration_number') THEN
    ALTER TABLE vehicles ADD COLUMN registration_number TEXT;
  END IF;
  
  -- Add vehicle_type column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'vehicle_type') THEN
    ALTER TABLE vehicles ADD COLUMN vehicle_type TEXT CHECK (vehicle_type IN ('sedan', 'suv', 'hatchback', 'truck', 'bus', 'van', 'motorcycle', 'other'));
  END IF;
  
  -- Add label_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'label_id') THEN
    ALTER TABLE vehicles ADD COLUMN label_id UUID REFERENCES vehicle_labels(id) ON DELETE SET NULL;
  END IF;
  
  -- Add status column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'status') THEN
    ALTER TABLE vehicles ADD COLUMN status TEXT DEFAULT 'available' CHECK (status IN ('available', 'under_maintenance', 'unavailable', 'in_use'));
  END IF;
  
  -- Add chassis_number column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'chassis_number') THEN
    ALTER TABLE vehicles ADD COLUMN chassis_number TEXT;
  END IF;
  
  -- Add owner_name column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'owner_name') THEN
    ALTER TABLE vehicles ADD COLUMN owner_name TEXT;
  END IF;
  
  -- Add vehicle_image_url column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'vehicle_image_url') THEN
    ALTER TABLE vehicles ADD COLUMN vehicle_image_url TEXT;
  END IF;
  
  -- Add rc_book_url column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'rc_book_url') THEN
    ALTER TABLE vehicles ADD COLUMN rc_book_url TEXT;
  END IF;
  
  -- Add created_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'created_at') THEN
    ALTER TABLE vehicles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'updated_at') THEN
    ALTER TABLE vehicles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- 3. Create driver_pool table for available drivers (separate from user_profiles)
CREATE TABLE IF NOT EXISTS driver_pool (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  license_number TEXT NOT NULL,
  license_expiry DATE,
  phone TEXT,
  address TEXT,
  experience_years INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_trips INTEGER DEFAULT 0,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'hired', 'unavailable')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id) -- A user can only have one driver pool entry
);

-- 4. Create drivers table for hired drivers
CREATE TABLE IF NOT EXISTS drivers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  license_number TEXT NOT NULL,
  license_expiry DATE,
  phone TEXT,
  address TEXT,
  hire_date DATE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_trips INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (business_id, user_id) -- A driver can only be hired by one business at a time
);

-- 5. Create driver_vehicle_assignments table
CREATE TABLE IF NOT EXISTS driver_vehicle_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unassigned_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (vehicle_id) -- A vehicle can only be assigned to one driver at a time
);

-- 6. Create reviews table for driver reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  trip_id UUID, -- Reference to trips table when implemented
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Enable Row Level Security (RLS) on all tables
ALTER TABLE vehicle_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_vehicle_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 8. Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Business can manage own labels" ON vehicle_labels;
DROP POLICY IF EXISTS "Business can manage own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Business can manage own drivers" ON drivers;
DROP POLICY IF EXISTS "Drivers can view their own hired profile" ON drivers;
DROP POLICY IF EXISTS "Business can manage own assignments" ON driver_vehicle_assignments;
DROP POLICY IF EXISTS "Users can view reviews" ON reviews;
DROP POLICY IF EXISTS "Customers can create reviews" ON reviews;
DROP POLICY IF EXISTS "Business owners can view reviews for their drivers" ON reviews;
DROP POLICY IF EXISTS "Drivers can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Business can view available drivers" ON user_profiles;
DROP POLICY IF EXISTS "Drivers can manage own pool profile" ON driver_pool;
DROP POLICY IF EXISTS "Business can view driver pool" ON driver_pool;

-- 9. Create RLS Policies for vehicle_labels
CREATE POLICY "Business can manage own labels" ON vehicle_labels
  FOR ALL USING (auth.uid() = business_id);

-- 10. Create RLS Policies for vehicles
CREATE POLICY "Business can manage own vehicles" ON vehicles
  FOR ALL USING (auth.uid() = business_id);

-- 11. Create RLS Policies for driver_pool
CREATE POLICY "Drivers can manage own pool profile" ON driver_pool
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Business can view driver pool" ON driver_pool
  FOR SELECT USING (status = 'available');

-- 12. Create RLS Policies for drivers
CREATE POLICY "Business can manage own drivers" ON drivers
  FOR ALL USING (auth.uid() = business_id);

CREATE POLICY "Drivers can view their own hired profile" ON drivers
  FOR SELECT USING (auth.uid() = user_id);

-- 13. Create RLS Policies for driver_vehicle_assignments
CREATE POLICY "Business can manage own assignments" ON driver_vehicle_assignments
  FOR ALL USING (auth.uid() = business_id);

-- 14. Create RLS Policies for reviews
CREATE POLICY "Users can view reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Customers can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Business owners can view reviews for their drivers" ON reviews
  FOR SELECT USING (EXISTS (SELECT 1 FROM drivers WHERE drivers.id = driver_id AND drivers.business_id = auth.uid()));

-- 15. Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_vehicle_labels_business_id ON vehicle_labels(business_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_business_id ON vehicles(business_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_label_id ON vehicles(label_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_driver_pool_user_id ON driver_pool(user_id);
CREATE INDEX IF NOT EXISTS idx_driver_pool_status ON driver_pool(status);
CREATE INDEX IF NOT EXISTS idx_drivers_business_id ON drivers(business_id);
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_driver_vehicle_assignments_driver_id ON driver_vehicle_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_vehicle_assignments_vehicle_id ON driver_vehicle_assignments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_driver_vehicle_assignments_business_id ON driver_vehicle_assignments(business_id);
CREATE INDEX IF NOT EXISTS idx_driver_vehicle_assignments_active ON driver_vehicle_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_reviews_driver_id ON reviews(driver_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON reviews(customer_id);

-- 16. Create updated_at trigger function (only if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 17. Drop existing triggers if they exist, then create new ones
DROP TRIGGER IF EXISTS update_vehicle_labels_updated_at ON vehicle_labels;
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
DROP TRIGGER IF EXISTS update_driver_pool_updated_at ON driver_pool;
DROP TRIGGER IF EXISTS update_drivers_updated_at ON drivers;

-- 18. Create triggers for updated_at
CREATE TRIGGER update_vehicle_labels_updated_at
  BEFORE UPDATE ON vehicle_labels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_pool_updated_at
  BEFORE UPDATE ON driver_pool
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 19. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_profiles TO anon, authenticated;
GRANT ALL ON public.vehicles TO anon, authenticated;
GRANT ALL ON public.vehicle_labels TO anon, authenticated;
GRANT ALL ON public.driver_pool TO anon, authenticated;
GRANT ALL ON public.drivers TO anon, authenticated;
GRANT ALL ON public.driver_vehicle_assignments TO anon, authenticated;
GRANT ALL ON public.reviews TO anon, authenticated;

-- 20. Create function to calculate driver average rating (only if it doesn't exist)
CREATE OR REPLACE FUNCTION calculate_driver_rating(driver_uuid UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
  avg_rating DECIMAL(3,2);
BEGIN
  SELECT COALESCE(AVG(rating), 0.00) INTO avg_rating
  FROM reviews
  WHERE driver_id = driver_uuid;
  
  RETURN avg_rating;
END;
$$ LANGUAGE plpgsql;

-- 21. Create function to get driver statistics (only if it doesn't exist)
CREATE OR REPLACE FUNCTION get_driver_stats(driver_uuid UUID)
RETURNS TABLE(
  total_reviews INTEGER,
  average_rating DECIMAL(3,2),
  total_trips INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(r.id)::INTEGER as total_reviews,
    COALESCE(AVG(r.rating), 0.00) as average_rating,
    COALESCE(d.total_trips, 0) as total_trips
  FROM drivers d
  LEFT JOIN reviews r ON d.id = r.driver_id
  WHERE d.id = driver_uuid
  GROUP BY d.total_trips;
END;
$$ LANGUAGE plpgsql;

-- 22. Create function to get available drivers from driver_pool (only if it doesn't exist)
CREATE OR REPLACE FUNCTION get_available_drivers()
RETURNS TABLE(
  id UUID,
  user_id UUID,
  license_number TEXT,
  license_expiry DATE,
  phone TEXT,
  address TEXT,
  experience_years INTEGER,
  rating DECIMAL(3,2),
  total_trips INTEGER,
  email TEXT,
  full_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dp.id,
    dp.user_id,
    dp.license_number,
    dp.license_expiry,
    dp.phone,
    dp.address,
    dp.experience_years,
    dp.rating,
    dp.total_trips,
    up.email,
    up.full_name
  FROM driver_pool dp
  JOIN user_profiles up ON dp.user_id = up.id
  WHERE dp.status = 'available';
END;
$$ LANGUAGE plpgsql;

-- 23. Sample data will be inserted manually after schema creation
-- Run these commands separately after the schema is created:

-- To insert sample vehicle labels (replace 'your-actual-business-uuid' with real UUID):
-- INSERT INTO vehicle_labels (business_id, name, description, color) VALUES
--   ('your-actual-business-uuid', 'Luxury Cars', 'High-end vehicles for premium service', '#fabb24'),
--   ('your-actual-business-uuid', 'Economy Cars', 'Budget-friendly vehicles', '#10b981'),
--   ('your-actual-business-uuid', 'Tourist Buses', 'Large capacity vehicles for group tours', '#3b82f6'),
--   ('your-actual-business-uuid', 'Delivery Vans', 'Cargo vehicles for deliveries', '#f59e0b');

-- To insert sample driver pool data (replace 'driver-uuid-1', 'driver-uuid-2' with real UUIDs):
-- INSERT INTO driver_pool (user_id, license_number, license_expiry, phone, address, experience_years, rating, total_trips, status) VALUES
--   ('driver-uuid-1', 'DL123456789', '2025-12-31', '+1234567890', '123 Driver St, City', 5, 4.8, 150, 'available'),
--   ('driver-uuid-2', 'DL987654321', '2026-06-30', '+1987654321', '456 Driver Ave, Town', 3, 4.5, 75, 'available');
