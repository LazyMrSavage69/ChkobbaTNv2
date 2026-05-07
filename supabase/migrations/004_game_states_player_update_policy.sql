-- Allow all players in a room to update that room's game state.
-- This fixes turn lock when non-host players make a move.
DROP POLICY IF EXISTS "Host can update game states" ON public.game_states;

CREATE POLICY "Room players can update game states"
  ON public.game_states
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.room_players rp
      WHERE rp.room_id = game_states.room_id
        AND rp.user_id = auth.uid()
    )
  );

NOTIFY pgrst, 'reload schema';
