
ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS reaction text CHECK (reaction IN ('like','want','dislike')),
  ADD COLUMN IF NOT EXISTS plain_description text;

CREATE INDEX IF NOT EXISTS scans_reaction_idx ON public.scans(user_id, reaction);
