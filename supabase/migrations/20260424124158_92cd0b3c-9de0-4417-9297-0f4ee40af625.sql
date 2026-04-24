-- Fix function search path
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Restrict storage listing: drop broad public select, replace with object-level access
drop policy if exists "perfume_images_public_read" on storage.objects;

-- Public can still GET specific files via direct URL (objects in public buckets are accessible by URL),
-- but listing requires owner.
create policy "perfume_images_owner_list" on storage.objects
for select to authenticated
using (bucket_id = 'perfume-images' and (storage.foldername(name))[1] = auth.uid()::text);
