-- Create table to track which stocks to monitor
CREATE TABLE IF NOT EXISTS monitored_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  exchange TEXT,
  is_active BOOLEAN DEFAULT true,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE monitored_stocks ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Monitored stocks are publicly readable"
  ON monitored_stocks FOR SELECT
  USING (true);

-- Service role can manage
CREATE POLICY "Service role can manage monitored stocks"
  ON monitored_stocks FOR ALL
  USING (auth.role() = 'service_role');

-- Enhanced real-time quotes table with more comprehensive data
CREATE TABLE IF NOT EXISTS stock_quotes_realtime (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  change NUMERIC NOT NULL,
  change_percent NUMERIC NOT NULL,
  open NUMERIC NOT NULL,
  high NUMERIC NOT NULL,
  low NUMERIC NOT NULL,
  previous_close NUMERIC NOT NULL,
  volume BIGINT NOT NULL DEFAULT 0,
  avg_volume BIGINT,
  market_cap BIGINT,
  pe_ratio NUMERIC,
  eps NUMERIC,
  week_52_high NUMERIC,
  week_52_low NUMERIC,
  dividend_yield NUMERIC,
  beta NUMERIC,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  source TEXT NOT NULL, -- 'finnhub', 'yahoo', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_symbol_timestamp UNIQUE(symbol, timestamp)
);

-- Enable RLS
ALTER TABLE stock_quotes_realtime ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Realtime quotes are publicly readable"
  ON stock_quotes_realtime FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage realtime quotes"
  ON stock_quotes_realtime FOR ALL
  USING (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX idx_realtime_symbol ON stock_quotes_realtime(symbol);
CREATE INDEX idx_realtime_timestamp ON stock_quotes_realtime(timestamp DESC);
CREATE INDEX idx_realtime_symbol_timestamp ON stock_quotes_realtime(symbol, timestamp DESC);

-- Enhanced historical intraday data table
CREATE INDEX IF NOT EXISTS idx_historical_symbol_period ON stock_historical_data(symbol, period);
CREATE INDEX IF NOT EXISTS idx_historical_timestamp ON stock_historical_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_historical_created_at ON stock_historical_data(created_at DESC);

-- Company fundamentals table for detailed company information
CREATE TABLE IF NOT EXISTS company_fundamentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  sector TEXT,
  industry TEXT,
  country TEXT,
  website TEXT,
  logo_url TEXT,
  employees INTEGER,
  ipo_date DATE,
  market_cap BIGINT,
  shares_outstanding BIGINT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE company_fundamentals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company fundamentals are publicly readable"
  ON company_fundamentals FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage company fundamentals"
  ON company_fundamentals FOR ALL
  USING (auth.role() = 'service_role');

-- Data collection log to track what's been fetched
CREATE TABLE IF NOT EXISTS data_collection_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  data_type TEXT NOT NULL, -- 'quote', 'historical', 'fundamentals'
  source TEXT NOT NULL, -- 'finnhub', 'yahoo'
  success BOOLEAN NOT NULL,
  error_message TEXT,
  records_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE data_collection_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collection logs are publicly readable"
  ON data_collection_log FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage collection logs"
  ON data_collection_log FOR ALL
  USING (auth.role() = 'service_role');

-- Create indexes
CREATE INDEX idx_collection_log_symbol ON data_collection_log(symbol);
CREATE INDEX idx_collection_log_created_at ON data_collection_log(created_at DESC);

-- Function to clean old realtime quotes (keep last 30 days)
CREATE OR REPLACE FUNCTION clean_old_realtime_quotes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM stock_quotes_realtime
  WHERE timestamp < now() - INTERVAL '30 days';
END;
$$;

-- Insert commonly traded stocks to monitor
INSERT INTO monitored_stocks (symbol, name, exchange) VALUES
  ('AAPL', 'Apple Inc.', 'NASDAQ'),
  ('MSFT', 'Microsoft Corporation', 'NASDAQ'),
  ('GOOGL', 'Alphabet Inc.', 'NASDAQ'),
  ('AMZN', 'Amazon.com Inc.', 'NASDAQ'),
  ('TSLA', 'Tesla Inc.', 'NASDAQ'),
  ('META', 'Meta Platforms Inc.', 'NASDAQ'),
  ('NVDA', 'NVIDIA Corporation', 'NASDAQ'),
  ('JPM', 'JPMorgan Chase & Co.', 'NYSE'),
  ('V', 'Visa Inc.', 'NYSE'),
  ('WMT', 'Walmart Inc.', 'NYSE'),
  ('RELIANCE.NS', 'Reliance Industries', 'NSE'),
  ('TCS.NS', 'Tata Consultancy Services', 'NSE'),
  ('HDFCBANK.NS', 'HDFC Bank', 'NSE'),
  ('INFY.NS', 'Infosys', 'NSE'),
  ('ICICIBANK.NS', 'ICICI Bank', 'NSE')
ON CONFLICT (symbol) DO NOTHING;