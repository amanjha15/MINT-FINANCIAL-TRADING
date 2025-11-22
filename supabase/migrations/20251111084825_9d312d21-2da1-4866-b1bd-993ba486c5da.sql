-- Create table for virtual trading simulator portfolios
CREATE TABLE IF NOT EXISTS public.simulator_portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  cash numeric NOT NULL DEFAULT 100000,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Create table for virtual trading simulator trades
CREATE TABLE IF NOT EXISTS public.simulator_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  stock_name text NOT NULL,
  trade_type text NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  quantity integer NOT NULL,
  price numeric NOT NULL,
  total numeric NOT NULL,
  traded_at timestamp with time zone DEFAULT now()
);

-- Create table for virtual trading simulator holdings
CREATE TABLE IF NOT EXISTS public.simulator_holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  stock_name text NOT NULL,
  quantity integer NOT NULL,
  purchase_price numeric NOT NULL,
  current_price numeric NOT NULL,
  purchase_date timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, symbol)
);

-- Enable Row Level Security
ALTER TABLE public.simulator_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulator_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulator_holdings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for simulator_portfolios
CREATE POLICY "Users can view own portfolio"
  ON public.simulator_portfolios
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own portfolio"
  ON public.simulator_portfolios
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolio"
  ON public.simulator_portfolios
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for simulator_trades
CREATE POLICY "Users can view own trades"
  ON public.simulator_trades
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own trades"
  ON public.simulator_trades
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for simulator_holdings
CREATE POLICY "Users can view own holdings"
  ON public.simulator_holdings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own holdings"
  ON public.simulator_holdings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own holdings"
  ON public.simulator_holdings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own holdings"
  ON public.simulator_holdings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_simulator_portfolios_updated_at
  BEFORE UPDATE ON public.simulator_portfolios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_simulator_holdings_updated_at
  BEFORE UPDATE ON public.simulator_holdings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_simulator_trades_user_id ON public.simulator_trades(user_id);
CREATE INDEX idx_simulator_trades_symbol ON public.simulator_trades(symbol);
CREATE INDEX idx_simulator_holdings_user_id ON public.simulator_holdings(user_id);
CREATE INDEX idx_simulator_holdings_symbol ON public.simulator_holdings(symbol);