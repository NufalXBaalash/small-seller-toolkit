-- Verify RLS Policies for users table
-- Run this in your Supabase SQL Editor

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- Check existing policies
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
WHERE tablename = 'users' AND schemaname = 'public';

-- Test policy with a sample query (this will show the policy being applied)
-- Note: This should be run as an authenticated user
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM public.users WHERE id = auth.uid();

-- Check if the trigger for profile creation exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_schema,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_name = 'on_auth_user_created';
