-- Quick fix for products table RLS policy issue
-- Run this in your Supabase SQL editor

-- First, drop the existing policy if it exists
DROP POLICY IF EXISTS "Users can view own products" ON public.products;
DROP POLICY IF EXISTS "Users can manage own products" ON public.products;

-- Create a comprehensive policy that allows all operations for authenticated users
CREATE POLICY "Users can manage own products" ON public.products
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'products'; 