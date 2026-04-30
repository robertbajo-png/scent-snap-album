
-- Profiles: username + is_public
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- Username constraints
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_format
  CHECK (username IS NULL OR username ~ '^[a-z0-9_-]{3,20}$');

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

-- Scans: tried status
ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS tried boolean NOT NULL DEFAULT false;

-- Helpful index for publik query
CREATE INDEX IF NOT EXISTS scans_user_owned_idx ON public.scans (user_id, owned) WHERE owned = true;
CREATE INDEX IF NOT EXISTS scans_user_reaction_idx ON public.scans (user_id, reaction);

-- Public profile RPC: returns username + counts only
CREATE OR REPLACE FUNCTION public.get_public_profile(_username text)
RETURNS TABLE (
  username text,
  owned_count integer,
  want_count integer,
  favorite_count integer,
  tried_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.username,
    (SELECT count(*)::int FROM public.scans s WHERE s.user_id = p.id AND s.owned = true),
    (SELECT count(*)::int FROM public.scans s WHERE s.user_id = p.id AND s.reaction = 'want'),
    (SELECT count(*)::int FROM public.scans s WHERE s.user_id = p.id AND s.is_favorite = true),
    (SELECT count(*)::int FROM public.scans s WHERE s.user_id = p.id AND s.tried = true)
  FROM public.profiles p
  WHERE lower(p.username) = lower(_username)
    AND p.is_public = true;
$$;

-- Public collection RPC: only safe columns
CREATE OR REPLACE FUNCTION public.get_public_collection(_username text)
RETURNS TABLE (
  id uuid,
  brand text,
  name text,
  image_url text,
  owned boolean,
  reaction text,
  is_favorite boolean,
  tried boolean,
  bottle_size text,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id,
    s.brand,
    s.name,
    s.image_url,
    s.owned,
    s.reaction,
    s.is_favorite,
    s.tried,
    s.bottle_size,
    s.updated_at
  FROM public.scans s
  JOIN public.profiles p ON p.id = s.user_id
  WHERE lower(p.username) = lower(_username)
    AND p.is_public = true
    AND (s.owned = true OR s.reaction IN ('like','want') OR s.is_favorite = true OR s.tried = true)
  ORDER BY s.updated_at DESC;
$$;

-- Allow anon + authenticated to call the RPCs
GRANT EXECUTE ON FUNCTION public.get_public_profile(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_collection(text) TO anon, authenticated;
