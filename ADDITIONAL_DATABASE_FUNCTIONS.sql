-- =====================================================
-- Additional Database Functions for mobiTrak
-- =====================================================
-- Run these after the main schema migration

-- =====================================================
-- 1. RPC Functions
-- =====================================================

-- Function to check vehicle limit for businesses (already in main schema, but ensuring it's correct)
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

-- Function to get available drivers for hiring
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

-- Function to get available vehicles for rental
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
  -- Get vehicle rates
  SELECT 
    CASE 
      WHEN rental_type = 'hourly' THEN hourly_rental_rate
      WHEN rental_type = 'daily' THEN daily_rental_rate
      ELSE daily_rental_rate
    END
  INTO vehicle_rate
  FROM vehicles 
  WHERE id = vehicle_id;
  
  -- Calculate amount based on rental type
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

-- Function to update driver rating after review
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

-- =====================================================
-- 2. Enhanced RLS Policies
-- =====================================================

-- Additional RLS policies for better security

-- Allow businesses to view available drivers (for hiring)
DROP POLICY IF EXISTS "Businesses can view available drivers for hiring" ON driver_profiles;
CREATE POLICY "Businesses can view available drivers for hiring" ON driver_profiles
  FOR SELECT USING (
    is_available_for_hire = true AND 
    profile_complete = true AND
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'business'
    )
  );

-- Allow customers to view business information for rentals
DROP POLICY IF EXISTS "Customers can view business info for rentals" ON business_profiles;
CREATE POLICY "Customers can view business info for rentals" ON business_profiles
  FOR SELECT USING (
    is_verified = true AND
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'customer'
    )
  );

-- Allow drivers to view their assigned vehicles
DROP POLICY IF EXISTS "Drivers can view their assigned vehicles" ON vehicles;
CREATE POLICY "Drivers can view their assigned vehicles" ON vehicles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM driver_assignments 
      WHERE driver_id = auth.uid() 
        AND vehicle_id = vehicles.id 
        AND is_active = true
    )
  );

-- Allow customers to view rental details
DROP POLICY IF EXISTS "Customers can view their rental details" ON rentals;
CREATE POLICY "Customers can view their rental details" ON rentals
  FOR SELECT USING (auth.uid() = customer_id);

-- Allow businesses to view their rental requests
DROP POLICY IF EXISTS "Businesses can view their rental requests" ON rentals;
CREATE POLICY "Businesses can view their rental requests" ON rentals
  FOR SELECT USING (auth.uid() = business_id);

-- Allow drivers to view their assigned rentals
DROP POLICY IF EXISTS "Drivers can view their assigned rentals" ON rentals;
CREATE POLICY "Drivers can view their assigned rentals" ON rentals
  FOR SELECT USING (auth.uid() = assigned_driver_id);

-- =====================================================
-- 3. Triggers for Data Integrity
-- =====================================================

-- Trigger to update driver rating when review is inserted/updated
CREATE OR REPLACE FUNCTION trigger_update_driver_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.driver_id IS NOT NULL THEN
    PERFORM update_driver_rating(NEW.driver_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_review_driver_rating
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_driver_rating();

-- Trigger to update vehicle status when rental is created
CREATE OR REPLACE FUNCTION trigger_update_vehicle_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' OR NEW.status = 'active' THEN
    UPDATE vehicles 
    SET status = 'in_use' 
    WHERE id = NEW.vehicle_id;
  ELSIF NEW.status = 'completed' OR NEW.status = 'cancelled' THEN
    UPDATE vehicles 
    SET status = 'available' 
    WHERE id = NEW.vehicle_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_rental_vehicle_status
  AFTER INSERT OR UPDATE ON rentals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_vehicle_status();

-- =====================================================
-- 4. Views for Common Queries
-- =====================================================

-- View for business dashboard
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

-- View for driver dashboard
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

-- View for customer dashboard
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

-- =====================================================
-- 5. Grant Permissions
-- =====================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION check_vehicle_limit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_drivers() TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_vehicles() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_rental_amount(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_driver_rating(UUID) TO authenticated;

-- Grant select permissions on views
GRANT SELECT ON business_dashboard_view TO authenticated;
GRANT SELECT ON driver_dashboard_view TO authenticated;
GRANT SELECT ON customer_dashboard_view TO authenticated;

-- =====================================================
-- 6. Comments
-- =====================================================

COMMENT ON FUNCTION check_vehicle_limit(UUID) IS 'Check if business can add more vehicles based on subscription';
COMMENT ON FUNCTION get_available_drivers() IS 'Get list of available drivers for hiring';
COMMENT ON FUNCTION get_available_vehicles() IS 'Get list of available vehicles for rental';
COMMENT ON FUNCTION calculate_rental_amount(UUID, TEXT, INTEGER) IS 'Calculate rental amount based on vehicle and duration';
COMMENT ON FUNCTION update_driver_rating(UUID) IS 'Update driver rating based on reviews';

COMMENT ON VIEW business_dashboard_view IS 'Dashboard data for business users';
COMMENT ON VIEW driver_dashboard_view IS 'Dashboard data for driver users';
COMMENT ON VIEW customer_dashboard_view IS 'Dashboard data for customer users';
