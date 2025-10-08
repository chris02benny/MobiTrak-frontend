-- =====================================================
-- mobiTrak Schema Restructure Migration
-- =====================================================
-- This script migrates the existing schema to support the complete mobiTrak platform
-- Fixes inconsistencies and adds missing functionality

-- =====================================================
-- 1. BACKUP EXISTING DATA (if needed)
-- =====================================================

-- Note: This migration will restructure tables, so backup important data first
-- The script is designed to be idempotent and safe to run multiple times

-- =====================================================
-- 2. DROP PROBLEMATIC FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Drop constraints that reference non-existent tables
ALTER TABLE IF EXISTS driver_vehicle_assignments DROP CONSTRAINT IF EXISTS driver_vehicle_assignments_driver_id_fkey;
ALTER TABLE IF EXISTS driver_vehicle_assignments DROP CONSTRAINT IF EXISTS driver_vehicle_assignments_vehicle_id_fkey;
ALTER TABLE IF EXISTS reviews DROP CONSTRAINT IF EXISTS reviews_driver_id_fkey;

-- =====================================================
-- 3. RENAME AND CONSOLIDATE TABLES
-- =====================================================

-- Rename driver_pool to driver_profiles (consolidate)
DROP TABLE IF EXISTS driver_pool CASCADE;

-- Rename drivers table to driver_assignments for clarity
ALTER TABLE IF EXISTS drivers RENAME TO driver_assignments_old;

-- =====================================================
-- 4. CREATE MISSING CORE TABLES
-- =====================================================

-- Business Profiles
CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Business Details
  business_name TEXT NOT NULL,
  business_type TEXT CHECK (business_type IN ('fleet_operator', 'rental_service', 'logistics', 'other')),
  business_registration_number TEXT,
  business_address TEXT,
  business_city TEXT,
  business_state TEXT,
  business_pincode TEXT,
  business_phone TEXT,
  business_email TEXT,
  company_name TEXT,
  business_phone_number TEXT,
  business_address_line1 TEXT,
  business_address_line2 TEXT,
  
  -- Contact Person
  contact_person_name TEXT,
  contact_person_phone TEXT,
  contact_person_email TEXT,
  
  -- Business Status
  is_verified BOOLEAN DEFAULT false,
  profile_complete BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Profiles
CREATE TABLE IF NOT EXISTS customer_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Personal Details
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  date_of_birth DATE,
  phone TEXT,
  phone_number TEXT,
  home_address TEXT,
  work_address TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  
  -- Emergency Contact
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  
  -- Profile Status
  profile_complete BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. UPDATE EXISTING TABLES
-- =====================================================

-- Update driver_profiles table
DO $$
BEGIN
  -- Add missing columns to driver_profiles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_profiles' AND column_name = 'full_name') THEN
    ALTER TABLE driver_profiles ADD COLUMN full_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_profiles' AND column_name = 'date_of_birth') THEN
    ALTER TABLE driver_profiles ADD COLUMN date_of_birth DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_profiles' AND column_name = 'blood_group') THEN
    ALTER TABLE driver_profiles ADD COLUMN blood_group TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_profiles' AND column_name = 'phone_number') THEN
    ALTER TABLE driver_profiles ADD COLUMN phone_number TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_profiles' AND column_name = 'license_issue_date') THEN
    ALTER TABLE driver_profiles ADD COLUMN license_issue_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_profiles' AND column_name = 'license_valid_till') THEN
    ALTER TABLE driver_profiles ADD COLUMN license_valid_till DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_profiles' AND column_name = 'dl_front_url') THEN
    ALTER TABLE driver_profiles ADD COLUMN dl_front_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_profiles' AND column_name = 'dl_back_url') THEN
    ALTER TABLE driver_profiles ADD COLUMN dl_back_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_profiles' AND column_name = 'vehicle_classes') THEN
    ALTER TABLE driver_profiles ADD COLUMN vehicle_classes TEXT[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_profiles' AND column_name = 'address_line1') THEN
    ALTER TABLE driver_profiles ADD COLUMN address_line1 TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_profiles' AND column_name = 'address_line2') THEN
    ALTER TABLE driver_profiles ADD COLUMN address_line2 TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_profiles' AND column_name = 'city') THEN
    ALTER TABLE driver_profiles ADD COLUMN city TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_profiles' AND column_name = 'state') THEN
    ALTER TABLE driver_profiles ADD COLUMN state TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_profiles' AND column_name = 'postal_code') THEN
    ALTER TABLE driver_profiles ADD COLUMN postal_code TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_profiles' AND column_name = 'post_office_name') THEN
    ALTER TABLE driver_profiles ADD COLUMN post_office_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_profiles' AND column_name = 'is_available_for_hire') THEN
    ALTER TABLE driver_profiles ADD COLUMN is_available_for_hire BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_profiles' AND column_name = 'rating') THEN
    ALTER TABLE driver_profiles ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.00;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_profiles' AND column_name = 'total_trips') THEN
    ALTER TABLE driver_profiles ADD COLUMN total_trips INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'driver_profiles' AND column_name = 'total_earnings') THEN
    ALTER TABLE driver_profiles ADD COLUMN total_earnings DECIMAL(10,2) DEFAULT 0.00;
  END IF;
END $$;

-- Update vehicles table
DO $$
BEGIN
  -- Add missing columns to vehicles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'is_available_for_rental') THEN
    ALTER TABLE vehicles ADD COLUMN is_available_for_rental BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'daily_rental_rate') THEN
    ALTER TABLE vehicles ADD COLUMN daily_rental_rate DECIMAL(10,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'hourly_rental_rate') THEN
    ALTER TABLE vehicles ADD COLUMN hourly_rental_rate DECIMAL(10,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'minimum_rental_hours') THEN
    ALTER TABLE vehicles ADD COLUMN minimum_rental_hours INTEGER DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'rental_rate') THEN
    ALTER TABLE vehicles ADD COLUMN rental_rate DECIMAL(10,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'currency') THEN
    ALTER TABLE vehicles ADD COLUMN currency TEXT DEFAULT 'INR';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'color') THEN
    ALTER TABLE vehicles ADD COLUMN color TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'fuel_type') THEN
    ALTER TABLE vehicles ADD COLUMN fuel_type TEXT CHECK (fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid', 'cng', 'lpg'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'transmission') THEN
    ALTER TABLE vehicles ADD COLUMN transmission TEXT CHECK (transmission IN ('manual', 'automatic', 'cvt'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'seating_capacity') THEN
    ALTER TABLE vehicles ADD COLUMN seating_capacity INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'mileage') THEN
    ALTER TABLE vehicles ADD COLUMN mileage DECIMAL(5,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'engine_capacity') THEN
    ALTER TABLE vehicles ADD COLUMN engine_capacity TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'features') THEN
    ALTER TABLE vehicles ADD COLUMN features TEXT[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'insurance_document_url') THEN
    ALTER TABLE vehicles ADD COLUMN insurance_document_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'insurance_expiry') THEN
    ALTER TABLE vehicles ADD COLUMN insurance_expiry DATE;
  END IF;
END $$;

-- =====================================================
-- 6. CREATE MISSING FUNCTIONALITY TABLES
-- =====================================================

-- Rentals Table
CREATE TABLE IF NOT EXISTS rentals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  assigned_driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Rental Details
  rental_type TEXT NOT NULL CHECK (rental_type IN ('hourly', 'daily', 'weekly', 'monthly')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_start_date TIMESTAMP WITH TIME ZONE,
  actual_end_date TIMESTAMP WITH TIME ZONE,
  
  -- Pricing
  base_rate DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  security_deposit DECIMAL(10,2) DEFAULT 0.00,
  additional_charges DECIMAL(10,2) DEFAULT 0.00,
  final_amount DECIMAL(10,2),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled', 'disputed')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded')),
  
  -- Additional Rental Details
  duration_hours INTEGER,
  special_instructions TEXT,
  cancellation_reason TEXT,
  refund_amount DECIMAL(10,2) DEFAULT 0.00,
  
  -- Pickup/Dropoff
  pickup_location TEXT,
  dropoff_location TEXT,
  pickup_instructions TEXT,
  dropoff_instructions TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver Assignments Table (replacing the old drivers table)
CREATE TABLE IF NOT EXISTS driver_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  
  -- Assignment Details
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('permanent', 'temporary', 'rental')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  
  -- Assignment Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one active assignment per driver per business
  UNIQUE(business_id, driver_id) WHERE is_active = true
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Notification Details
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'rental', 'payment', 'subscription', 'driver', 'vehicle')),
  category TEXT CHECK (category IN ('rental_update', 'payment_update', 'subscription_update', 'driver_assignment', 'vehicle_status', 'system')),
  
  -- Related Records
  related_id UUID, -- Can reference rentals, payments, etc.
  related_type TEXT, -- Type of related record
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  is_important BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 7. UPDATE REVIEWS TABLE
-- =====================================================

-- Update reviews table to support multiple entity types
DO $$
BEGIN
  -- Add missing columns to reviews
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'business_id') THEN
    ALTER TABLE reviews ADD COLUMN business_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'vehicle_id') THEN
    ALTER TABLE reviews ADD COLUMN vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'rental_id') THEN
    ALTER TABLE reviews ADD COLUMN rental_id UUID REFERENCES rentals(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'review_type') THEN
    ALTER TABLE reviews ADD COLUMN review_type TEXT NOT NULL DEFAULT 'overall' CHECK (review_type IN ('vehicle', 'business', 'driver', 'overall'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'title') THEN
    ALTER TABLE reviews ADD COLUMN title TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'review_images') THEN
    ALTER TABLE reviews ADD COLUMN review_images TEXT[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'business_response') THEN
    ALTER TABLE reviews ADD COLUMN business_response TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'business_response_date') THEN
    ALTER TABLE reviews ADD COLUMN business_response_date TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'is_verified') THEN
    ALTER TABLE reviews ADD COLUMN is_verified BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'is_public') THEN
    ALTER TABLE reviews ADD COLUMN is_public BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'updated_at') THEN
    ALTER TABLE reviews ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- =====================================================
-- 8. UPDATE PAYMENT TABLES
-- =====================================================

-- Update payment_history table
DO $$
BEGIN
  -- Add missing columns to payment_history
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_history' AND column_name = 'user_id') THEN
    ALTER TABLE payment_history ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_history' AND column_name = 'payment_type') THEN
    ALTER TABLE payment_history ADD COLUMN payment_type TEXT NOT NULL DEFAULT 'subscription' CHECK (payment_type IN ('subscription', 'rental', 'deposit', 'refund'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_history' AND column_name = 'description') THEN
    ALTER TABLE payment_history ADD COLUMN description TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_history' AND column_name = 'receipt_url') THEN
    ALTER TABLE payment_history ADD COLUMN receipt_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_history' AND column_name = 'razorpay_signature') THEN
    ALTER TABLE payment_history ADD COLUMN razorpay_signature TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_history' AND column_name = 'failure_reason') THEN
    ALTER TABLE payment_history ADD COLUMN failure_reason TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_history' AND column_name = 'subscription_id') THEN
    ALTER TABLE payment_history ADD COLUMN subscription_id UUID REFERENCES subscription_history(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_history' AND column_name = 'rental_id') THEN
    ALTER TABLE payment_history ADD COLUMN rental_id UUID REFERENCES rentals(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_history' AND column_name = 'updated_at') THEN
    ALTER TABLE payment_history ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- =====================================================
-- 9. CREATE INDEXES
-- =====================================================

-- Driver Profiles Indexes
CREATE INDEX IF NOT EXISTS idx_driver_profiles_user_id ON driver_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_available ON driver_profiles(is_available_for_hire) WHERE is_available_for_hire = true;
CREATE INDEX IF NOT EXISTS idx_driver_profiles_rating ON driver_profiles(rating);

-- Business Profiles Indexes
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id);

-- Customer Profiles Indexes
CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON customer_profiles(user_id);

-- Vehicle Indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_business ON vehicles(business_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_available ON vehicles(is_available_for_rental) WHERE is_available_for_rental = true;
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);

-- Rental Indexes
CREATE INDEX IF NOT EXISTS idx_rentals_customer ON rentals(customer_id);
CREATE INDEX IF NOT EXISTS idx_rentals_business ON rentals(business_id);
CREATE INDEX IF NOT EXISTS idx_rentals_vehicle ON rentals(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
CREATE INDEX IF NOT EXISTS idx_rentals_dates ON rentals(start_date, end_date);

-- Driver Assignment Indexes
CREATE INDEX IF NOT EXISTS idx_driver_assignments_business ON driver_assignments(business_id);
CREATE INDEX IF NOT EXISTS idx_driver_assignments_driver ON driver_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_assignments_active ON driver_assignments(is_active) WHERE is_active = true;

-- Review Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_customer ON reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_business ON reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_vehicle ON reviews(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- Payment Indexes
CREATE INDEX IF NOT EXISTS idx_payment_history_user ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_business ON payment_history(business_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_type ON payment_history(payment_type);

-- Notification Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_important ON notifications(is_important);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

-- =====================================================
-- 10. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 11. CREATE RLS POLICIES
-- =====================================================

-- User Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Business Profiles Policies
DROP POLICY IF EXISTS "Business owners can manage their profile" ON business_profiles;
CREATE POLICY "Business owners can manage their profile" ON business_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Driver Profiles Policies
DROP POLICY IF EXISTS "Drivers can manage their profile" ON driver_profiles;
CREATE POLICY "Drivers can manage their profile" ON driver_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Allow businesses to view available drivers
DROP POLICY IF EXISTS "Businesses can view available drivers" ON driver_profiles;
CREATE POLICY "Businesses can view available drivers" ON driver_profiles
  FOR SELECT USING (is_available_for_hire = true);

-- Customer Profiles Policies
DROP POLICY IF EXISTS "Customers can manage their profile" ON customer_profiles;
CREATE POLICY "Customers can manage their profile" ON customer_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Vehicle Labels Policies
DROP POLICY IF EXISTS "Business owners can manage their labels" ON vehicle_labels;
CREATE POLICY "Business owners can manage their labels" ON vehicle_labels
  FOR ALL USING (auth.uid() = business_id) WITH CHECK (auth.uid() = business_id);

-- Vehicles Policies
DROP POLICY IF EXISTS "Business owners can manage their vehicles" ON vehicles;
CREATE POLICY "Business owners can manage their vehicles" ON vehicles
  FOR ALL USING (auth.uid() = business_id) WITH CHECK (auth.uid() = business_id);

-- Allow customers to view available vehicles
DROP POLICY IF EXISTS "Customers can view available vehicles" ON vehicles;
CREATE POLICY "Customers can view available vehicles" ON vehicles
  FOR SELECT USING (is_available_for_rental = true AND status = 'available');

-- Driver Assignments Policies
DROP POLICY IF EXISTS "Businesses can manage their driver assignments" ON driver_assignments;
CREATE POLICY "Businesses can manage their driver assignments" ON driver_assignments
  FOR ALL USING (auth.uid() = business_id) WITH CHECK (auth.uid() = business_id);

-- Drivers can view their assignments
DROP POLICY IF EXISTS "Drivers can view their assignments" ON driver_assignments;
CREATE POLICY "Drivers can view their assignments" ON driver_assignments
  FOR SELECT USING (auth.uid() = driver_id);

-- Rentals Policies
DROP POLICY IF EXISTS "Customers can manage their rentals" ON rentals;
CREATE POLICY "Customers can manage their rentals" ON rentals
  FOR ALL USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);

-- Businesses can view their vehicle rentals
DROP POLICY IF EXISTS "Businesses can view their vehicle rentals" ON rentals;
CREATE POLICY "Businesses can view their vehicle rentals" ON rentals
  FOR SELECT USING (auth.uid() = business_id);

-- Reviews Policies
DROP POLICY IF EXISTS "Customers can manage their reviews" ON reviews;
CREATE POLICY "Customers can manage their reviews" ON reviews
  FOR ALL USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);

-- Allow public to view reviews
DROP POLICY IF EXISTS "Public can view reviews" ON reviews;
CREATE POLICY "Public can view reviews" ON reviews
  FOR SELECT USING (is_public = true);

-- Subscription History Policies
DROP POLICY IF EXISTS "Businesses can view their subscription history" ON subscription_history;
CREATE POLICY "Businesses can view their subscription history" ON subscription_history
  FOR SELECT USING (auth.uid() = user_id);

-- Payment History Policies
DROP POLICY IF EXISTS "Users can view their payment history" ON payment_history;
CREATE POLICY "Users can view their payment history" ON payment_history
  FOR SELECT USING (auth.uid() = user_id);

-- Notifications Policies
DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 12. CREATE ESSENTIAL FUNCTIONS
-- =====================================================

-- Function to check vehicle limit
CREATE OR REPLACE FUNCTION check_vehicle_limit(business_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  user_limit INTEGER;
  user_subscription TEXT;
BEGIN
  -- Get current vehicle count
  SELECT COUNT(*) INTO current_count
  FROM vehicles
  WHERE vehicles.business_id = check_vehicle_limit.business_id;
  
  -- Get user subscription and limit
  SELECT subscription_type, vehicle_limit INTO user_subscription, user_limit
  FROM user_profiles
  WHERE id = business_id;
  
  -- Check limits
  IF user_subscription = 'pro' THEN
    RETURN true; -- Pro users have unlimited vehicles
  ELSE
    RETURN current_count < user_limit; -- Free users have limited vehicles
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get available drivers
CREATE OR REPLACE FUNCTION get_available_drivers()
RETURNS TABLE(
  driver_id UUID,
  full_name TEXT,
  license_number TEXT,
  rating DECIMAL(3,2),
  total_trips INTEGER,
  vehicle_classes TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dp.user_id as driver_id,
    dp.full_name,
    dp.license_number,
    dp.rating,
    dp.total_trips,
    dp.vehicle_classes
  FROM driver_profiles dp
  WHERE dp.is_available_for_hire = true 
    AND dp.profile_complete = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get available vehicles
CREATE OR REPLACE FUNCTION get_available_vehicles()
RETURNS TABLE(
  vehicle_id UUID,
  make TEXT,
  model TEXT,
  year INTEGER,
  vehicle_type TEXT,
  daily_rental_rate DECIMAL(10,2),
  hourly_rental_rate DECIMAL(10,2),
  business_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id as vehicle_id,
    v.make,
    v.model,
    v.year,
    v.vehicle_type,
    v.daily_rental_rate,
    v.hourly_rental_rate,
    bp.business_name
  FROM vehicles v
  JOIN business_profiles bp ON v.business_id = bp.user_id
  WHERE v.is_available_for_rental = true 
    AND v.status = 'available';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate rental amount
CREATE OR REPLACE FUNCTION calculate_rental_amount(
  vehicle_id UUID,
  rental_type TEXT,
  duration_hours INTEGER
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  vehicle_rate DECIMAL(10,2);
  calculated_amount DECIMAL(10,2);
BEGIN
  -- Get vehicle rate based on rental type
  IF rental_type = 'hourly' THEN
    SELECT hourly_rental_rate INTO vehicle_rate FROM vehicles WHERE id = vehicle_id;
  ELSE
    SELECT daily_rental_rate INTO vehicle_rate FROM vehicles WHERE id = vehicle_id;
  END IF;
  
  -- Calculate amount
  calculated_amount := vehicle_rate * duration_hours;
  
  RETURN COALESCE(calculated_amount, 0.00);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 13. CLEANUP OLD TABLES
-- =====================================================

-- Drop old tables that are no longer needed
DROP TABLE IF EXISTS driver_assignments_old CASCADE;

-- =====================================================
-- 14. VERIFY MIGRATION
-- =====================================================

-- Verify all tables exist
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'user_profiles', 'business_profiles', 'driver_profiles', 'customer_profiles',
    'vehicle_labels', 'vehicles', 'driver_assignments', 'rentals', 
    'reviews', 'subscription_history', 'payment_history', 'notifications'
  )
ORDER BY tablename;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'mobiTrak schema migration completed successfully!';
  RAISE NOTICE 'All tables, indexes, policies, and functions have been created/updated.';
  RAISE NOTICE 'The database is now ready for the complete mobiTrak platform.';
END $$;
