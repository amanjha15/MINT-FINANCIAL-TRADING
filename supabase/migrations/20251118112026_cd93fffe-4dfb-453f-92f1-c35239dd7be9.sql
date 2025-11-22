-- Add initial_value and streak_count columns to challenge_participants
ALTER TABLE public.challenge_participants
ADD COLUMN IF NOT EXISTS initial_value numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak_count integer DEFAULT 0;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user_challenge 
ON public.challenge_participants(user_id, challenge_id);