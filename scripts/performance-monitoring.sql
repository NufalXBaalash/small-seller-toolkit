-- ============================================================================
-- PERFORMANCE MONITORING AND OPTIMIZATION SCRIPT
-- ============================================================================
-- This script provides comprehensive monitoring and optimization tools
-- for the production database to ensure optimal performance.

-- ============================================================================
-- STEP 1: CREATE PERFORMANCE MONITORING TABLES
-- ============================================================================

-- Create table to track query performance
CREATE TABLE IF NOT EXISTS public.query_performance_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query_name TEXT NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  rows_returned INTEGER,
  user_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  error_message TEXT,
  query_params JSONB
);

-- Create table to track slow queries
CREATE TABLE IF NOT EXISTS public.slow_query_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query_text TEXT NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  rows_returned INTEGER,
  user_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  query_plan JSONB
);

-- Create table to track database metrics
CREATE TABLE IF NOT EXISTS public.database_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- ============================================================================
-- STEP 2: CREATE PERFORMANCE MONITORING FUNCTIONS
-- ============================================================================

-- Function to log query performance
CREATE OR REPLACE FUNCTION public.log_query_performance(
  query_name_param TEXT,
  execution_time_ms_param INTEGER,
  rows_returned_param INTEGER DEFAULT NULL,
  user_id_param UUID DEFAULT NULL,
  error_message_param TEXT DEFAULT NULL,
  query_params_param JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.query_performance_log (
    query_name,
    execution_time_ms,
    rows_returned,
    user_id,
    error_message,
    query_params
  ) VALUES (
    query_name_param,
    execution_time_ms_param,
    rows_returned_param,
    user_id_param,
    error_message_param,
    query_params_param
  );
END;
$$ LANGUAGE plpgsql;

-- Function to log slow queries
CREATE OR REPLACE FUNCTION public.log_slow_query(
  query_text_param TEXT,
  execution_time_ms_param INTEGER,
  rows_returned_param INTEGER DEFAULT NULL,
  user_id_param UUID DEFAULT NULL,
  query_plan_param JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.slow_query_log (
    query_text,
    execution_time_ms,
    rows_returned,
    user_id,
    query_plan
  ) VALUES (
    query_text_param,
    execution_time_ms_param,
    rows_returned_param,
    user_id_param,
    query_plan_param
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get query performance statistics
CREATE OR REPLACE FUNCTION public.get_query_performance_stats(
  days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
  query_name TEXT,
  avg_execution_time DECIMAL,
  max_execution_time INTEGER,
  min_execution_time INTEGER,
  total_executions BIGINT,
  avg_rows_returned DECIMAL,
  error_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qpl.query_name,
    AVG(qpl.execution_time_ms)::DECIMAL as avg_execution_time,
    MAX(qpl.execution_time_ms) as max_execution_time,
    MIN(qpl.execution_time_ms) as min_execution_time,
    COUNT(*) as total_executions,
    AVG(qpl.rows_returned)::DECIMAL as avg_rows_returned,
    COUNT(CASE WHEN qpl.error_message IS NOT NULL THEN 1 END) as error_count
  FROM public.query_performance_log qpl
  WHERE qpl.timestamp >= NOW() - INTERVAL '1 day' * days_back
  GROUP BY qpl.query_name
  ORDER BY avg_execution_time DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get slow queries
CREATE OR REPLACE FUNCTION public.get_slow_queries(
  threshold_ms INTEGER DEFAULT 1000,
  days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
  query_text TEXT,
  execution_time_ms INTEGER,
  rows_returned INTEGER,
  user_id UUID,
  timestamp TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sql.query_text,
    sql.execution_time_ms,
    sql.rows_returned,
    sql.user_id,
    sql.timestamp
  FROM public.slow_query_log sql
  WHERE sql.execution_time_ms >= threshold_ms
    AND sql.timestamp >= NOW() - INTERVAL '1 day' * days_back
  ORDER BY sql.execution_time_ms DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get database metrics
CREATE OR REPLACE FUNCTION public.get_database_metrics(
  metric_name_param TEXT DEFAULT NULL,
  days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
  metric_name TEXT,
  metric_value DECIMAL,
  timestamp TIMESTAMPTZ,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dm.metric_name,
    dm.metric_value,
    dm.timestamp,
    dm.metadata
  FROM public.database_metrics dm
  WHERE (metric_name_param IS NULL OR dm.metric_name = metric_name_param)
    AND dm.timestamp >= NOW() - INTERVAL '1 day' * days_back
  ORDER BY dm.timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 3: CREATE AUTOMATED OPTIMIZATION FUNCTIONS
-- ============================================================================

-- Function to analyze table statistics
CREATE OR REPLACE FUNCTION public.analyze_table_statistics()
RETURNS void AS $$
BEGIN
  -- Analyze all tables to update statistics
  ANALYZE public.users;
  ANALYZE public.products;
  ANALYZE public.customers;
  ANALYZE public.orders;
  ANALYZE public.chats;
  ANALYZE public.messages;
  ANALYZE public.daily_stats;
  ANALYZE public.query_performance_log;
  ANALYZE public.slow_query_log;
  ANALYZE public.database_metrics;
  
  -- Log the analysis
  INSERT INTO public.database_metrics (metric_name, metric_value, metadata)
  VALUES ('table_analysis_completed', EXTRACT(EPOCH FROM NOW()), '{"tables_analyzed": 10}');
  
  RAISE NOTICE 'Table statistics analysis completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old performance logs
CREATE OR REPLACE FUNCTION public.cleanup_performance_logs(
  days_to_keep INTEGER DEFAULT 30
)
RETURNS void AS $$
BEGIN
  -- Delete old query performance logs
  DELETE FROM public.query_performance_log 
  WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
  
  -- Delete old slow query logs
  DELETE FROM public.slow_query_log 
  WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
  
  -- Delete old database metrics
  DELETE FROM public.database_metrics 
  WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
  
  -- Log the cleanup
  INSERT INTO public.database_metrics (metric_name, metric_value, metadata)
  VALUES ('performance_logs_cleanup', EXTRACT(EPOCH FROM NOW()), 
          jsonb_build_object('days_kept', days_to_keep, 'cleanup_date', NOW()));
  
  RAISE NOTICE 'Performance logs cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to optimize database performance
CREATE OR REPLACE FUNCTION public.optimize_database_performance()
RETURNS void AS $$
BEGIN
  -- Analyze table statistics
  PERFORM public.analyze_table_statistics();
  
  -- Refresh materialized views
  PERFORM public.refresh_materialized_views();
  
  -- Cleanup old performance logs
  PERFORM public.cleanup_performance_logs(30);
  
  -- Log the optimization
  INSERT INTO public.database_metrics (metric_name, metric_value, metadata)
  VALUES ('database_optimization_completed', EXTRACT(EPOCH FROM NOW()), 
          jsonb_build_object('optimization_date', NOW()));
  
  RAISE NOTICE 'Database performance optimization completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 4: CREATE INDEX MONITORING FUNCTIONS
-- ============================================================================

-- Function to check index usage
CREATE OR REPLACE FUNCTION public.check_index_usage()
RETURNS TABLE (
  table_name TEXT,
  index_name TEXT,
  index_size TEXT,
  index_scans BIGINT,
  index_tuples_read BIGINT,
  index_tuples_fetched BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname::TEXT as table_name,
    indexname::TEXT as index_name,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    idx_scan as index_scans,
    idx_tup_read as index_tuples_read,
    idx_tup_fetch as index_tuples_fetched
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
  ORDER BY idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to check unused indexes
CREATE OR REPLACE FUNCTION public.get_unused_indexes()
RETURNS TABLE (
  table_name TEXT,
  index_name TEXT,
  index_size TEXT,
  last_used TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname::TEXT as table_name,
    indexname::TEXT as index_name,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    COALESCE(last_vacuum, last_autovacuum) as last_used
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
    AND idx_scan = 0
  ORDER BY pg_relation_size(indexrelid) DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 5: CREATE ALERTING FUNCTIONS
-- ============================================================================

-- Function to check for performance issues
CREATE OR REPLACE FUNCTION public.check_performance_issues()
RETURNS TABLE (
  issue_type TEXT,
  severity TEXT,
  description TEXT,
  recommendation TEXT
) AS $$
DECLARE
  slow_query_count INTEGER;
  error_rate DECIMAL;
  avg_response_time DECIMAL;
BEGIN
  -- Check for slow queries
  SELECT COUNT(*) INTO slow_query_count
  FROM public.slow_query_log
  WHERE timestamp >= NOW() - INTERVAL '1 hour';
  
  IF slow_query_count > 10 THEN
    RETURN QUERY SELECT 
      'Slow Queries'::TEXT,
      'High'::TEXT,
      'More than 10 slow queries in the last hour'::TEXT,
      'Consider optimizing queries or adding indexes'::TEXT;
  END IF;
  
  -- Check error rate
  SELECT 
    (COUNT(CASE WHEN error_message IS NOT NULL THEN 1 END) * 100.0 / COUNT(*))::DECIMAL
  INTO error_rate
  FROM public.query_performance_log
  WHERE timestamp >= NOW() - INTERVAL '1 hour';
  
  IF error_rate > 5 THEN
    RETURN QUERY SELECT 
      'High Error Rate'::TEXT,
      'Critical'::TEXT,
      'Error rate is ' || error_rate || '% in the last hour'::TEXT,
      'Investigate and fix the root cause of errors'::TEXT;
  END IF;
  
  -- Check average response time
  SELECT AVG(execution_time_ms)::DECIMAL
  INTO avg_response_time
  FROM public.query_performance_log
  WHERE timestamp >= NOW() - INTERVAL '1 hour';
  
  IF avg_response_time > 1000 THEN
    RETURN QUERY SELECT 
      'Slow Response Time'::TEXT,
      'Medium'::TEXT,
      'Average response time is ' || avg_response_time || 'ms'::TEXT,
      'Consider query optimization or database tuning'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 6: CREATE INDEXES FOR PERFORMANCE TABLES
-- ============================================================================

-- Create indexes for performance monitoring tables
CREATE INDEX IF NOT EXISTS idx_query_performance_log_timestamp ON public.query_performance_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_query_performance_log_query_name ON public.query_performance_log(query_name);
CREATE INDEX IF NOT EXISTS idx_query_performance_log_user_id ON public.query_performance_log(user_id);
CREATE INDEX IF NOT EXISTS idx_slow_query_log_timestamp ON public.slow_query_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_slow_query_log_execution_time ON public.slow_query_log(execution_time_ms DESC);
CREATE INDEX IF NOT EXISTS idx_database_metrics_timestamp ON public.database_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_database_metrics_name ON public.database_metrics(metric_name);

-- ============================================================================
-- STEP 7: GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on monitoring functions
GRANT EXECUTE ON FUNCTION public.log_query_performance(TEXT, INTEGER, INTEGER, UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_slow_query(TEXT, INTEGER, INTEGER, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_query_performance_stats(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_slow_queries(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_database_metrics(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analyze_table_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_performance_logs(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.optimize_database_performance() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_index_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unused_indexes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_performance_issues() TO authenticated;

-- ============================================================================
-- STEP 8: CREATE SCHEDULED TASKS (COMMENTS FOR REFERENCE)
-- ============================================================================

/*
-- These functions should be called periodically via a cron job or similar:

-- Daily at 2 AM: Analyze table statistics
SELECT public.analyze_table_statistics();

-- Weekly on Sunday at 3 AM: Optimize database performance
SELECT public.optimize_database_performance();

-- Monthly on the 1st at 4 AM: Cleanup old performance logs
SELECT public.cleanup_performance_logs(30);

-- Every hour: Check for performance issues
SELECT public.check_performance_issues();
*/

-- ============================================================================
-- STEP 9: VERIFICATION
-- ============================================================================

-- Verify that all monitoring functions are created successfully
DO $$
DECLARE
  function_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines 
  WHERE routine_schema = 'public' 
    AND routine_name IN (
      'log_query_performance',
      'log_slow_query',
      'get_query_performance_stats',
      'get_slow_queries',
      'get_database_metrics',
      'analyze_table_statistics',
      'cleanup_performance_logs',
      'optimize_database_performance',
      'check_index_usage',
      'get_unused_indexes',
      'check_performance_issues'
    );
  
  IF function_count = 11 THEN
    RAISE NOTICE 'All performance monitoring functions created successfully';
  ELSE
    RAISE WARNING 'Only % out of 11 monitoring functions were created', function_count;
  END IF;
END $$;
