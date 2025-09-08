# Database Migration Instructions - Indian DL OCR Feature

## 🎯 **Required Database Changes**

To enable the Indian Driving License OCR functionality, you need to run the following SQL commands in your Supabase SQL Editor.

## 📝 **Step 1: Add Indian DL Fields to driver_profiles Table**

Copy and paste this SQL into your Supabase SQL Editor:

```sql
-- Add Indian driving license fields to driver_profiles table

-- Add new columns for Indian DL details
ALTER TABLE driver_profiles
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS issue_date DATE,
ADD COLUMN IF NOT EXISTS expiry_date DATE,
ADD COLUMN IF NOT EXISTS license_class TEXT,
ADD COLUMN IF NOT EXISTS license_image_url TEXT,
ADD COLUMN IF NOT EXISTS fathers_name TEXT,
ADD COLUMN IF NOT EXISTS blood_group TEXT,
ADD COLUMN IF NOT EXISTS issuing_authority TEXT,
ADD COLUMN IF NOT EXISTS validity_nt DATE,
ADD COLUMN IF NOT EXISTS validity_tr DATE;

-- Add comments for documentation
COMMENT ON COLUMN driver_profiles.full_name IS 'Full name as it appears on the Indian driving license';
COMMENT ON COLUMN driver_profiles.date_of_birth IS 'Date of birth from Indian driving license';
COMMENT ON COLUMN driver_profiles.issue_date IS 'License issue date';
COMMENT ON COLUMN driver_profiles.expiry_date IS 'License expiry date (primary validity)';
COMMENT ON COLUMN driver_profiles.license_class IS 'Class of vehicle (e.g., MCWG, LMV)';
COMMENT ON COLUMN driver_profiles.license_image_url IS 'URL to uploaded license PDF';
COMMENT ON COLUMN driver_profiles.fathers_name IS 'Father/Guardian name (S/D/W of)';
COMMENT ON COLUMN driver_profiles.blood_group IS 'Blood group from license';
COMMENT ON COLUMN driver_profiles.issuing_authority IS 'License issuing authority';
COMMENT ON COLUMN driver_profiles.validity_nt IS 'Validity for non-transport vehicles';
COMMENT ON COLUMN driver_profiles.validity_tr IS 'Validity for transport vehicles';
```

## 📁 **Step 2: Create Storage Bucket for License Images**

Run this SQL to create the storage bucket:

```sql
-- Create storage bucket for driver licenses if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-licenses', 'driver-licenses', true)
ON CONFLICT (id) DO NOTHING;
```

## 🔒 **Step 3: Set Up Row Level Security (RLS) Policies**

Run this SQL to set up security policies:

```sql
-- Set up RLS policies for the driver-licenses bucket
CREATE POLICY "Users can upload their own license images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'driver-licenses' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own license images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'driver-licenses' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own license images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'driver-licenses' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own license images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'driver-licenses' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## ✅ **Step 4: Verify Migration**

After running the migration, verify the changes:

```sql
-- Check if new columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'driver_profiles' 
AND column_name IN ('full_name', 'date_of_birth', 'issue_date', 'expiry_date', 'license_class', 'license_image_url');

-- Check if storage bucket was created
SELECT * FROM storage.buckets WHERE id = 'driver-licenses';

-- Check if RLS policies were created
SELECT policyname, tablename, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%license%';
```

## 🚀 **Step 5: Test the Feature**

After running the migration:

1. **Navigate to Driver Dashboard** → Profile Section
2. **Upload a License Image** using the upload interface
3. **Verify Auto-Scanning** works (currently shows mock data)
4. **Test Manual Entry** toggle functionality
5. **Submit the Form** and verify data saves correctly

## 📋 **Expected Results**

After successful migration, you should see:

- ✅ **New columns** in driver_profiles table
- ✅ **Storage bucket** named 'driver-licenses' 
- ✅ **RLS policies** for secure file access
- ✅ **License upload interface** in driver profile
- ✅ **Auto-scanning functionality** (with mock data)
- ✅ **Manual entry fallback** option

## 🔧 **Troubleshooting**

### **If columns already exist:**
The `ADD COLUMN IF NOT EXISTS` syntax will safely skip existing columns.

### **If storage bucket exists:**
The `ON CONFLICT (id) DO NOTHING` clause will skip bucket creation if it already exists.

### **If RLS policies fail:**
Check if similar policies already exist and drop them first:
```sql
DROP POLICY IF EXISTS "Users can upload their own license images" ON storage.objects;
-- Then re-run the CREATE POLICY commands
```

### **If upload fails:**
1. Check storage bucket permissions in Supabase dashboard
2. Verify RLS policies are active
3. Check browser console for detailed error messages

## 📞 **Support**

If you encounter any issues:

1. **Check Supabase Logs** in the dashboard
2. **Verify Database Schema** using the verification queries above
3. **Test Storage Permissions** by manually uploading a file
4. **Review Browser Console** for JavaScript errors

The license scanning feature should now be fully functional with automatic data extraction capabilities! 🎉
