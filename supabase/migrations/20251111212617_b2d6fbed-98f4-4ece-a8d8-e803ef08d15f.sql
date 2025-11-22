-- Update the function to count trades instead of sum values
CREATE OR REPLACE FUNCTION update_trades_value()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE platform_stats
  SET stat_value = (SELECT COUNT(*) FROM simulator_trades),
      updated_at = now()
  WHERE stat_name = 'total_trades_value';
END;
$$;

-- Re-initialize with current count
SELECT update_trades_value();