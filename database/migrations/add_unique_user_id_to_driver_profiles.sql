-- Ensure UNIQUE constraint on driver_profiles.user_id so upsert on user_id works
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE c.contype = 'u'
      AND t.relname = 'driver_profiles'
      AND n.nspname = 'public'
      AND c.conname = 'driver_profiles_user_id_key'
  ) THEN
    ALTER TABLE public.driver_profiles
      ADD CONSTRAINT driver_profiles_user_id_key UNIQUE (user_id);
  END IF;
END
$$;

-- Optional: add helpful index (unique already indexes, so only if missing non-unique earlier)
CREATE INDEX IF NOT EXISTS idx_driver_profiles_user_id ON public.driver_profiles(user_id);

-- Ensure RLS policies allow insert/update for own row (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'driver_profiles' AND policyname = 'Users can insert their own driver profile'
  ) THEN
    DROP POLICY "Users can insert their own driver profile" ON public.driver_profiles;
  END IF;
  CREATE POLICY "Users can insert their own driver profile" ON public.driver_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'driver_profiles' AND policyname = 'Users can update their own driver profile'
  ) THEN
    DROP POLICY "Users can update their own driver profile" ON public.driver_profiles;
  END IF;
  CREATE POLICY "Users can update their own driver profile" ON public.driver_profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
END
$$;


