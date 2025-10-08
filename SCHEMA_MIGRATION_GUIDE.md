# mobiTrak Schema Migration Guide

## Overview
This guide helps you migrate from your current database schema to the optimized mobiTrak schema. The new schema is designed for better performance, security, and maintainability.

## Key Changes

### ✅ What's Kept
- `user_profiles` table (central authentication table)
- Existing subscription fields in `user_profiles`
- Core authentication flow

### 🔄 What's Restructured
- **Role-specific profiles**: Split into `business_profiles`, `driver_profiles`, `customer_profiles`
- **Vehicle management**: Enhanced `vehicles` table with OCR fields
- **Driver assignments**: New `driver_assignments` table for business-driver relationships
- **Rental system**: New `rentals` table for customer bookings
- **Review system**: Enhanced `reviews` table for multi-entity reviews
- **Payment tracking**: Separate `payment_history` table

### ❌ What's Removed
- Redundant `driver_pool` table (functionality moved to `driver_profiles`)
- Duplicate fields across tables
- Unnecessary complexity in existing schemas

## Migration Steps

### Step 1: Backup Your Database
```sql
-- Create a backup before migration
pg_dump your_database > backup_before_migration.sql
```

### Step 2: Run the New Schema
```sql
-- Execute the optimized schema
\i OPTIMIZED_MOBITRAK_SCHEMA.sql
```

### Step 3: Data Migration (if you have existing data)

#### Migrate Driver Data
```sql
-- If you have existing driver data in user_profiles
INSERT INTO driver_profiles (
  user_id, full_name, phone_number, address, 
  license_number, license_expiry, years_of_experience,
  rating, total_trips, profile_complete
)
SELECT 
  id, full_name, phone, address,
  license_number, license_expiry, experience_years,
  rating, total_trips, 
  CASE WHEN license_number IS NOT NULL THEN true ELSE false END
FROM user_profiles 
WHERE role = 'driver' 
  AND id NOT IN (SELECT user_id FROM driver_profiles);
```

#### Migrate Business Data
```sql
-- If you have existing business data
INSERT INTO business_profiles (
  user_id, business_name, business_type, 
  business_address, business_phone, business_email,
  contact_person_name, contact_person_phone
)
SELECT 
  id, full_name, 'fleet_operator', 
  address, phone, email,
  full_name, phone
FROM user_profiles 
WHERE role = 'business' 
  AND id NOT IN (SELECT user_id FROM business_profiles);
```

#### Migrate Customer Data
```sql
-- If you have existing customer data
INSERT INTO customer_profiles (
  user_id, full_name, phone_number, address
)
SELECT 
  id, full_name, phone, address
FROM user_profiles 
WHERE role = 'customer' 
  AND id NOT IN (SELECT user_id FROM customer_profiles);
```

### Step 4: Clean Up Old Tables (Optional)
```sql
-- Only run these if you're sure you don't need the old data
-- DROP TABLE IF EXISTS driver_pool;
-- DROP TABLE IF EXISTS old_drivers_table;
-- Remove old columns from user_profiles if they exist
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS license_number;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS license_expiry;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS phone;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS address;
```

## New Schema Benefits

### 🚀 Performance Improvements
- **Optimized indexes** for common queries
- **Reduced redundancy** across tables
- **Better query performance** with proper foreign keys

### 🔒 Enhanced Security
- **Comprehensive RLS policies** for role-based access
- **Data isolation** between different user types
- **Secure payment handling** with separate payment table

### 📊 Better Data Structure
- **Clear separation** of concerns
- **OCR-ready fields** for document processing
- **Flexible rental system** supporting multiple rental types
- **Comprehensive review system** for all entities

## Role-Based Access Control

### Business Users
- Can manage their business profile
- Can add/edit vehicles (within subscription limits)
- Can hire drivers and assign them to vehicles
- Can view rental requests for their vehicles
- Can respond to reviews

### Driver Users
- Can manage their driver profile
- Can upload license documents (OCR processing)
- Can view their assignments and rentals
- Can update availability status

### Customer Users
- Can manage their customer profile
- Can browse available vehicles
- Can create rental requests
- Can leave reviews after rentals

## API Integration Points

### OCR Service Integration
```javascript
// Example: Driver license OCR processing
const ocrResult = await ocrService.processLicense(licenseImage);
await supabase
  .from('driver_profiles')
  .update({
    license_number: ocrResult.licenseNumber,
    license_expiry: ocrResult.expiryDate,
    license_type: ocrResult.licenseType,
    profile_complete: true
  })
  .eq('user_id', userId);
```

### Razorpay Payment Integration
```javascript
// Example: Payment processing
const payment = await razorpay.payments.capture(
  razorpayPaymentId, 
  amount
);

await supabase
  .from('payment_history')
  .insert({
    user_id: userId,
    payment_type: 'rental',
    amount: amount,
    razorpay_payment_id: razorpayPaymentId,
    status: 'completed',
    rental_id: rentalId
  });
```

## Testing the Migration

### 1. Verify Tables Created
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'user_profiles', 'business_profiles', 'driver_profiles', 
    'customer_profiles', 'vehicles', 'driver_assignments', 
    'rentals', 'reviews', 'subscription_history', 'payment_history'
  );
```

### 2. Test RLS Policies
```sql
-- Test as different user roles
SET LOCAL role TO authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub": "user-uuid", "role": "business"}';

-- Should only see business-related data
SELECT * FROM vehicles WHERE business_id = 'user-uuid';
```

### 3. Test Functions
```sql
-- Test vehicle limit check
SELECT * FROM check_vehicle_limit('business-user-uuid');
```

## Rollback Plan

If you need to rollback:

1. **Restore from backup**:
   ```bash
   psql your_database < backup_before_migration.sql
   ```

2. **Or manually drop new tables**:
   ```sql
   DROP TABLE IF EXISTS payment_history;
   DROP TABLE IF EXISTS subscription_history;
   DROP TABLE IF EXISTS reviews;
   DROP TABLE IF EXISTS rentals;
   DROP TABLE IF EXISTS driver_assignments;
   DROP TABLE IF EXISTS vehicles;
   DROP TABLE IF EXISTS vehicle_labels;
   DROP TABLE IF EXISTS customer_profiles;
   DROP TABLE IF EXISTS driver_profiles;
   DROP TABLE IF EXISTS business_profiles;
   ```

## Support

If you encounter issues during migration:

1. Check the Supabase logs for any errors
2. Verify all foreign key constraints are satisfied
3. Ensure RLS policies are working correctly
4. Test with a small dataset first

## Next Steps

After successful migration:

1. **Update your application code** to use the new table structure
2. **Test all user flows** (registration, profile completion, rentals)
3. **Update your OCR integration** to populate the new fields
4. **Configure Razorpay webhooks** to update payment status
5. **Set up monitoring** for the new tables and functions
