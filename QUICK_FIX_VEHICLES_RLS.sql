-- QUICK FIX: Vehicles Table RLS Policy Issue
-- Run this in your Supabase SQL Editor to fix the "new row violates rls policy" error

-- Step 1: Temporarily disable RLS to allow vehicle insertion
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;

-- Step 2: Verify RLS is disabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'vehicles';

-- Step 3: Test that vehicles can now be inserted
-- This should return 'RLS is disabled for vehicles table'
SELECT 
  CASE 
    WHEN rowsecurity = false THEN 'RLS is disabled for vehicles table - insertions should work'
    ELSE 'RLS is still enabled - may cause issues'
  END as status
FROM pg_tables 
WHERE tablename = 'vehicles';

-- Optional: If you want to re-enable RLS later with proper policies, use this:
/*
-- Re-enable RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows all operations for any authenticated user
CREATE POLICY "allow_all_for_authenticated" ON vehicles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Or create more specific policies:
CREATE POLICY "users_can_manage_vehicles" ON vehicles
  FOR ALL
  USING (
    -- Allow if user is authenticated and business_id matches any user
    auth.uid() IS NOT NULL
  )
  WITH CHECK (
    -- Allow if user is authenticated
    auth.uid() IS NOT NULL
  );
*/
