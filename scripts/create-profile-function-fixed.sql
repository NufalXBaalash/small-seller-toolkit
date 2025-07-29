-- Create a function to handle user profile creation
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.businesses TO authenticated;
GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.customers TO authenticated;
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.chats TO authenticated;
GRANT ALL ON public.messages TO authenticated; 