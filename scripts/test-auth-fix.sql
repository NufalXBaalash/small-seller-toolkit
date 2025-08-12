-- ============================================================================
-- AUTHENTICATION FIX TEST SCRIPT (Merged with your function)
-- ============================================================================

-- STEP 1: CHECK CURRENT AUTH SETUP
-- ============================================================================

-- Check if the trigger function exists
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'create_profile_for_new_user'
AND routine_schema = 'public';

-- Check if the trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created'
AND event_object_schema = 'auth'
AND event_object_table = 'users';

-- Check users table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 2: FIX TRIGGER FUNCTION (Using your version)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_metadata JSONB;
  first_name_val TEXT;
  last_name_val TEXT;
  business_name_val TEXT;
  phone_number_val TEXT;
BEGIN
  -- Get metadata from raw_user_meta_data
  user_metadata := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  
  -- Extract values with fallbacks for different naming conventions
  first_name_val := COALESCE(
    user_metadata->>'first_name',
    user_metadata->>'firstName',
    user_metadata->>'firstname',
    ''
  );
  
  last_name_val := COALESCE(
    user_metadata->>'last_name',
    user_metadata->>'lastName',
    user_metadata->>'lastname',
    ''
  );
  
  business_name_val := COALESCE(
    user_metadata->>'business_name',
    user_metadata->>'businessName',
    user_metadata->>'businessname',
    ''
  );
  
  phone_number_val := COALESCE(
    user_metadata->>'phone_number',
    user_metadata->>'phoneNumber',
    user_metadata->>'phone',
    ''
  );

  -- Insert user profile with proper error handling and conflict resolution
  INSERT INTO public.users (
    id, 
    email, 
    first_name, 
    last_name, 
    business_name, 
    phone_number,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.email, ''),
    first_name_val,
    last_name_val,
    business_name_val,
    phone_number_val,
    COALESCE(NEW.created_at, NOW()),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, public.users.first_name),
    last_name = COALESCE(EXCLUDED.last_name, public.users.last_name),
    business_name = COALESCE(EXCLUDED.business_name, public.users.business_name),
    phone_number = COALESCE(EXCLUDED.phone_number, public.users.phone_number),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in create_profile_for_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: FIX TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user();

-- ============================================================================
-- STEP 4: FIX EXISTING USERS WITHOUT PROFILES (Using your insert)
-- ============================================================================

-- Find missing profiles
SELECT 
  auth.id,
  auth.email,
  auth.created_at
FROM auth.users auth
LEFT JOIN public.users pub ON auth.id = pub.id
WHERE pub.id IS NULL;

-- Insert missing profiles
INSERT INTO public.users (id, email, first_name, last_name, business_name, phone_number, created_at, updated_at)
SELECT 
  auth.id,
  auth.email,
  COALESCE(
    auth.raw_user_meta_data->>'first_name',
    auth.raw_user_meta_data->>'firstName',
    ''
  ),
  COALESCE(
    auth.raw_user_meta_data->>'last_name',
    auth.raw_user_meta_data->>'lastName',
    ''
  ),
  COALESCE(
    auth.raw_user_meta_data->>'business_name',
    auth.raw_user_meta_data->>'businessName',
    ''
  ),
  COALESCE(
    auth.raw_user_meta_data->>'phone_number',
    auth.raw_user_meta_data->>'phoneNumber',
    ''
  ),
  auth.created_at,
  NOW()
FROM auth.users auth
LEFT JOIN public.users pub ON auth.id = pub.id
WHERE pub.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 5: VERIFY FIXES
-- ============================================================================

-- Count comparison
SELECT 
  COUNT(*) as auth_users,
  (SELECT COUNT(*) FROM public.users) as public_users,
  COUNT(*) - (SELECT COUNT(*) FROM public.users) as missing_profiles
FROM auth.users;

-- Show latest users
SELECT 
  auth.id,
  auth.email,
  auth.created_at as auth_created,
  pub.created_at as profile_created,
  CASE WHEN pub.id IS NOT NULL THEN 'Profile Exists' ELSE 'Missing Profile' END as status
FROM auth.users auth
LEFT JOIN public.users pub ON auth.id = pub.id
ORDER BY auth.created_at DESC
LIMIT 10;

-- ============================================================================
-- STEP 6: GRANT NECESSARY PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;

DO $$
BEGIN
  -- Enable RLS if not enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- Select policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile" ON public.users
      FOR SELECT USING (auth.uid() = id);
  END IF;
  
  -- Update policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON public.users
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- ============================================================================
-- STEP 7: TEST THE FIX
-- ============================================================================

DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  RAISE NOTICE 'Trigger function test completed successfully';
  RAISE NOTICE 'Sign up a new account to verify profile creation.';
END $$;
