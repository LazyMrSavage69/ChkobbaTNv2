-- Backfill migration for older projects missing room privacy/join code columns
ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS join_code TEXT;

UPDATE public.rooms
SET join_code = upper(substring(md5(id::text || random()::text), 1, 6))
WHERE join_code IS NULL OR join_code = '';

WITH duplicate_codes AS (
  SELECT id, row_number() OVER (PARTITION BY join_code ORDER BY created_at, id) AS rn
  FROM public.rooms
)
UPDATE public.rooms r
SET join_code = upper(substring(md5(r.id::text || random()::text), 1, 6))
FROM duplicate_codes d
WHERE r.id = d.id
  AND d.rn > 1;

ALTER TABLE public.rooms
ALTER COLUMN join_code SET DEFAULT upper(substring(md5(random()::text), 1, 6));

ALTER TABLE public.rooms
ALTER COLUMN join_code SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'rooms_join_code_key'
  ) THEN
    ALTER TABLE public.rooms
    ADD CONSTRAINT rooms_join_code_key UNIQUE (join_code);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
