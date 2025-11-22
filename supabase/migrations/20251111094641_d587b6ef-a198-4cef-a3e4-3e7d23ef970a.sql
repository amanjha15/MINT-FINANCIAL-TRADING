-- Add DELETE policy for simulator_trades so users can delete their own trades during reset
CREATE POLICY "Users can delete own trades"
ON simulator_trades
FOR DELETE
USING (auth.uid() = user_id);