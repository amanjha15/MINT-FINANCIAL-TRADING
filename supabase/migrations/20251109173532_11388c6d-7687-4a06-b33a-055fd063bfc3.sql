-- Fix security warning: Set search_path for function
CREATE OR REPLACE FUNCTION clean_old_stock_quotes()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.stock_quotes
  WHERE updated_at < NOW() - INTERVAL '1 hour';
END;
$$;