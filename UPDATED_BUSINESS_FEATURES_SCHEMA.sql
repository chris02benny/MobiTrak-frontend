-- mobiTrak Business Features Database Schema (Updated for existing user_profiles)
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

-- 2. Update vehicles table with new fields
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE;
-- OCR RC fields additions
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS registered_number TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS maker_name TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS class_of_vehicle TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fuel_type TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS seating_capacity INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS tax_license_no TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS tax_paid_from TEXT; -- store as DD/MM/YYYY
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS tax_paid_to TEXT;   -- store as DD/MM/YYYY
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS date_of_registration TEXT; -- DD/MM/YYYY
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fitness_valid_from TEXT;   -- DD/MM/YYYY
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fitness_valid_to TEXT;     -- DD/MM/YYYY
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vehicle_type TEXT CHECK (vehicle_type IN ('sedan', 'suv', 'hatchback', 'truck', 'bus', 'van', 'motorcycle', 'other'));
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS label_id UUID REFERENCES vehicle_labels(id) ON DELETE SET NULL;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available' CHECK (status IN ('available', 'under_maintenance', 'unavailable', 'in_use'));
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS chassis_number TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vehicle_image_url TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS rc_book_url TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Create drivers table for hired drivers (references user_profiles)
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

-- 4. Create driver_vehicle_assignments table
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

-- 5. Create reviews table for driver reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  trip_id UUID, -- Reference to trips table when implemented
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Add driver-specific fields to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS license_expiry DATE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS total_trips INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_available_for_hire BOOLEAN DEFAULT TRUE;

-- 7. Enable Row Level Security (RLS) on all tables
ALTER TABLE vehicle_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_vehicle_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS Policies for vehicle_labels
CREATE POLICY "Business can manage own labels" ON vehicle_labels
  FOR ALL USING (auth.uid() = business_id);

-- 9. Create RLS Policies for vehicles (updated)
DROP POLICY IF EXISTS "Users can view own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can update own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can insert own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can delete own vehicles" ON vehicles;

CREATE POLICY "Business can manage own vehicles" ON vehicles
  FOR ALL USING (auth.uid() = business_id);

-- 10. Create RLS Policies for drivers
CREATE POLICY "Business can manage own drivers" ON drivers
  FOR ALL USING (auth.uid() = business_id);

CREATE POLICY "Drivers can view their own hired profile" ON drivers
  FOR SELECT USING (auth.uid() = user_id);

-- 11. Create RLS Policies for driver_vehicle_assignments
CREATE POLICY "Business can manage own assignments" ON driver_vehicle_assignments
  FOR ALL USING (auth.uid() = business_id);

-- 12. Create RLS Policies for reviews
CREATE POLICY "Users can view reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Customers can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Business owners can view reviews for their drivers" ON reviews
  FOR SELECT USING (EXISTS (SELECT 1 FROM drivers WHERE drivers.id = driver_id AND drivers.business_id = auth.uid()));

-- 13. Create RLS Policies for user_profiles (for driver availability)
CREATE POLICY "Drivers can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id AND role = 'driver');

CREATE POLICY "Business can view available drivers" ON user_profiles
  FOR SELECT USING (role = 'driver' AND is_available_for_hire = true);

-- 14. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicle_labels_business_id ON vehicle_labels(business_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_business_id ON vehicles(business_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_label_id ON vehicles(label_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_drivers_business_id ON drivers(business_id);
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_driver_vehicle_assignments_driver_id ON driver_vehicle_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_vehicle_assignments_vehicle_id ON driver_vehicle_assignments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_driver_vehicle_assignments_business_id ON driver_vehicle_assignments(business_id);
CREATE INDEX IF NOT EXISTS idx_driver_vehicle_assignments_active ON driver_vehicle_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_reviews_driver_id ON reviews(driver_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_available_drivers ON user_profiles(role, is_available_for_hire);

-- 15. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 16. Create triggers for updated_at
CREATE TRIGGER update_vehicle_labels_updated_at
  BEFORE UPDATE ON vehicle_labels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 17. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_profiles TO anon, authenticated;
GRANT ALL ON public.vehicles TO anon, authenticated;
GRANT ALL ON public.vehicle_labels TO anon, authenticated;
GRANT ALL ON public.drivers TO anon, authenticated;
GRANT ALL ON public.driver_vehicle_assignments TO anon, authenticated;
GRANT ALL ON public.reviews TO anon, authenticated;

-- 18. Insert sample data for testing (optional)
-- Note: Replace 'your-business-user-id' with actual business user ID
INSERT INTO vehicle_labels (business_id, name, description, color) VALUES
  ('your-business-user-id', 'Luxury Cars', 'High-end vehicles for premium service', '#fabb24'),
  ('your-business-user-id', 'Economy Cars', 'Budget-friendly vehicles', '#10b981'),
  ('your-business-user-id', 'Tourist Buses', 'Large capacity vehicles for group tours', '#3b82f6'),
  ('your-business-user-id', 'Delivery Vans', 'Cargo vehicles for deliveries', '#f59e0b')
ON CONFLICT DO NOTHING;

-- 19. Create function to calculate driver average rating
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

-- 20. Create function to get driver statistics
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

-- 21. Create function to get available drivers from user_profiles
CREATE OR REPLACE FUNCTION get_available_drivers()
RETURNS TABLE(
  id UUID,
  email TEXT,
  full_name TEXT,
  license_number TEXT,
  license_expiry DATE,
  phone TEXT,
  address TEXT,
  experience_years INTEGER,
  rating DECIMAL(3,2),
  total_trips INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.email,
    up.full_name,
    up.license_number,
    up.license_expiry,
    up.phone,
    up.address,
    up.experience_years,
    up.rating,
    up.total_trips
  FROM user_profiles up
  WHERE up.role = 'driver' 
    AND up.is_available_for_hire = true
    AND NOT EXISTS (
      SELECT 1 FROM drivers d 
      WHERE d.user_id = up.id 
        AND d.status = 'active'
    );
END;
$$ LANGUAGE plpgsql;
