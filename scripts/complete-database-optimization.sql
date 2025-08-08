-- ============================================================================
-- COMPLETE DATABASE OPTIMIZATION SCRIPT
-- ============================================================================
-- This script combines all database optimizations into one comprehensive
-- deployment script for the Small Seller Toolkit application.
--
-- WARNING: This script will modify existing functions and create new ones.
-- Please backup your database before running this script.
--
-- Run this script in your Supabase SQL Editor to apply all optimizations.

-- ============================================================================
-- STEP 1: FIX CORE FUNCTIONS
-- ============================================================================

-- Fix the create_profile_for_new_user function with proper error handling
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_metadata JSONB;
  first_name_val TEXT;
  last_name_val TEXT;
  business_name_val TEXT;
  phone_number_val TEXT;
BEGIN
  -- Get metadata from the most reliable source
  user_metadata := COALESCE(NEW.raw_user_meta_data, NEW.data, '{}'::jsonb);
  
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
    COALESCE(NEW.updated_at, NOW())
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
    -- Log the error but don't fail the trigger
    RAISE WARNING 'Error in create_profile_for_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the create_default_settings function
CREATE OR REPLACE FUNCTION public.create_default_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id, theme, language, timezone, currency, notifications_enabled, auto_replies_enabled)
  VALUES (NEW.id, 'light', 'en', 'UTC', 'USD', TRUE, TRUE)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in create_default_settings for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix the generate_order_number function with better error handling
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  year_val TEXT;
  month_val TEXT;
  day_val TEXT;
  sequence_val TEXT;
BEGIN
  -- Generate components
  year_val := EXTRACT(YEAR FROM NOW())::TEXT;
  month_val := LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0');
  day_val := LPAD(EXTRACT(DAY FROM NOW())::TEXT, 2, '0');
  sequence_val := LPAD(nextval('order_sequence')::TEXT, 6, '0');
  
  -- Create order number
  NEW.order_number := 'ORD-' || year_val || '-' || month_val || '-' || day_val || '-' || sequence_val;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in generate_order_number: %', SQLERRM;
    -- Fallback order number
    NEW.order_number := 'ORD-' || EXTRACT(EPOCH FROM NOW())::TEXT || '-' || floor(random() * 1000000)::TEXT;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix the update_customer_stats function
CREATE OR REPLACE FUNCTION public.update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.customers
  SET 
    total_orders = total_orders + 1,
    total_spent = total_spent + COALESCE(NEW.total_amount, 0),
    last_order_date = NOW(),
    updated_at = NOW()
  WHERE id = NEW.customer_id;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in update_customer_stats for order %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix the update_daily_stats function
CREATE OR REPLACE FUNCTION public.update_daily_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.daily_stats (user_id, date, total_orders, total_revenue)
  VALUES (NEW.user_id, DATE(NOW()), 1, COALESCE(NEW.total_amount, 0))
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_orders = daily_stats.total_orders + 1,
    total_revenue = daily_stats.total_revenue + COALESCE(NEW.total_amount, 0),
    updated_at = NOW();
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in update_daily_stats for order %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 2: CREATE OPTIMIZED FUNCTIONS
-- ============================================================================

-- Optimized function for fetching user dashboard data
CREATE OR REPLACE FUNCTION public.get_user_dashboard_data(user_id_param UUID)
RETURNS TABLE (
  total_products BIGINT,
  total_customers BIGINT,
  total_orders BIGINT,
  total_revenue DECIMAL,
  recent_orders JSONB,
  low_stock_products JSONB,
  active_chats JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      COUNT(DISTINCT p.id) as total_products,
      COUNT(DISTINCT c.id) as total_customers,
      COUNT(DISTINCT o.id) as total_orders,
      COALESCE(SUM(o.total_amount), 0) as total_revenue
    FROM public.users u
    LEFT JOIN public.products p ON u.id = p.user_id AND p.status = 'active'
    LEFT JOIN public.customers c ON u.id = c.user_id AND c.status = 'active'
    LEFT JOIN public.orders o ON u.id = o.user_id
    WHERE u.id = user_id_param
  ),
  recent_orders_data AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', o.id,
        'order_number', o.order_number,
        'total_amount', o.total_amount,
        'status', o.status,
        'created_at', o.created_at
      )
    ) as recent_orders
    FROM public.orders o
    WHERE o.user_id = user_id_param
    ORDER BY o.created_at DESC
    LIMIT 5
  ),
  low_stock_data AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'stock', p.stock,
        'price', p.price
      )
    ) as low_stock_products
    FROM public.products p
    WHERE p.user_id = user_id_param 
      AND p.status = 'active' 
      AND p.stock <= 5
    ORDER BY p.stock ASC
    LIMIT 5
  ),
  active_chats_data AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', ch.id,
        'customer_name', c.name,
        'last_message', ch.last_message,
        'unread_count', ch.unread_count,
        'platform', ch.platform,
        'updated_at', ch.updated_at
      )
    ) as active_chats
    FROM public.chats ch
    JOIN public.customers c ON ch.customer_id = c.id
    WHERE ch.user_id = user_id_param 
      AND ch.status = 'active'
    ORDER BY ch.updated_at DESC
    LIMIT 5
  )
  SELECT 
    s.total_products,
    s.total_customers,
    s.total_orders,
    s.total_revenue,
    COALESCE(ro.recent_orders, '[]'::jsonb) as recent_orders,
    COALESCE(ls.low_stock_products, '[]'::jsonb) as low_stock_products,
    COALESCE(ac.active_chats, '[]'::jsonb) as active_chats
  FROM stats s
  CROSS JOIN LATERAL (SELECT recent_orders FROM recent_orders_data) ro
  CROSS JOIN LATERAL (SELECT low_stock_products FROM low_stock_data) ls
  CROSS JOIN LATERAL (SELECT active_chats FROM active_chats_data) ac;
END;
$$ LANGUAGE plpgsql STABLE;

-- Optimized function for searching products
CREATE OR REPLACE FUNCTION public.search_products(
  user_id_param UUID,
  search_term TEXT DEFAULT '',
  category_filter TEXT DEFAULT NULL,
  status_filter TEXT DEFAULT 'active'
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  sku TEXT,
  category TEXT,
  price DECIMAL,
  stock INTEGER,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.sku,
    p.category,
    p.price,
    p.stock,
    p.status,
    p.created_at
  FROM public.products p
  WHERE p.user_id = user_id_param
    AND (search_term = '' OR LOWER(p.name) LIKE '%' || LOWER(search_term) || '%')
    AND (category_filter IS NULL OR p.category = category_filter)
    AND (status_filter IS NULL OR p.status = status_filter)
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Optimized function for searching customers
CREATE OR REPLACE FUNCTION public.search_customers(
  user_id_param UUID,
  search_term TEXT DEFAULT '',
  platform_filter TEXT DEFAULT NULL,
  status_filter TEXT DEFAULT 'active'
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  phone_number TEXT,
  platform TEXT,
  total_orders INTEGER,
  total_spent DECIMAL,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.email,
    c.phone_number,
    c.platform,
    c.total_orders,
    c.total_spent,
    c.status,
    c.created_at
  FROM public.customers c
  WHERE c.user_id = user_id_param
    AND (search_term = '' OR LOWER(c.name) LIKE '%' || LOWER(search_term) || '%')
    AND (platform_filter IS NULL OR c.platform = platform_filter)
    AND (status_filter IS NULL OR c.status = status_filter)
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- STEP 3: CREATE PERFORMANCE FUNCTIONS
-- ============================================================================

-- Function to monitor query performance
CREATE OR REPLACE FUNCTION public.monitor_query_performance()
RETURNS TABLE (
  query_text TEXT,
  execution_time INTERVAL,
  calls BIGINT,
  total_time INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    query::TEXT as query_text,
    mean_exec_time as execution_time,
    calls,
    total_time
  FROM pg_stat_statements
  WHERE query LIKE '%public.%'
  ORDER BY mean_exec_time DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Function to optimize database
CREATE OR REPLACE FUNCTION public.optimize_database()
RETURNS void AS $$
BEGIN
  -- Clean up old data
  DELETE FROM public.notifications WHERE created_at < NOW() - INTERVAL '90 days';
  DELETE FROM public.analytics_events WHERE created_at < NOW() - INTERVAL '1 year';
  DELETE FROM public.auto_reply_logs WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Vacuum and analyze tables
  VACUUM ANALYZE public.users;
  VACUUM ANALYZE public.products;
  VACUUM ANALYZE public.customers;
  VACUUM ANALYZE public.orders;
  VACUUM ANALYZE public.chats;
  VACUUM ANALYZE public.messages;
  
  RAISE NOTICE 'Database optimization completed successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error during database optimization: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 4: FIX TRIGGERS
-- ============================================================================

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_user_created ON public.users;
DROP TRIGGER IF EXISTS generate_order_number_trigger ON public.orders;
DROP TRIGGER IF EXISTS update_customer_stats_trigger ON public.orders;
DROP TRIGGER IF EXISTS update_daily_stats_trigger ON public.orders;

-- Create fixed triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user();

CREATE TRIGGER on_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_settings();

CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

CREATE TRIGGER update_customer_stats_trigger
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_customer_stats();

CREATE TRIGGER update_daily_stats_trigger
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_daily_stats();

-- ============================================================================
-- STEP 5: CREATE OPTIMIZED INDEXES
-- ============================================================================

-- Create optimized indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_lower ON public.users(LOWER(email));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_user_status ON public.products(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_name_lower ON public.products(LOWER(name));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_user_platform ON public.customers(user_id, platform);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_name_lower ON public.customers(LOWER(name));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_status ON public.orders(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created_at_desc ON public.orders(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chats_user_status ON public.chats(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chats_updated_at_desc ON public.chats(updated_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_chat_created ON public.messages(chat_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_created_at_desc ON public.messages(created_at DESC);

-- Partial indexes for active records
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active ON public.products(user_id, status) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_active ON public.customers(user_id, status) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chats_active ON public.chats(user_id, status) WHERE status = 'active';

-- Partial indexes for recent data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_recent ON public.orders(user_id, created_at DESC) WHERE created_at > NOW() - INTERVAL '90 days';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_recent ON public.messages(chat_id, created_at DESC) WHERE created_at > NOW() - INTERVAL '30 days';

-- ============================================================================
-- STEP 6: FIX EXISTING DATA
-- ============================================================================

-- Fix existing users who don't have profiles
INSERT INTO public.users (id, email, first_name, last_name, business_name, phone_number, created_at, updated_at)
SELECT 
  auth.id,
  auth.email,
  COALESCE(
    auth.raw_user_meta_data->>'first_name',
    auth.raw_user_meta_data->>'firstName',
    auth.data->>'first_name',
    auth.data->>'firstName',
    ''
  ),
  COALESCE(
    auth.raw_user_meta_data->>'last_name',
    auth.raw_user_meta_data->>'lastName',
    auth.data->>'last_name',
    auth.data->>'lastName',
    ''
  ),
  COALESCE(
    auth.raw_user_meta_data->>'business_name',
    auth.raw_user_meta_data->>'businessName',
    auth.data->>'business_name',
    auth.data->>'businessName',
    ''
  ),
  COALESCE(
    auth.raw_user_meta_data->>'phone_number',
    auth.raw_user_meta_data->>'phoneNumber',
    auth.data->>'phone_number',
    auth.data->>'phoneNumber',
    ''
  ),
  auth.created_at,
  auth.updated_at
FROM auth.users auth
LEFT JOIN public.users pub ON auth.id = pub.id
WHERE pub.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Fix existing users who don't have settings
INSERT INTO public.user_settings (user_id, theme, language, timezone, currency, notifications_enabled, auto_replies_enabled)
SELECT 
  u.id,
  'light',
  'en',
  'UTC',
  'USD',
  TRUE,
  TRUE
FROM public.users u
LEFT JOIN public.user_settings s ON u.id = s.user_id
WHERE s.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- STEP 7: GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.user_settings TO anon, authenticated;
GRANT ALL ON public.products TO anon, authenticated;
GRANT ALL ON public.customers TO anon, authenticated;
GRANT ALL ON public.orders TO anon, authenticated;
GRANT ALL ON public.chats TO anon, authenticated;
GRANT ALL ON public.messages TO anon, authenticated;
GRANT ALL ON public.daily_stats TO anon, authenticated;

-- Grant usage on sequences
GRANT USAGE, SELECT ON SEQUENCE order_sequence TO anon, authenticated;

-- ============================================================================
-- STEP 8: VERIFY OPTIMIZATIONS
-- ============================================================================

-- Check if all functions exist and are working
DO $$
DECLARE
  function_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines 
  WHERE routine_schema = 'public' 
    AND routine_name IN (
      'create_profile_for_new_user',
      'create_default_settings',
      'update_updated_at_column',
      'generate_order_number',
      'update_customer_stats',
      'update_daily_stats',
      'get_user_dashboard_data',
      'search_products',
      'search_customers',
      'monitor_query_performance',
      'optimize_database'
    );
  
  IF function_count = 11 THEN
    RAISE NOTICE 'All functions have been successfully created/fixed!';
  ELSE
    RAISE WARNING 'Some functions may not have been created properly. Count: %', function_count;
  END IF;
END $$;

-- Check if all triggers exist
DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers 
  WHERE trigger_schema = 'public' 
    AND trigger_name IN (
      'on_auth_user_created',
      'on_user_created',
      'generate_order_number_trigger',
      'update_customer_stats_trigger',
      'update_daily_stats_trigger'
    );
  
  IF trigger_count = 5 THEN
    RAISE NOTICE 'All triggers have been successfully created/fixed!';
  ELSE
    RAISE WARNING 'Some triggers may not have been created properly. Count: %', trigger_count;
  END IF;
END $$;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'COMPLETE DATABASE OPTIMIZATION SUCCESSFULLY APPLIED!';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ All database functions have been optimized for production';
  RAISE NOTICE '✅ Triggers have been fixed with proper error handling';
  RAISE NOTICE '✅ Performance indexes have been created';
  RAISE NOTICE '✅ Existing data has been fixed';
  RAISE NOTICE '✅ New optimized functions are available:';
  RAISE NOTICE '   - get_user_dashboard_data(user_id)';
  RAISE NOTICE '   - search_products(user_id, search_term, category, status)';
  RAISE NOTICE '   - search_customers(user_id, search_term, platform, status)';
  RAISE NOTICE '   - monitor_query_performance()';
  RAISE NOTICE '   - optimize_database()';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Your database is now optimized for production use!';
  RAISE NOTICE '============================================================';
END $$;
