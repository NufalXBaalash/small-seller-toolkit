-- Fix existing users by copying metadata from auth.users to public.users
-- This script updates users who signed up before the trigger was fixed

UPDATE public.users 
SET 
  first_name = auth.users.raw_user_meta_data->>'first_name',
  last_name = auth.users.raw_user_meta_data->>'last_name',
  business_name = auth.users.raw_user_meta_data->>'business_name',
  phone_number = auth.users.raw_user_meta_data->>'phone_number',
  updated_at = NOW()
FROM auth.users 
WHERE public.users.id = auth.users.id 
  AND auth.users.raw_user_meta_data IS NOT NULL
  AND (
    auth.users.raw_user_meta_data->>'first_name' IS NOT NULL OR
    auth.users.raw_user_meta_data->>'last_name' IS NOT NULL OR
    auth.users.raw_user_meta_data->>'business_name' IS NOT NULL OR
    auth.users.raw_user_meta_data->>'phone_number' IS NOT NULL
  );

-- Show the results
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.business_name,
  u.phone_number,
  auth.raw_user_meta_data
FROM public.users u
JOIN auth.users auth ON u.id = auth.id
WHERE auth.raw_user_meta_data IS NOT NULL; 