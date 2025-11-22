-- Fix the clean_old_realtime_quotes function with proper search_path
CREATE OR REPLACE FUNCTION clean_old_realtime_quotes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM stock_quotes_realtime
  WHERE timestamp < now() - INTERVAL '30 days';
END;
$$;