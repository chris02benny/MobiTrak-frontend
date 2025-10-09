-- Ensure business_profiles has the required columns for Business Profile

ALTER TABLE IF EXISTS public.business_profiles
  ADD COLUMN IF NOT EXISTS business_name TEXT,
  ADD COLUMN IF NOT EXISTS business_phone TEXT,
  ADD COLUMN IF NOT EXISTS business_email TEXT,
  ADD COLUMN IF NOT EXISTS business_address TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Optional: backfill profile_complete flag based on required fields
-- UPDATE public.business_profiles
-- SET profile_complete = TRUE
-- WHERE COALESCE(business_name,'') <> ''
--   AND COALESCE(business_phone,'') <> ''
--   AND COALESCE(business_email,'') <> ''
--   AND COALESCE(business_address,'') <> '';

-- Notes:
-- - RLS and existing policies remain unchanged.
-- - This migration is idempotent via IF NOT EXISTS.

