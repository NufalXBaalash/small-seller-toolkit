-- Test script to verify the trigger is working correctly
-- This will show us what's happening when a new user is created

-- First, let's check the current trigger function
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'create_profile_for_new_user';

-- Check if the trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Let's also check what metadata is stored in auth.users
SELECT 
  id,
  email,
  raw_user_meta_data
FROM auth.users 
LIMIT 5;

-- And check what's in public.users
SELECT 
  id,
  email,
  first_name,
  last_name,
  business_name,
  phone_number
FROM public.users 
LIMIT 5; 