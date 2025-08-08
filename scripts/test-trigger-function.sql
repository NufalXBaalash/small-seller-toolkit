-- Test script to verify the trigger function is working correctly
-- This will help us debug any issues with profile creation

-- First, let's check the current trigger function definition
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'create_profile_for_new_user';

-- Check if the trigger exists and is properly configured
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Let's also check what metadata is stored in auth.users for existing users
SELECT 
  id,
  email,
  raw_user_meta_data,
  data
FROM auth.users 
LIMIT 5;

-- And check what's in public.users
SELECT 
  id,
  email,
  first_name,
  last_name,
  business_name,
  phone_number,
  created_at
FROM public.users 
LIMIT 5;

-- Test the trigger function with a sample user (this is just for testing)
-- Note: This won't actually create a user, just test the function logic
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_email TEXT := 'test@example.com';
  test_metadata JSONB := '{"first_name": "Test", "last_name": "User", "business_name": "Test Business", "phone_number": "1234567890"}'::jsonb;
BEGIN
  -- This is just a test to see if the function would work
  -- In reality, the trigger would be called automatically
  RAISE NOTICE 'Testing trigger function with user ID: %', test_user_id;
  RAISE NOTICE 'Test metadata: %', test_metadata;
END $$;
