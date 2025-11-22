-- Add DELETE policy for challenge_participants so users can leave challenges
DROP POLICY IF EXISTS "Users can leave challenges" ON public.challenge_participants;

CREATE POLICY "Users can leave challenges"
ON public.challenge_participants
FOR DELETE
USING (auth.uid() = user_id);