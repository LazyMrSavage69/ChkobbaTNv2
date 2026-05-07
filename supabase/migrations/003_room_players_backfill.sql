-- Backfill migration for older projects missing room_players columns/constraints
ALTER TABLE public.room_players
ADD COLUMN IF NOT EXISTS team INTEGER DEFAULT 0;

ALTER TABLE public.room_players
ADD COLUMN IF NOT EXISTS is_ready BOOLEAN DEFAULT false;

ALTER TABLE public.room_players
ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.room_players
ALTER COLUMN team SET DEFAULT 0;

ALTER TABLE public.room_players
ALTER COLUMN is_ready SET DEFAULT false;

ALTER TABLE public.room_players
ALTER COLUMN joined_at SET DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'room_players_room_id_user_id_key'
  ) THEN
    ALTER TABLE public.room_players
    ADD CONSTRAINT room_players_room_id_user_id_key UNIQUE (room_id, user_id);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
