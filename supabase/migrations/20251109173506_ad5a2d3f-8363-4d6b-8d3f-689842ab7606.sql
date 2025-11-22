-- Create table for caching stock quotes
CREATE TABLE IF NOT EXISTS public.stock_quotes (
  symbol TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  change NUMERIC NOT NULL,
  change_percent NUMERIC NOT NULL,
  high NUMERIC NOT NULL,
  low NUMERIC NOT NULL,
  open NUMERIC NOT NULL,
  previous_close NUMERIC NOT NULL,
  volume BIGINT NOT NULL,
  market_cap BIGINT,
  pe_ratio NUMERIC,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stock_quotes_updated_at ON public.stock_quotes(updated_at);

-- Enable RLS
ALTER TABLE public.stock_quotes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read stock quotes
CREATE POLICY "Stock quotes are publicly readable"
  ON public.stock_quotes
  FOR SELECT
  USING (true);

-- Policy: Only service role can insert/update
CREATE POLICY "Service role can manage stock quotes"
  ON public.stock_quotes
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create function to clean old cache entries (older than 1 hour)
CREATE OR REPLACE FUNCTION clean_old_stock_quotes()
RETURNS void AS $$
BEGIN
  DELETE FROM public.stock_quotes
  WHERE updated_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;