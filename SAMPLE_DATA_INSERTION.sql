-- Sample Data Insertion for mobiTrak Business Features
-- Run these commands AFTER running the CORRECTED_BUSINESS_FEATURES_SCHEMA.sql

-- Step 1: Get your business user ID
-- Run this query to find your business user ID:
-- SELECT id, email, full_name, role FROM user_profiles WHERE role = 'business';

-- Step 2: Get driver user IDs (if you have existing drivers)
-- Run this query to find your driver user IDs:
-- SELECT id, email, full_name, role FROM user_profiles WHERE role = 'driver';

-- Step 3: Insert sample vehicle labels
-- Replace 'YOUR_BUSINESS_UUID_HERE' with your actual business user ID from Step 1
INSERT INTO vehicle_labels (business_id, name, description, color) VALUES
  ('YOUR_BUSINESS_UUID_HERE', 'Luxury Cars', 'High-end vehicles for premium service', '#fabb24'),
  ('YOUR_BUSINESS_UUID_HERE', 'Economy Cars', 'Budget-friendly vehicles', '#10b981'),
  ('YOUR_BUSINESS_UUID_HERE', 'Tourist Buses', 'Large capacity vehicles for group tours', '#3b82f6'),
  ('YOUR_BUSINESS_UUID_HERE', 'Delivery Vans', 'Cargo vehicles for deliveries', '#f59e0b')
ON CONFLICT DO NOTHING;

-- Step 4: Insert sample driver pool data (optional)
-- Replace 'DRIVER_UUID_1', 'DRIVER_UUID_2' with actual driver user IDs from Step 2
-- Only run this if you have existing drivers in your user_profiles table
INSERT INTO driver_pool (user_id, license_number, license_expiry, phone, address, experience_years, rating, total_trips, status) VALUES
  ('DRIVER_UUID_1', 'DL123456789', '2025-12-31', '+1234567890', '123 Driver St, City', 5, 4.8, 150, 'available'),
  ('DRIVER_UUID_2', 'DL987654321', '2026-06-30', '+1987654321', '456 Driver Ave, Town', 3, 4.5, 75, 'available')
ON CONFLICT (user_id) DO NOTHING;

-- Step 5: Verify the data was inserted correctly
-- Check vehicle labels
SELECT * FROM vehicle_labels;

-- Check driver pool (if you inserted driver data)
SELECT dp.*, up.email, up.full_name 
FROM driver_pool dp 
JOIN user_profiles up ON dp.user_id = up.id;

-- Step 6: Test the available drivers function
SELECT * FROM get_available_drivers();
