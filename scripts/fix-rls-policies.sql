-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own business" ON public.businesses;

-- Create new policies that allow INSERT during signup
CREATE POLICY "Users can manage own profile" ON public.users
  FOR ALL USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile during signup
CREATE POLICY "Allow user profile creation" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to select their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete own profile" ON public.users
  FOR DELETE USING (auth.uid() = id);

-- Fix businesses table policies
CREATE POLICY "Users can manage own business" ON public.businesses
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure all other tables have proper policies
DROP POLICY IF EXISTS "Users can view own products" ON public.products;
CREATE POLICY "Users can manage own products" ON public.products
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own customers" ON public.customers;
CREATE POLICY "Users can manage own customers" ON public.customers
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can manage own orders" ON public.orders
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own chats" ON public.chats;
CREATE POLICY "Users can manage own chats" ON public.chats
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view messages from own chats" ON public.messages;
CREATE POLICY "Users can manage messages from own chats" ON public.messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id 
      AND chats.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE chats.id = messages.chat_id 
      AND chats.user_id = auth.uid()
    )
  );
