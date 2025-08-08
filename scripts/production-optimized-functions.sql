-- ============================================================================
-- PRODUCTION-OPTIMIZED DATABASE FUNCTIONS (FIXED)
-- ============================================================================
-- This script contains production-ready, optimized database functions
-- that handle edge cases, provide proper error handling, and ensure
-- reliable operation in production environments.

-- ============================================================================
-- STEP 1: DROP EXISTING TRIGGERS AND FUNCTIONS (PROPER ORDER)
-- ============================================================================

-- Drop all existing triggers that depend on update_updated_at_column first
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_businesses_updated_at ON public.businesses;
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
DROP TRIGGER IF EXISTS update_product_categories_updated_at ON public.product_categories;
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS update_chats_updated_at ON public.chats;
DROP TRIGGER IF EXISTS update_auto_replies_updated_at ON public.auto_replies;
DROP TRIGGER IF EXISTS update_daily_stats_updated_at ON public.daily_stats;
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
DROP TRIGGER IF EXISTS update_platform_integrations_updated_at ON public.platform_integrations;

-- Drop other existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_user_created ON public.users;
DROP TRIGGER IF EXISTS generate_order_number_trigger ON public.orders;
DROP TRIGGER IF EXISTS update_customer_stats_trigger ON public.orders;
DROP TRIGGER IF EXISTS update_daily_stats_trigger ON public.orders;

-- Now drop existing functions
DROP FUNCTION IF EXISTS public.create_profile_for_new_user();
DROP FUNCTION IF EXISTS public.create_default_settings();
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.generate_order_number();
DROP FUNCTION IF EXISTS public.update_customer_stats();
DROP FUNCTION IF EXISTS public.update_daily_stats();
DROP FUNCTION IF EXISTS public.get_user_dashboard_data(UUID);
DROP FUNCTION IF EXISTS public.search_products(TEXT, UUID);
DROP FUNCTION IF EXISTS public.search_customers(TEXT, UUID);
DROP FUNCTION IF EXISTS public.get_products_optimized(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.get_customers_optimized(UUID, INTEGER, INTEGER);

-- ============================================================================
-- STEP 2: CREATE OPTIMIZED CORE FUNCTIONS
-- ============================================================================

-- Optimized function for creating user profiles on signup
-- Handles all metadata formats and edge cases
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_metadata JSONB;
  first_name_val TEXT;
  last_name_val TEXT;
  business_name_val TEXT;
  phone_number_val TEXT;
BEGIN
  -- Get metadata from the most reliable source with fallbacks
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

-- Optimized function for creating default settings for new users
CREATE OR REPLACE FUNCTION public.create_default_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id, theme, language, timezone, currency, notifications_enabled, auto_replies_enabled)
  VALUES (NEW.id, 'light', 'en', 'UTC', 'USD', TRUE, TRUE)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the trigger
    RAISE WARNING 'Error in create_default_settings for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optimized function for updating the updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Optimized function for generating order numbers
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  order_count INTEGER;
  new_order_number TEXT;
BEGIN
  -- Get the count of orders for this user
  SELECT COUNT(*) INTO order_count
  FROM public.orders
  WHERE user_id = NEW.user_id;
  
  -- Generate order number with user prefix and sequential number
  new_order_number := 'ORD-' || SUBSTRING(NEW.user_id::text, 1, 8) || '-' || LPAD((order_count + 1)::text, 6, '0');
  
  NEW.order_number := new_order_number;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback order number if there's an error
    NEW.order_number := 'ORD-' || SUBSTRING(NEW.user_id::text, 1, 8) || '-' || EXTRACT(EPOCH FROM NOW())::INTEGER;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Optimized function for updating customer stats
CREATE OR REPLACE FUNCTION public.update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update customer stats when an order is created
  UPDATE public.customers
  SET 
    total_orders = (
      SELECT COUNT(*) 
      FROM public.orders 
      WHERE customer_id = NEW.customer_id
    ),
    total_spent = (
      SELECT COALESCE(SUM(total_amount), 0)
      FROM public.orders 
      WHERE customer_id = NEW.customer_id
    ),
    last_order_date = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.customer_id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the trigger
    RAISE WARNING 'Error in update_customer_stats for order %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Optimized function for updating daily stats
CREATE OR REPLACE FUNCTION public.update_daily_stats()
RETURNS TRIGGER AS $$
DECLARE
  order_date DATE;
BEGIN
  order_date := DATE(NEW.created_at);
  
  -- Insert or update daily stats
  INSERT INTO public.daily_stats (user_id, date, total_orders, total_revenue, order_count)
  VALUES (
    NEW.user_id,
    order_date,
    NEW.total_amount,
    NEW.total_amount,
    1
  )
  ON CONFLICT (user_id, date) DO UPDATE SET
    total_orders = public.daily_stats.total_orders + NEW.total_amount,
    total_revenue = public.daily_stats.total_revenue + NEW.total_amount,
    order_count = public.daily_stats.order_count + 1,
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the trigger
    RAISE WARNING 'Error in update_daily_stats for order %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 3: CREATE OPTIMIZED QUERY FUNCTIONS
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
        'id', c.id,
        'platform', c.platform,
        'last_message', c.last_message,
        'unread_count', c.unread_count,
        'updated_at', c.updated_at
      )
    ) as active_chats
    FROM public.chats c
    WHERE c.user_id = user_id_param 
      AND c.status = 'active'
    ORDER BY c.updated_at DESC
    LIMIT 5
  )
  SELECT 
    s.total_products,
    s.total_customers,
    s.total_orders,
    s.total_revenue,
    COALESCE(r.recent_orders, '[]'::jsonb),
    COALESCE(l.low_stock_products, '[]'::jsonb),
    COALESCE(a.active_chats, '[]'::jsonb)
  FROM stats s
  CROSS JOIN LATERAL (SELECT recent_orders FROM recent_orders_data) r
  CROSS JOIN LATERAL (SELECT low_stock_products FROM low_stock_data) l
  CROSS JOIN LATERAL (SELECT active_chats FROM active_chats_data) a;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optimized function for searching products
CREATE OR REPLACE FUNCTION public.search_products(search_term TEXT, user_id_param UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  sku TEXT,
  category TEXT,
  stock INTEGER,
  price DECIMAL,
  status TEXT,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.sku,
    p.category,
    p.stock,
    p.price,
    p.status,
    p.description,
    p.image_url,
    p.created_at,
    p.updated_at
  FROM public.products p
  WHERE p.user_id = user_id_param
    AND (
      p.name ILIKE '%' || search_term || '%'
      OR p.sku ILIKE '%' || search_term || '%'
      OR p.category ILIKE '%' || search_term || '%'
      OR p.description ILIKE '%' || search_term || '%'
    )
    AND p.status = 'active'
  ORDER BY 
    CASE 
      WHEN p.name ILIKE search_term || '%' THEN 1
      WHEN p.name ILIKE '%' || search_term || '%' THEN 2
      ELSE 3
    END,
    p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optimized function for searching customers
CREATE OR REPLACE FUNCTION public.search_customers(search_term TEXT, user_id_param UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  phone_number TEXT,
  platform TEXT,
  total_orders INTEGER,
  total_spent DECIMAL,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
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
    c.created_at,
    c.updated_at
  FROM public.customers c
  WHERE c.user_id = user_id_param
    AND (
      c.name ILIKE '%' || search_term || '%'
      OR c.email ILIKE '%' || search_term || '%'
      OR c.phone_number ILIKE '%' || search_term || '%'
    )
    AND c.status = 'active'
  ORDER BY 
    CASE 
      WHEN c.name ILIKE search_term || '%' THEN 1
      WHEN c.name ILIKE '%' || search_term || '%' THEN 2
      ELSE 3
    END,
    c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optimized function for getting products with pagination
CREATE OR REPLACE FUNCTION public.get_products_optimized(
  user_id_param UUID,
  limit_param INTEGER DEFAULT 50,
  offset_param INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  sku TEXT,
  category TEXT,
  stock INTEGER,
  price DECIMAL,
  status TEXT,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH product_data AS (
    SELECT 
      p.id,
      p.name,
      p.sku,
      p.category,
      p.stock,
      p.price,
      p.status,
      p.description,
      p.image_url,
      p.created_at,
      p.updated_at
    FROM public.products p
    WHERE p.user_id = user_id_param
    ORDER BY p.created_at DESC
    LIMIT limit_param
    OFFSET offset_param
  ),
  total_count AS (
    SELECT COUNT(*) as count
    FROM public.products p
    WHERE p.user_id = user_id_param
  )
  SELECT 
    pd.*,
    tc.count
  FROM product_data pd
  CROSS JOIN total_count tc;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optimized function for getting customers with pagination
CREATE OR REPLACE FUNCTION public.get_customers_optimized(
  user_id_param UUID,
  limit_param INTEGER DEFAULT 50,
  offset_param INTEGER DEFAULT 0
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
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH customer_data AS (
    SELECT 
      c.id,
      c.name,
      c.email,
      c.phone_number,
      c.platform,
      c.total_orders,
      c.total_spent,
      c.status,
      c.created_at,
      c.updated_at
    FROM public.customers c
    WHERE c.user_id = user_id_param
    ORDER BY c.created_at DESC
    LIMIT limit_param
    OFFSET offset_param
  ),
  total_count AS (
    SELECT COUNT(*) as count
    FROM public.customers c
    WHERE c.user_id = user_id_param
  )
  SELECT 
    cd.*,
    tc.count
  FROM customer_data cd
  CROSS JOIN total_count tc;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 4: RECREATE ALL NECESSARY TRIGGERS
-- ============================================================================

-- Create triggers for the optimized functions
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

-- Recreate all the updated_at triggers for each table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_categories_updated_at
  BEFORE UPDATE ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chats_updated_at
  BEFORE UPDATE ON public.chats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_auto_replies_updated_at
  BEFORE UPDATE ON public.auto_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_stats_updated_at
  BEFORE UPDATE ON public.daily_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_platform_integrations_updated_at
  BEFORE UPDATE ON public.platform_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 5: CREATE OPTIMIZED INDEXES
-- ============================================================================

-- Drop inefficient indexes if they exist
DROP INDEX IF EXISTS idx_products_name_search;
DROP INDEX IF EXISTS idx_customers_name_search;

-- Create optimized indexes for better performance (using regular CREATE INDEX)
-- Note: For production, run these with CONCURRENTLY in separate transactions
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON public.users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_products_user_status ON public.products(user_id, status);
CREATE INDEX IF NOT EXISTS idx_products_name_lower ON public.products(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_products_sku_lower ON public.products(LOWER(sku)) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_user_platform ON public.customers(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_customers_name_lower ON public.customers(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_customers_email_lower ON public.customers(LOWER(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone_number) WHERE phone_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON public.orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_chats_user_status ON public.chats(user_id, status);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at_desc ON public.chats(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_customer_id ON public.chats(customer_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON public.messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_created_at_desc ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON public.daily_stats(user_id, date);

-- Create partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(user_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_customers_active ON public.customers(user_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_chats_active ON public.chats(user_id, status) WHERE status = 'active';
-- Note: Time-based partial indexes removed due to immutability requirements
-- These would need to be recreated periodically with fixed dates
-- CREATE INDEX IF NOT EXISTS idx_orders_recent ON public.orders(user_id, created_at DESC) WHERE created_at > '2024-05-10'::timestamp;
-- CREATE INDEX IF NOT EXISTS idx_messages_recent ON public.messages(chat_id, created_at DESC) WHERE created_at > '2024-07-10'::timestamp;

-- ============================================================================
-- STEP 6: CREATE MATERIALIZED VIEWS FOR PERFORMANCE
-- ============================================================================

-- Create materialized view for daily stats
CREATE MATERIALIZED VIEW IF NOT EXISTS public.daily_stats_mv AS
SELECT 
  user_id,
  DATE(created_at) as date,
  SUM(total_amount) as total_revenue,
  COUNT(*) as order_count,
  AVG(total_amount) as avg_order_value
FROM public.orders
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY user_id, DATE(created_at)
ORDER BY user_id, DATE(created_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_stats_mv_user_date ON public.daily_stats_mv(user_id, date);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION public.refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.daily_stats_mv;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 7: CREATE MONITORING FUNCTIONS
-- ============================================================================

-- Function to monitor query performance
CREATE OR REPLACE FUNCTION public.monitor_query_performance()
RETURNS TABLE (
  query_text TEXT,
  execution_time INTERVAL,
  calls BIGINT,
  total_time INTERVAL,
  mean_time INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    query::TEXT as query_text,
    mean_exec_time as execution_time,
    calls,
    total_exec_time as total_time,
    mean_exec_time as mean_time
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
  -- Analyze tables to update statistics
  ANALYZE public.users;
  ANALYZE public.products;
  ANALYZE public.customers;
  ANALYZE public.orders;
  ANALYZE public.chats;
  ANALYZE public.messages;
  ANALYZE public.daily_stats;
  
  -- Refresh materialized views
  PERFORM public.refresh_materialized_views();
  
  -- Log optimization completion
  RAISE NOTICE 'Database optimization completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 8: CREATE CLEANUP AND MAINTENANCE FUNCTIONS
-- ============================================================================

-- Function to cleanup old data
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Delete old messages (older than 1 year)
  DELETE FROM public.messages 
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  -- Delete old daily stats (older than 2 years)
  DELETE FROM public.daily_stats 
  WHERE date < NOW() - INTERVAL '2 years';
  
  -- Log cleanup completion
  RAISE NOTICE 'Data cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to recreate time-based partial indexes
CREATE OR REPLACE FUNCTION public.recreate_time_based_indexes()
RETURNS void AS $$
DECLARE
  cutoff_date_90 TEXT;
  cutoff_date_30 TEXT;
BEGIN
  -- Calculate cutoff dates as fixed strings
  cutoff_date_90 := (NOW() - INTERVAL '90 days')::DATE::TEXT;
  cutoff_date_30 := (NOW() - INTERVAL '30 days')::DATE::TEXT;
  
  -- Drop existing time-based indexes
  DROP INDEX IF EXISTS idx_orders_recent;
  DROP INDEX IF EXISTS idx_messages_recent;
  
  -- Create new time-based partial indexes with fixed dates
  EXECUTE format('CREATE INDEX idx_orders_recent ON public.orders(user_id, created_at DESC) WHERE created_at > %L::timestamp', cutoff_date_90);
  EXECUTE format('CREATE INDEX idx_messages_recent ON public.messages(chat_id, created_at DESC) WHERE created_at > %L::timestamp', cutoff_date_30);
  
  -- Log completion
  RAISE NOTICE 'Time-based indexes recreated with cutoff dates: orders > %, messages > %', cutoff_date_90, cutoff_date_30;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 9: GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.create_profile_for_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_default_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_order_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_customer_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_daily_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_dashboard_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_products(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_customers(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_products_optimized(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customers_optimized(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_materialized_views() TO authenticated;
GRANT EXECUTE ON FUNCTION public.monitor_query_performance() TO authenticated;
GRANT EXECUTE ON FUNCTION public.optimize_database() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.recreate_time_based_indexes() TO authenticated;

-- ============================================================================
-- STEP 10: VERIFICATION
-- ============================================================================

-- Verify that all functions are created successfully
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
      'get_products_optimized',
      'get_customers_optimized'
    );
  
  IF function_count = 11 THEN
    RAISE NOTICE 'All production-optimized functions created successfully';
  ELSE
    RAISE WARNING 'Only % out of 11 functions were created', function_count;
  END IF;
END $$;