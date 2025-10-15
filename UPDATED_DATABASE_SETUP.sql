-- Updated Database Setup for mobiTrak
-- Run these commands in your Supabase SQL Editor

-- First, drop the existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create updated function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile with default role (will be updated after email confirmation)
  INSERT INTO public.user_profiles (id, email, role, created_at, password_hash)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'), -- Use role from metadata or default to customer
    NOW(),
    NEW.raw_user_meta_data->>'password_hash'
  );

  -- Auto-create role-specific base profiles
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'customer') = 'business' THEN
    INSERT INTO public.business_profiles (user_id, business_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'business_name', ''))
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF COALESCE(NEW.raw_user_meta_data->>'role', 'customer') = 'driver' THEN
    INSERT INTO public.driver_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF COALESCE(NEW.raw_user_meta_data->>'role', 'customer') = 'customer' THEN
    INSERT INTO public.customer_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to handle email confirmation and role update
CREATE OR REPLACE FUNCTION public.handle_email_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if email was just confirmed (changed from null to a timestamp)
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    -- Update user profile with role from metadata if it exists
    UPDATE public.user_profiles 
    SET role = COALESCE(NEW.raw_user_meta_data->>'role', role)
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for email confirmation
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_email_confirmation();

-- Update RLS policies to ensure proper access
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON user_profiles;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can insert profiles" ON user_profiles
  FOR INSERT WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_profiles TO anon, authenticated;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Ensure password_hash column exists on user_profiles (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN password_hash TEXT;
  END IF;
END $$;
