-- =====================================================
-- mobiTrak Fleet Management Platform - Optimized Schema
-- =====================================================
-- Complete database schema for fleet management and rental platform
-- Supports: Business, Driver, Customer roles with proper relationships

-- =====================================================
-- 1. CORE USER MANAGEMENT
-- =====================================================

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  
  -- Basic Profile Info
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  
  -- Role & Permissions
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('business', 'driver', 'customer')),
  
  -- Subscription Info (for business users)
  subscription_type TEXT DEFAULT 'free' CHECK (subscription_type IN ('free', 'pro')),
  vehicle_limit INTEGER DEFAULT 5,
  cabin_monitoring_enabled BOOLEAN DEFAULT false,
  
  -- Profile Status
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure user_profiles has all required fields
DO $$
BEGIN
  -- Add role column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'role') THEN
    ALTER TABLE user_profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('business', 'driver', 'customer'));
  END IF;
  
  -- Add subscription fields for businesses
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'subscription_type') THEN
    ALTER TABLE user_profiles ADD COLUMN subscription_type TEXT DEFAULT 'free' CHECK (subscription_type IN ('free', 'pro'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'vehicle_limit') THEN
    ALTER TABLE user_profiles ADD COLUMN vehicle_limit INTEGER DEFAULT 5;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'cabin_monitoring_enabled') THEN
    ALTER TABLE user_profiles ADD COLUMN cabin_monitoring_enabled BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'subscription_start_date') THEN
    ALTER TABLE user_profiles ADD COLUMN subscription_start_date TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'subscription_end_date') THEN
    ALTER TABLE user_profiles ADD COLUMN subscription_end_date TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- =====================================================
-- 2. ROLE-SPECIFIC PROFILE TABLES
-- =====================================================

-- Business Profiles - Extended business information
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
  verification_documents JSONB, -- Store verification document URLs
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver Profiles - Extended driver information (OCR-enhanced)
CREATE TABLE IF NOT EXISTS driver_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Personal Details
  full_name TEXT,
  date_of_birth DATE,
  phone_number TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  
  -- License Details (OCR-extracted)
  license_number TEXT UNIQUE,
  license_type TEXT CHECK (license_type IN ('LMV', 'MCWG', 'MGV', 'HMV', 'HGMV', 'HPMV')),
  license_expiry DATE,
  license_image_url TEXT,
  
  -- Experience & Skills
  years_of_experience INTEGER DEFAULT 0,
  previous_companies TEXT[],
  specializations TEXT[],
  preferred_vehicle_types TEXT[],
  
  -- Availability & Status
  is_available_for_hire BOOLEAN DEFAULT true,
  profile_complete BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  
  -- Performance Metrics
  rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
  total_trips INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0.00,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure required driver_profiles columns exist for idempotent migrations
DO $$
BEGIN
  -- Add is_available_for_hire if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_profiles' AND column_name = 'is_available_for_hire'
  ) THEN
    ALTER TABLE driver_profiles ADD COLUMN is_available_for_hire BOOLEAN DEFAULT true;
  END IF;

  -- Add profile_complete if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_profiles' AND column_name = 'profile_complete'
  ) THEN
    ALTER TABLE driver_profiles ADD COLUMN profile_complete BOOLEAN DEFAULT false;
  END IF;
  
  -- Add comprehensive driver profile fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE driver_profiles ADD COLUMN full_name TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_profiles' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE driver_profiles ADD COLUMN date_of_birth DATE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_profiles' AND column_name = 'blood_group'
  ) THEN
    ALTER TABLE driver_profiles ADD COLUMN blood_group TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE driver_profiles ADD COLUMN phone_number TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_profiles' AND column_name = 'license_issue_date'
  ) THEN
    ALTER TABLE driver_profiles ADD COLUMN license_issue_date DATE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_profiles' AND column_name = 'license_valid_till'
  ) THEN
    ALTER TABLE driver_profiles ADD COLUMN license_valid_till DATE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_profiles' AND column_name = 'dl_front_url'
  ) THEN
    ALTER TABLE driver_profiles ADD COLUMN dl_front_url TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_profiles' AND column_name = 'dl_back_url'
  ) THEN
    ALTER TABLE driver_profiles ADD COLUMN dl_back_url TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_profiles' AND column_name = 'vehicle_classes'
  ) THEN
    ALTER TABLE driver_profiles ADD COLUMN vehicle_classes TEXT[];
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_profiles' AND column_name = 'address_line1'
  ) THEN
    ALTER TABLE driver_profiles ADD COLUMN address_line1 TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_profiles' AND column_name = 'address_line2'
  ) THEN
    ALTER TABLE driver_profiles ADD COLUMN address_line2 TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_profiles' AND column_name = 'city'
  ) THEN
    ALTER TABLE driver_profiles ADD COLUMN city TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_profiles' AND column_name = 'state'
  ) THEN
    ALTER TABLE driver_profiles ADD COLUMN state TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_profiles' AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE driver_profiles ADD COLUMN postal_code TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_profiles' AND column_name = 'post_office_name'
  ) THEN
    ALTER TABLE driver_profiles ADD COLUMN post_office_name TEXT;
  END IF;
END $$;

-- Customer Profiles - Extended customer information
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
  is_verified BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure required rating columns exist (idempotent safety for migrations)
DO $$
BEGIN
  -- driver_profiles.rating
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_profiles' AND column_name = 'rating'
  ) THEN
    ALTER TABLE driver_profiles ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.00;
  END IF;

  -- reviews.rating
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' AND column_name = 'rating'
  ) THEN
    ALTER TABLE reviews ADD COLUMN rating INTEGER;
  END IF;
END $$;

-- =====================================================
-- 3. VEHICLE MANAGEMENT
-- =====================================================

-- Vehicle Labels - For business vehicle categorization
CREATE TABLE IF NOT EXISTS vehicle_labels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(business_id, name)
);

-- Vehicles - Main vehicle table (OCR-enhanced)
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label_id UUID REFERENCES vehicle_labels(id) ON DELETE SET NULL,
  
  -- Basic Vehicle Info
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('sedan', 'suv', 'hatchback', 'truck', 'bus', 'van', 'motorcycle', 'other')),
  
  -- Registration Details (OCR-extracted from RC Book)
  license_plate TEXT UNIQUE NOT NULL,
  registration_number TEXT,
  chassis_number TEXT,
  engine_number TEXT,
  owner_name TEXT,
  
  -- Vehicle Status
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'under_maintenance', 'unavailable', 'in_use', 'rented')),
  is_available_for_rental BOOLEAN DEFAULT true,
  
  -- Documents & Images
  vehicle_image_url TEXT,
  rc_book_url TEXT,
  insurance_document_url TEXT,
  insurance_expiry DATE,
  
  -- Rental Details
  daily_rental_rate DECIMAL(10,2),
  hourly_rental_rate DECIMAL(10,2),
  minimum_rental_hours INTEGER DEFAULT 1,
  rental_rate DECIMAL(10,2),
  currency TEXT DEFAULT 'INR',
  
  -- Additional Vehicle Details
  color TEXT,
  fuel_type TEXT CHECK (fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid', 'cng', 'lpg')),
  transmission TEXT CHECK (transmission IN ('manual', 'automatic', 'cvt')),
  seating_capacity INTEGER,
  mileage DECIMAL(5,2),
  engine_capacity TEXT,
  features TEXT[],
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure required vehicles columns exist for idempotent migrations
DO $$
BEGIN
  -- Add is_available_for_rental if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicles' AND column_name = 'is_available_for_rental'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN is_available_for_rental BOOLEAN DEFAULT true;
  END IF;

  -- Add status if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicles' AND column_name = 'status'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN status TEXT DEFAULT 'available';
  END IF;
END $$;

-- =====================================================
-- 4. DRIVER ASSIGNMENTS & HIRING
-- =====================================================

-- Driver Assignments - Links businesses with hired drivers and vehicles
CREATE TABLE IF NOT EXISTS driver_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  
  -- Assignment Details
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('hired', 'vehicle_assignment', 'temporary')),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  
  -- Terms & Conditions
  salary_per_month DECIMAL(10,2),
  commission_percentage DECIMAL(5,2),
  working_hours_per_day INTEGER DEFAULT 8,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated', 'on_leave')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. RENTAL SYSTEM
-- =====================================================

-- Rentals - Customer vehicle rentals
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

-- =====================================================
-- 6. REVIEWS & RATINGS
-- =====================================================

-- Reviews - Customer reviews for vehicles and businesses
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rental_id UUID REFERENCES rentals(id) ON DELETE CASCADE NOT NULL,
  
  -- Review Details
  review_type TEXT NOT NULL CHECK (review_type IN ('vehicle', 'business', 'driver', 'overall')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  review_images TEXT[], -- Array of image URLs
  
  -- Response from Business
  business_response TEXT,
  business_response_date TIMESTAMP WITH TIME ZONE,
  
  -- Status
  is_verified BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one review per rental
  UNIQUE(rental_id, review_type)
);

-- Ensure required reviews columns exist for idempotent migrations
DO $$
BEGIN
  -- Add business_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE reviews ADD COLUMN business_id UUID;
    ALTER TABLE reviews
      ADD CONSTRAINT reviews_business_id_fkey
      FOREIGN KEY (business_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  -- Add vehicle_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' AND column_name = 'vehicle_id'
  ) THEN
    ALTER TABLE reviews ADD COLUMN vehicle_id UUID;
    ALTER TABLE reviews
      ADD CONSTRAINT reviews_vehicle_id_fkey
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- =====================================================
-- 7. SUBSCRIPTION & PAYMENT SYSTEM
-- =====================================================

-- Subscription History - Track business subscription changes
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Subscription Details
  subscription_type TEXT NOT NULL CHECK (subscription_type IN ('free', 'pro')),
  action TEXT NOT NULL CHECK (action IN ('upgrade', 'downgrade', 'renewal', 'cancellation')),
  previous_subscription_type TEXT,
  plan_name TEXT,
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
  is_active BOOLEAN DEFAULT true,
  
  -- Payment Details
  payment_amount DECIMAL(10,2),
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  
  -- Subscription Period
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment History - Track all payments (subscriptions, rentals, etc.)
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Payment Details
  payment_type TEXT NOT NULL CHECK (payment_type IN ('subscription', 'rental', 'deposit', 'refund')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  payment_method TEXT,
  description TEXT,
  receipt_url TEXT,
  
  -- Razorpay Integration
  razorpay_payment_id TEXT UNIQUE,
  razorpay_order_id TEXT,
  razorpay_signature TEXT,
  
  -- Payment Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  failure_reason TEXT,
  
  -- Related Records
  subscription_id UUID REFERENCES subscription_history(id) ON DELETE SET NULL,
  rental_id UUID REFERENCES rentals(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. NOTIFICATIONS SYSTEM
-- =====================================================

-- Notifications - System notifications for users
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
-- 9. INDEXES FOR PERFORMANCE
-- =====================================================

-- User Profiles Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription ON user_profiles(subscription_type) WHERE role = 'business';

-- Business Profiles Indexes
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_verified ON business_profiles(is_verified);

-- Driver Profiles Indexes
CREATE INDEX IF NOT EXISTS idx_driver_profiles_user_id ON driver_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_available ON driver_profiles(is_available_for_hire) WHERE is_available_for_hire = true;
CREATE INDEX IF NOT EXISTS idx_driver_profiles_license ON driver_profiles(license_number);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_rating ON driver_profiles(rating);

-- Customer Profiles Indexes
CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON customer_profiles(user_id);

-- Vehicle Indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_business_id ON vehicles(business_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_available ON vehicles(is_available_for_rental) WHERE is_available_for_rental = true;
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON vehicles(vehicle_type);

-- Driver Assignment Indexes
CREATE INDEX IF NOT EXISTS idx_driver_assignments_business ON driver_assignments(business_id);
CREATE INDEX IF NOT EXISTS idx_driver_assignments_driver ON driver_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_assignments_active ON driver_assignments(is_active) WHERE is_active = true;

-- Ensure unique active assignment per driver per business (partial unique index)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND indexname = 'uniq_active_assignment_business_driver'
  ) THEN
    CREATE UNIQUE INDEX uniq_active_assignment_business_driver
      ON driver_assignments(business_id, driver_id)
      WHERE is_active = true;
  END IF;
END $$;

-- Rental Indexes
CREATE INDEX IF NOT EXISTS idx_rentals_customer ON rentals(customer_id);
CREATE INDEX IF NOT EXISTS idx_rentals_business ON rentals(business_id);
CREATE INDEX IF NOT EXISTS idx_rentals_vehicle ON rentals(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
CREATE INDEX IF NOT EXISTS idx_rentals_dates ON rentals(start_date, end_date);

-- Review Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_customer ON reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_business ON reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_vehicle ON reviews(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- Payment Indexes
CREATE INDEX IF NOT EXISTS idx_payment_history_user ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_razorpay ON payment_history(razorpay_payment_id);

-- Notification Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_important ON notifications(is_important);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
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
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

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
  FOR SELECT USING (
    is_available_for_hire = true AND 
    profile_complete = true AND
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'business'
    )
  );

-- Customer Profiles Policies
DROP POLICY IF EXISTS "Customers can manage their profile" ON customer_profiles;
CREATE POLICY "Customers can manage their profile" ON customer_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Vehicle Labels Policies
DROP POLICY IF EXISTS "Businesses can manage their vehicle labels" ON vehicle_labels;
CREATE POLICY "Businesses can manage their vehicle labels" ON vehicle_labels
  FOR ALL USING (auth.uid() = business_id) WITH CHECK (auth.uid() = business_id);

-- Vehicles Policies
DROP POLICY IF EXISTS "Businesses can manage their vehicles" ON vehicles;
CREATE POLICY "Businesses can manage their vehicles" ON vehicles
  FOR ALL USING (auth.uid() = business_id) WITH CHECK (auth.uid() = business_id);

-- Allow customers to view available vehicles
DROP POLICY IF EXISTS "Customers can view available vehicles" ON vehicles;
CREATE POLICY "Customers can view available vehicles" ON vehicles
  FOR SELECT USING (
    is_available_for_rental = true AND 
    status = 'available' AND
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'customer'
    )
  );

-- Driver Assignments Policies
DROP POLICY IF EXISTS "Businesses can manage their driver assignments" ON driver_assignments;
CREATE POLICY "Businesses can manage their driver assignments" ON driver_assignments
  FOR ALL USING (auth.uid() = business_id) WITH CHECK (auth.uid() = business_id);

DROP POLICY IF EXISTS "Drivers can view their assignments" ON driver_assignments;
CREATE POLICY "Drivers can view their assignments" ON driver_assignments
  FOR SELECT USING (auth.uid() = driver_id);

-- Rentals Policies
DROP POLICY IF EXISTS "Customers can manage their rentals" ON rentals;
CREATE POLICY "Customers can manage their rentals" ON rentals
  FOR ALL USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Businesses can view their vehicle rentals" ON rentals;
CREATE POLICY "Businesses can view their vehicle rentals" ON rentals
  FOR SELECT USING (auth.uid() = business_id);

DROP POLICY IF EXISTS "Assigned drivers can view their rentals" ON rentals;
CREATE POLICY "Assigned drivers can view their rentals" ON rentals
  FOR SELECT USING (auth.uid() = assigned_driver_id);

-- Reviews Policies
DROP POLICY IF EXISTS "Customers can manage their reviews" ON reviews;
CREATE POLICY "Customers can manage their reviews" ON reviews
  FOR ALL USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Businesses can view their reviews" ON reviews;
CREATE POLICY "Businesses can view their reviews" ON reviews
  FOR SELECT USING (auth.uid() = business_id);

-- Public reviews for customers
DROP POLICY IF EXISTS "Public can view verified reviews" ON reviews;
CREATE POLICY "Public can view verified reviews" ON reviews
  FOR SELECT USING (is_public = true AND is_verified = true);

-- Subscription History Policies
DROP POLICY IF EXISTS "Businesses can view their subscription history" ON subscription_history;
CREATE POLICY "Businesses can view their subscription history" ON subscription_history
  FOR SELECT USING (auth.uid() = business_id);

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
-- 10. TRIGGERS & FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_business_profiles_updated_at
  BEFORE UPDATE ON business_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_profiles_updated_at
  BEFORE UPDATE ON driver_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_profiles_updated_at
  BEFORE UPDATE ON customer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_labels_updated_at
  BEFORE UPDATE ON vehicle_labels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_assignments_updated_at
  BEFORE UPDATE ON driver_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rentals_updated_at
  BEFORE UPDATE ON rentals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_history_updated_at
  BEFORE UPDATE ON payment_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check vehicle limit for businesses
CREATE OR REPLACE FUNCTION check_vehicle_limit(business_id UUID)
RETURNS TABLE(
  current_count INTEGER, 
  vehicle_limit INTEGER, 
  can_add_vehicle BOOLEAN, 
  subscription_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(v.vehicle_count, 0)::INTEGER as current_count,
    COALESCE(up.vehicle_limit, 5)::INTEGER as vehicle_limit,
    CASE 
      WHEN up.subscription_type = 'pro' THEN true
      WHEN COALESCE(v.vehicle_count, 0) < COALESCE(up.vehicle_limit, 5) THEN true
      ELSE false
    END as can_add_vehicle,
    COALESCE(up.subscription_type, 'free')::TEXT as subscription_type
  FROM user_profiles up
  LEFT JOIN (
    SELECT business_id, COUNT(*) as vehicle_count
    FROM vehicles
    WHERE business_id = check_vehicle_limit.business_id
    GROUP BY business_id
  ) v ON up.id = v.business_id
  WHERE up.id = check_vehicle_limit.business_id
    AND up.role = 'business';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile with role from metadata
  INSERT INTO public.user_profiles (id, email, role, created_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 11. INITIAL DATA SETUP
-- =====================================================

-- Update existing business users to have default subscription settings
UPDATE user_profiles 
SET 
  subscription_type = COALESCE(subscription_type, 'free'),
  vehicle_limit = COALESCE(vehicle_limit, 5),
  cabin_monitoring_enabled = COALESCE(cabin_monitoring_enabled, false)
WHERE role = 'business' 
  AND subscription_type IS NULL;

-- =====================================================
-- 12. COMMENTS & DOCUMENTATION
-- =====================================================

COMMENT ON TABLE user_profiles IS 'Central user authentication and basic profile information';
COMMENT ON TABLE business_profiles IS 'Extended business information and verification details';
COMMENT ON TABLE driver_profiles IS 'Driver profile with OCR-extracted license information';
COMMENT ON TABLE customer_profiles IS 'Customer profile information';
COMMENT ON TABLE vehicle_labels IS 'Business-defined vehicle categories and labels';
COMMENT ON TABLE vehicles IS 'Vehicle information with OCR-extracted RC book details';
COMMENT ON TABLE driver_assignments IS 'Business-driver-vehicle assignment relationships';
COMMENT ON TABLE rentals IS 'Customer vehicle rental transactions';
COMMENT ON TABLE reviews IS 'Customer reviews for vehicles, businesses, and drivers';
COMMENT ON TABLE subscription_history IS 'Business subscription plan changes and payments';
COMMENT ON TABLE payment_history IS 'All payment transactions via Razorpay';

-- =====================================================
-- 13. ADDITIONAL RPCs, TRIGGERS, VIEWS, GRANTS (Consolidated)
-- =====================================================

-- RPCs (CREATE OR REPLACE for idempotency)

-- Re-assert check_vehicle_limit (defined earlier) for idempotency
CREATE OR REPLACE FUNCTION check_vehicle_limit(business_id UUID)
RETURNS TABLE(
  current_count INTEGER, 
  vehicle_limit INTEGER, 
  can_add_vehicle BOOLEAN, 
  subscription_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(v.vehicle_count, 0)::INTEGER as current_count,
    COALESCE(up.vehicle_limit, 5)::INTEGER as vehicle_limit,
    CASE 
      WHEN up.subscription_type = 'pro' THEN true
      WHEN COALESCE(v.vehicle_count, 0) < COALESCE(up.vehicle_limit, 5) THEN true
      ELSE false
    END as can_add_vehicle,
    COALESCE(up.subscription_type, 'free')::TEXT as subscription_type
  FROM user_profiles up
  LEFT JOIN (
    SELECT business_id, COUNT(*) as vehicle_count
    FROM vehicles
    WHERE business_id = check_vehicle_limit.business_id
    GROUP BY business_id
  ) v ON up.id = v.business_id
  WHERE up.id = check_vehicle_limit.business_id
    AND up.role = 'business';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_available_drivers()
RETURNS TABLE(
  driver_id UUID,
  full_name TEXT,
  phone_number TEXT,
  years_of_experience INTEGER,
  rating DECIMAL(3,2),
  license_type TEXT,
  specializations TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dp.user_id as driver_id,
    dp.full_name,
    dp.phone_number,
    dp.years_of_experience,
    dp.rating,
    dp.license_type,
    dp.specializations
  FROM driver_profiles dp
  JOIN user_profiles up ON dp.user_id = up.id
  WHERE dp.is_available_for_hire = true 
    AND dp.profile_complete = true
    AND up.role = 'driver'
  ORDER BY dp.rating DESC, dp.years_of_experience DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_available_vehicles()
RETURNS TABLE(
  vehicle_id UUID,
  make TEXT,
  model TEXT,
  year INTEGER,
  vehicle_type TEXT,
  license_plate TEXT,
  daily_rental_rate DECIMAL(10,2),
  business_name TEXT,
  business_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id as vehicle_id,
    v.make,
    v.model,
    v.year,
    v.vehicle_type,
    v.license_plate,
    v.daily_rental_rate,
    bp.business_name,
    v.business_id
  FROM vehicles v
  JOIN business_profiles bp ON v.business_id = bp.user_id
  WHERE v.is_available_for_rental = true 
    AND v.status = 'available'
  ORDER BY v.daily_rental_rate ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  SELECT 
    CASE 
      WHEN rental_type = 'hourly' THEN hourly_rental_rate
      WHEN rental_type = 'daily' THEN daily_rental_rate
      ELSE daily_rental_rate
    END
  INTO vehicle_rate
  FROM vehicles 
  WHERE id = vehicle_id;
  
  IF rental_type = 'hourly' THEN
    calculated_amount := vehicle_rate * duration_hours;
  ELSIF rental_type = 'daily' THEN
    calculated_amount := vehicle_rate * CEIL(duration_hours::DECIMAL / 24);
  ELSE
    calculated_amount := vehicle_rate * CEIL(duration_hours::DECIMAL / 24);
  END IF;
  
  RETURN COALESCE(calculated_amount, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_driver_rating(driver_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE driver_profiles 
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews 
      WHERE reviews.driver_id = update_driver_rating.driver_id
        AND review_type = 'driver'
    ),
    total_trips = (
      SELECT COUNT(*)
      FROM rentals 
      WHERE rentals.assigned_driver_id = update_driver_rating.driver_id
        AND status = 'completed'
    )
  WHERE user_id = driver_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers

CREATE OR REPLACE FUNCTION trigger_update_driver_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.driver_id IS NOT NULL THEN
    PERFORM update_driver_rating(NEW.driver_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_review_driver_rating ON reviews;
CREATE TRIGGER trigger_review_driver_rating
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_driver_rating();

CREATE OR REPLACE FUNCTION trigger_update_vehicle_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' OR NEW.status = 'active' THEN
    UPDATE vehicles SET status = 'in_use' WHERE id = NEW.vehicle_id;
  ELSIF NEW.status = 'completed' OR NEW.status = 'cancelled' THEN
    UPDATE vehicles SET status = 'available' WHERE id = NEW.vehicle_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_rental_vehicle_status ON rentals;
CREATE TRIGGER trigger_rental_vehicle_status
  AFTER INSERT OR UPDATE ON rentals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_vehicle_status();

-- Views

CREATE OR REPLACE VIEW business_dashboard_view AS
SELECT 
  up.id as business_id,
  bp.business_name,
  up.subscription_type,
  up.vehicle_limit,
  COUNT(v.id) as total_vehicles,
  COUNT(CASE WHEN v.status = 'available' THEN 1 END) as available_vehicles,
  COUNT(da.id) as hired_drivers,
  COUNT(r.id) as total_rentals,
  COUNT(CASE WHEN r.status = 'active' THEN 1 END) as active_rentals,
  COALESCE(AVG(rv.rating), 0) as business_rating
FROM user_profiles up
LEFT JOIN business_profiles bp ON up.id = bp.user_id
LEFT JOIN vehicles v ON up.id = v.business_id
LEFT JOIN driver_assignments da ON up.id = da.business_id AND da.is_active = true
LEFT JOIN rentals r ON up.id = r.business_id
LEFT JOIN reviews rv ON up.id = rv.business_id AND rv.review_type = 'business'
WHERE up.role = 'business'
GROUP BY up.id, bp.business_name, up.subscription_type, up.vehicle_limit;

CREATE OR REPLACE VIEW driver_dashboard_view AS
SELECT 
  dp.user_id as driver_id,
  dp.full_name,
  dp.rating,
  dp.total_trips,
  dp.is_available_for_hire,
  COUNT(da.id) as active_assignments,
  COUNT(r.id) as total_rentals,
  COUNT(CASE WHEN r.status = 'active' THEN 1 END) as active_rentals,
  COALESCE(SUM(r.final_amount), 0) as total_earnings
FROM driver_profiles dp
LEFT JOIN driver_assignments da ON dp.user_id = da.driver_id AND da.is_active = true
LEFT JOIN rentals r ON dp.user_id = r.assigned_driver_id
GROUP BY dp.user_id, dp.full_name, dp.rating, dp.total_trips, dp.is_available_for_hire;

CREATE OR REPLACE VIEW customer_dashboard_view AS
SELECT 
  cp.user_id as customer_id,
  cp.full_name,
  COUNT(r.id) as total_rentals,
  COUNT(CASE WHEN r.status = 'active' THEN 1 END) as active_rentals,
  COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as completed_rentals,
  COALESCE(SUM(r.final_amount), 0) as total_spent
FROM customer_profiles cp
LEFT JOIN rentals r ON cp.user_id = r.customer_id
GROUP BY cp.user_id, cp.full_name;

-- Grants

GRANT EXECUTE ON FUNCTION check_vehicle_limit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_drivers() TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_vehicles() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_rental_amount(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_driver_rating(UUID) TO authenticated;

GRANT SELECT ON business_dashboard_view TO authenticated;
GRANT SELECT ON driver_dashboard_view TO authenticated;
GRANT SELECT ON customer_dashboard_view TO authenticated;

-- Comments for objects created here
COMMENT ON FUNCTION check_vehicle_limit(UUID) IS 'Check if business can add more vehicles based on subscription';
COMMENT ON FUNCTION get_available_drivers() IS 'Get list of available drivers for hiring';
COMMENT ON FUNCTION get_available_vehicles() IS 'Get list of available vehicles for rental';
COMMENT ON FUNCTION calculate_rental_amount(UUID, TEXT, INTEGER) IS 'Calculate rental amount based on vehicle and duration';
COMMENT ON FUNCTION update_driver_rating(UUID) IS 'Update driver rating based on reviews';
COMMENT ON VIEW business_dashboard_view IS 'Dashboard data for business users';
COMMENT ON VIEW driver_dashboard_view IS 'Dashboard data for driver users';
COMMENT ON VIEW customer_dashboard_view IS 'Dashboard data for customer users';

-- =====================================================
-- 12. ADDITIONAL RPC FUNCTIONS
-- =====================================================

-- Function to get user notifications
CREATE OR REPLACE FUNCTION get_user_notifications(user_uuid UUID)
RETURNS TABLE(
  id UUID,
  title TEXT,
  message TEXT,
  type TEXT,
  category TEXT,
  is_read BOOLEAN,
  is_important BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.message,
    n.type,
    n.category,
    n.is_read,
    n.is_important,
    n.created_at
  FROM notifications n
  WHERE n.user_id = user_uuid
  ORDER BY n.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications 
  SET is_read = true, read_at = NOW()
  WHERE id = notification_uuid AND user_id = user_uuid;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get driver profile completion status
CREATE OR REPLACE FUNCTION get_driver_profile_status(driver_uuid UUID)
RETURNS TABLE(
  profile_complete BOOLEAN,
  completion_percentage INTEGER,
  missing_fields TEXT[]
) AS $$
DECLARE
  profile_data RECORD;
  missing_fields TEXT[] := '{}';
  total_fields INTEGER := 0;
  completed_fields INTEGER := 0;
BEGIN
  SELECT * INTO profile_data FROM driver_profiles WHERE user_id = driver_uuid;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, ARRAY['Profile not found'];
    RETURN;
  END IF;
  
  -- Check required fields
  total_fields := 8; -- Adjust based on actual required fields
  
  IF profile_data.full_name IS NULL OR profile_data.full_name = '' THEN
    missing_fields := array_append(missing_fields, 'full_name');
  ELSE
    completed_fields := completed_fields + 1;
  END IF;
  
  IF profile_data.date_of_birth IS NULL THEN
    missing_fields := array_append(missing_fields, 'date_of_birth');
  ELSE
    completed_fields := completed_fields + 1;
  END IF;
  
  IF profile_data.blood_group IS NULL OR profile_data.blood_group = '' THEN
    missing_fields := array_append(missing_fields, 'blood_group');
  ELSE
    completed_fields := completed_fields + 1;
  END IF;
  
  IF profile_data.phone_number IS NULL OR profile_data.phone_number = '' THEN
    missing_fields := array_append(missing_fields, 'phone_number');
  ELSE
    completed_fields := completed_fields + 1;
  END IF;
  
  IF profile_data.license_number IS NULL OR profile_data.license_number = '' THEN
    missing_fields := array_append(missing_fields, 'license_number');
  ELSE
    completed_fields := completed_fields + 1;
  END IF;
  
  IF profile_data.license_issue_date IS NULL THEN
    missing_fields := array_append(missing_fields, 'license_issue_date');
  ELSE
    completed_fields := completed_fields + 1;
  END IF;
  
  IF profile_data.license_valid_till IS NULL THEN
    missing_fields := array_append(missing_fields, 'license_valid_till');
  ELSE
    completed_fields := completed_fields + 1;
  END IF;
  
  IF profile_data.vehicle_classes IS NULL OR array_length(profile_data.vehicle_classes, 1) IS NULL THEN
    missing_fields := array_append(missing_fields, 'vehicle_classes');
  ELSE
    completed_fields := completed_fields + 1;
  END IF;
  
  RETURN QUERY SELECT 
    (completed_fields = total_fields),
    ROUND((completed_fields::DECIMAL / total_fields) * 100)::INTEGER,
    missing_fields;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get business subscription limits
CREATE OR REPLACE FUNCTION get_business_limits(business_uuid UUID)
RETURNS TABLE(
  subscription_type TEXT,
  vehicle_limit INTEGER,
  current_vehicle_count INTEGER,
  can_add_vehicle BOOLEAN
) AS $$
DECLARE
  user_subscription TEXT;
  vehicle_count INTEGER;
BEGIN
  -- Get subscription type
  SELECT subscription_type INTO user_subscription 
  FROM user_profiles 
  WHERE id = business_uuid;
  
  -- Get current vehicle count
  SELECT COUNT(*) INTO vehicle_count 
  FROM vehicles 
  WHERE business_id = business_uuid;
  
  -- Determine limits
  IF user_subscription = 'pro' THEN
    RETURN QUERY SELECT 'pro', -1, vehicle_count, true; -- -1 means unlimited
  ELSE
    RETURN QUERY SELECT 'free', 5, vehicle_count, (vehicle_count < 5);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================

-- Verify schema creation
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
