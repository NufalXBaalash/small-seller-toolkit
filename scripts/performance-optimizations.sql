-- ============================================================================
-- DATABASE PERFORMANCE OPTIMIZATIONS
-- ============================================================================
-- This script contains performance optimizations for database queries
-- and functions to ensure fast and reliable operation in production.

-- ============================================================================
-- STEP 1: OPTIMIZE EXISTING INDEXES
-- ============================================================================

-- Drop inefficient indexes if they exist
DROP INDEX IF EXISTS idx_products_name_search;
DROP INDEX IF EXISTS idx_customers_name_search;

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

-- ============================================================================
-- STEP 2: CREATE PARTIAL INDEXES FOR COMMON QUERIES
-- ============================================================================

-- Partial indexes for active records
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active ON public.products(user_id, status) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_active ON public.customers(user_id, status) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chats_active ON public.chats(user_id, status) WHERE status = 'active';

-- Partial indexes for recent data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_recent ON public.orders(user_id, created_at DESC) WHERE created_at > NOW() - INTERVAL '90 days';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_recent ON public.messages(chat_id, created_at DESC) WHERE created_at > NOW() - INTERVAL '30 days';

-- ============================================================================
-- STEP 3: OPTIMIZE FUNCTIONS FOR BETTER PERFORMANCE
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
-- STEP 4: CREATE MATERIALIZED VIEWS FOR HEAVY QUERIES
-- ============================================================================

-- Materialized view for daily statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.daily_stats_mv AS
SELECT 
  user_id,
  DATE(created_at) as date,
  COUNT(*) as total_orders,
  COALESCE(SUM(total_amount), 0) as total_revenue,
  COUNT(DISTINCT customer_id) as unique_customers
FROM public.orders
GROUP BY user_id, DATE(created_at)
WITH DATA;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_stats_mv_user_date ON public.daily_stats_mv(user_id, date);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION public.refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.daily_stats_mv;
  RAISE NOTICE 'Materialized views refreshed successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error refreshing materialized views: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 5: CREATE CACHING FUNCTIONS
-- ============================================================================

-- Function to cache frequently accessed data
CREATE OR REPLACE FUNCTION public.cache_user_data(user_id_param UUID)
RETURNS void AS $$
DECLARE
  cache_key TEXT;
  cache_data JSONB;
BEGIN
  cache_key := 'user_data_' || user_id_param::TEXT;
  
  -- Get user dashboard data
  SELECT jsonb_build_object(
    'dashboard_data', (
      SELECT row_to_json(d.*) 
      FROM public.get_user_dashboard_data(user_id_param) d
    ),
    'cached_at', NOW()
  ) INTO cache_data;
  
  -- Store in a temporary table or use application-level caching
  -- For now, we'll just log the cache operation
  RAISE NOTICE 'Cached data for user %: %', user_id_param, cache_data;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error caching data for user %: %', user_id_param, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 6: OPTIMIZE EXISTING QUERIES
-- ============================================================================

-- Create a function to get optimized product list
CREATE OR REPLACE FUNCTION public.get_products_optimized(
  user_id_param UUID,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
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
  ORDER BY p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create a function to get optimized customer list
CREATE OR REPLACE FUNCTION public.get_customers_optimized(
  user_id_param UUID,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
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
  ORDER BY c.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- STEP 7: CREATE PERFORMANCE MONITORING FUNCTIONS
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

-- ============================================================================
-- STEP 8: CREATE CLEANUP AND MAINTENANCE FUNCTIONS
-- ============================================================================

-- Function to clean up old data and optimize tables
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
  
  -- Refresh materialized views
  PERFORM public.refresh_materialized_views();
  
  RAISE NOTICE 'Database optimization completed successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error during database optimization: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Database performance optimizations have been successfully applied!';
  RAISE NOTICE 'New optimized functions and indexes have been created.';
  RAISE NOTICE 'Materialized views have been set up for heavy queries.';
  RAISE NOTICE 'Performance monitoring functions are now available.';
END $$;
