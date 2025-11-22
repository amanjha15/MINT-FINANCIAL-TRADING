-- Create table for historical stock data
CREATE TABLE IF NOT EXISTS public.stock_historical_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  open NUMERIC NOT NULL,
  high NUMERIC NOT NULL,
  low NUMERIC NOT NULL,
  close NUMERIC NOT NULL,
  volume BIGINT NOT NULL,
  period TEXT NOT NULL, -- '1d', '5d', '1mo', etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(symbol, timestamp, period)
);

-- Enable RLS
ALTER TABLE public.stock_historical_data ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Historical data is publicly readable"
ON public.stock_historical_data
FOR SELECT
USING (true);

-- Service role can manage historical data
CREATE POLICY "Service role can manage historical data"
ON public.stock_historical_data
FOR ALL
USING (auth.role() = 'service_role');

-- Index for faster queries
CREATE INDEX idx_stock_historical_symbol_period ON public.stock_historical_data(symbol, period, timestamp DESC);

-- Function to clean old historical data (older than 7 days)
CREATE OR REPLACE FUNCTION public.clean_old_historical_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.stock_historical_data
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$;