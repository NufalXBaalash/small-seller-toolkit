-- Fix the trigger function to handle metadata correctly
-- This script updates the create_profile_for_new_user function to handle
-- both the old and new metadata formats

CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile with metadata from either raw_user_meta_data or data field
  -- Also handle both camelCase and snake_case field names
  INSERT INTO public.users (
    id, 
    email, 
    first_name, 
    last_name, 
    business_name, 
    phone_number
  )
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'firstName',
      NEW.data->>'first_name',
      NEW.data->>'firstName',
      ''
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'last_name',
      NEW.raw_user_meta_data->>'lastName',
      NEW.data->>'last_name',
      NEW.data->>'lastName',
      ''
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'business_name',
      NEW.raw_user_meta_data->>'businessName',
      NEW.data->>'business_name',
      NEW.data->>'businessName',
      ''
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'phone_number',
      NEW.raw_user_meta_data->>'phoneNumber',
      NEW.data->>'phone_number',
      NEW.data->>'phoneNumber',
      ''
    )
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the trigger
    RAISE WARNING 'Error in create_profile_for_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the trigger exists and recreate if needed
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
