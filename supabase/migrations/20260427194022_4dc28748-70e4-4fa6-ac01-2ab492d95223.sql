ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS owned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bottle_size TEXT;

CREATE INDEX IF NOT EXISTS idx_scans_user_owned
  ON public.scans (user_id, owned)
  WHERE owned = true;