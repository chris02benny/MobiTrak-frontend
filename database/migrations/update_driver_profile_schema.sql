-- Migration to update driver_profiles table for new profile completion form

ALTER TABLE public.driver_profiles
  ADD COLUMN dl_front_url TEXT,
  ADD COLUMN dl_back_url TEXT,
  ADD COLUMN address_line1 TEXT,
  ADD COLUMN address_line2 TEXT,
  ADD COLUMN vehicle_classes TEXT[],
  ADD COLUMN license_issue_date DATE;

-- Rename pincode to postal_code
ALTER TABLE public.driver_profiles
  RENAME COLUMN pincode TO postal_code;

-- Rename license_expiry to license_valid_till
ALTER TABLE public.driver_profiles
  RENAME COLUMN license_expiry TO license_valid_till;

-- Drop the old address column
ALTER TABLE public.driver_profiles
  DROP COLUMN address;

-- Drop the old license_image_url column
ALTER TABLE public.driver_profiles
  DROP COLUMN license_image_url;
