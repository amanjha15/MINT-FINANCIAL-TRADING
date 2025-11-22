-- Create table for rapid test game scores
CREATE TABLE public.rapid_test_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rapid_test_scores ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own scores
CREATE POLICY "Users can insert own scores"
ON public.rapid_test_scores
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow everyone to view all scores for leaderboard
CREATE POLICY "Anyone can view scores"
ON public.rapid_test_scores
FOR SELECT
TO authenticated
USING (true);

-- Create index for better query performance
CREATE INDEX idx_rapid_test_scores_user_id ON public.rapid_test_scores(user_id);
CREATE INDEX idx_rapid_test_scores_score ON public.rapid_test_scores(score DESC);
CREATE INDEX idx_rapid_test_scores_streak ON public.rapid_test_scores(streak DESC);