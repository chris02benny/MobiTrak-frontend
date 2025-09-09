-- Fix Vehicles Table RLS Policy Issues
-- Run these commands in your Supabase SQL Editor

-- First, let's check the current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'vehicles';

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Business owners can view their vehicles" ON vehicles;
DROP POLICY IF EXISTS "Business owners can insert their vehicles" ON vehicles;
DROP POLICY IF EXISTS "Business owners can update their vehicles" ON vehicles;
DROP POLICY IF EXISTS "Business owners can delete their vehicles" ON vehicles;

-- Ensure RLS is enabled
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Create new, more permissive policies for vehicles table

-- Policy for viewing vehicles (SELECT)
CREATE POLICY "Users can view their business vehicles" ON vehicles
  FOR SELECT 
  USING (
    business_id = auth.uid() OR 
    business_id IN (
      SELECT id FROM user_profiles 
      WHERE id = auth.uid() AND role = 'business'
    )
  );

-- Policy for inserting vehicles (INSERT)
CREATE POLICY "Users can insert their business vehicles" ON vehicles
  FOR INSERT 
  WITH CHECK (
    business_id = auth.uid() OR
    business_id IN (
      SELECT id FROM user_profiles 
      WHERE id = auth.uid() AND role = 'business'
    )
  );

-- Policy for updating vehicles (UPDATE)
CREATE POLICY "Users can update their business vehicles" ON vehicles
  FOR UPDATE 
  USING (
    business_id = auth.uid() OR
    business_id IN (
      SELECT id FROM user_profiles 
      WHERE id = auth.uid() AND role = 'business'
    )
  )
  WITH CHECK (
    business_id = auth.uid() OR
    business_id IN (
      SELECT id FROM user_profiles 
      WHERE id = auth.uid() AND role = 'business'
    )
  );

-- Policy for deleting vehicles (DELETE)
CREATE POLICY "Users can delete their business vehicles" ON vehicles
  FOR DELETE 
  USING (
    business_id = auth.uid() OR
    business_id IN (
      SELECT id FROM user_profiles 
      WHERE id = auth.uid() AND role = 'business'
    )
  );

-- Alternative: If the above policies still don't work, create a more permissive policy
-- Uncomment the following lines if needed:

/*
-- Drop all policies and create a simple one
DROP POLICY IF EXISTS "Users can view their business vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can insert their business vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can update their business vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can delete their business vehicles" ON vehicles;

-- Create a single permissive policy for all operations
CREATE POLICY "Business users can manage vehicles" ON vehicles
  FOR ALL
  USING (
    auth.uid() IS NOT NULL AND
    (
      business_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'business'
      )
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (
      business_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'business'
      )
    )
  );
*/

-- Verify the new policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'vehicles';

-- Test query to check if the current user can insert
-- Replace 'your-user-id' with the actual user ID from auth.users
/*
SELECT 
  auth.uid() as current_user_id,
  EXISTS(SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'business') as is_business_user,
  'Test passed' as result;
*/
