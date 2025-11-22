-- Create a table to store public statistics
CREATE TABLE IF NOT EXISTS public.platform_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_name text UNIQUE NOT NULL,
  stat_value numeric NOT NULL DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_stats ENABLE ROW LEVEL SECURITY;

-- Allow public read access to stats
CREATE POLICY "Platform stats are publicly readable"
  ON public.platform_stats
  FOR SELECT
  USING (true);

-- Insert initial stat rows
INSERT INTO public.platform_stats (stat_name, stat_value)
VALUES 
  ('total_users', 0),
  ('total_trades_value', 0),
  ('total_lessons_completed', 0)
ON CONFLICT (stat_name) DO NOTHING;

-- Function to update user count
CREATE OR REPLACE FUNCTION update_user_count()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE platform_stats
  SET stat_value = (SELECT COUNT(*) FROM profiles),
      updated_at = now()
  WHERE stat_name = 'total_users';
END;
$$;

-- Function to update trades value
CREATE OR REPLACE FUNCTION update_trades_value()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE platform_stats
  SET stat_value = (SELECT COALESCE(SUM(ABS(total)), 0) FROM simulator_trades),
      updated_at = now()
  WHERE stat_name = 'total_trades_value';
END;
$$;

-- Function to update lessons completed count
CREATE OR REPLACE FUNCTION update_lessons_completed()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE platform_stats
  SET stat_value = (SELECT COUNT(*) FROM user_progress WHERE completed = true),
      updated_at = now()
  WHERE stat_name = 'total_lessons_completed';
END;
$$;

-- Trigger to update user count when profile is created
CREATE OR REPLACE FUNCTION trigger_update_user_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM update_user_count();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_user_count();

-- Trigger to update trades value when trade is created
CREATE OR REPLACE FUNCTION trigger_update_trades_value()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM update_trades_value();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_trade_created
  AFTER INSERT ON simulator_trades
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_trades_value();

-- Trigger to update lessons completed when progress is updated
CREATE OR REPLACE FUNCTION trigger_update_lessons_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.completed = true AND (OLD IS NULL OR OLD.completed = false) THEN
    PERFORM update_lessons_completed();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_lesson_completed
  AFTER INSERT OR UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_lessons_completed();

-- Initialize all stats with current values
SELECT update_user_count();
SELECT update_trades_value();
SELECT update_lessons_completed();