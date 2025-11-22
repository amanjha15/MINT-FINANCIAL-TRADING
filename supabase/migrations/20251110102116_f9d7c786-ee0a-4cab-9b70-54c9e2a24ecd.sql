-- Create practice sessions table to track historical trading sessions
CREATE TABLE public.practice_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  lesson_id UUID REFERENCES public.lessons(id),
  practice_date TIMESTAMP WITH TIME ZONE NOT NULL,
  initial_cash NUMERIC NOT NULL DEFAULT 50000,
  final_cash NUMERIC,
  total_value NUMERIC,
  gain_loss_amount NUMERIC,
  gain_loss_percent NUMERIC,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create practice trades table to store individual trades
CREATE TABLE public.practice_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  stock_name TEXT NOT NULL,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  quantity INTEGER NOT NULL,
  price_at_trade NUMERIC NOT NULL,
  price_at_completion NUMERIC,
  total_cost NUMERIC NOT NULL,
  gain_loss_amount NUMERIC,
  gain_loss_percent NUMERIC,
  traded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_trades ENABLE ROW LEVEL SECURITY;

-- RLS policies for practice_sessions
CREATE POLICY "Users can view own practice sessions"
  ON public.practice_sessions
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create practice sessions"
  ON public.practice_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own practice sessions"
  ON public.practice_sessions
  FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- RLS policies for practice_trades
CREATE POLICY "Users can view trades from own sessions"
  ON public.practice_trades
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.practice_sessions
      WHERE id = practice_trades.session_id
      AND (auth.uid() = user_id OR user_id IS NULL)
    )
  );

CREATE POLICY "Users can create trades in own sessions"
  ON public.practice_trades
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.practice_sessions
      WHERE id = practice_trades.session_id
      AND (auth.uid() = user_id OR user_id IS NULL)
    )
  );

CREATE POLICY "Users can update trades in own sessions"
  ON public.practice_trades
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.practice_sessions
      WHERE id = practice_trades.session_id
      AND (auth.uid() = user_id OR user_id IS NULL)
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_practice_sessions_user_id ON public.practice_sessions(user_id);
CREATE INDEX idx_practice_sessions_lesson_id ON public.practice_sessions(lesson_id);
CREATE INDEX idx_practice_trades_session_id ON public.practice_trades(session_id);

-- Trigger to update updated_at
CREATE TRIGGER update_practice_sessions_updated_at
  BEFORE UPDATE ON public.practice_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();