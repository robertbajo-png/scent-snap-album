-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles for delete to authenticated using (auth.uid() = id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- SCANS
create table public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_url text,
  brand text,
  name text,
  perfumer text,
  year int,
  gender text,
  description text,
  top_notes text[] default '{}'::text[],
  heart_notes text[] default '{}'::text[],
  base_notes text[] default '{}'::text[],
  accords jsonb default '[]'::jsonb,
  longevity int,
  sillage int,
  occasions text[] default '{}'::text[],
  seasons text[] default '{}'::text[],
  similar_perfumes jsonb default '[]'::jsonb,
  confidence numeric,
  raw_ai jsonb,
  user_rating int,
  user_notes text,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.scans enable row level security;

create policy "scans_select_own" on public.scans for select to authenticated using (auth.uid() = user_id);
create policy "scans_insert_own" on public.scans for insert to authenticated with check (auth.uid() = user_id);
create policy "scans_update_own" on public.scans for update to authenticated using (auth.uid() = user_id);
create policy "scans_delete_own" on public.scans for delete to authenticated using (auth.uid() = user_id);

create trigger scans_set_updated_at
before update on public.scans
for each row execute function public.set_updated_at();

create index scans_user_created_idx on public.scans(user_id, created_at desc);

-- TASTE PROFILE
create table public.taste_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  favorite_accords text[] default '{}'::text[],
  disliked_accords text[] default '{}'::text[],
  favorite_notes text[] default '{}'::text[],
  disliked_notes text[] default '{}'::text[],
  preferred_seasons text[] default '{}'::text[],
  preferred_intensity text,
  gender_preference text,
  notes text,
  updated_at timestamptz not null default now()
);
alter table public.taste_profile enable row level security;

create policy "taste_select_own" on public.taste_profile for select to authenticated using (auth.uid() = user_id);
create policy "taste_insert_own" on public.taste_profile for insert to authenticated with check (auth.uid() = user_id);
create policy "taste_update_own" on public.taste_profile for update to authenticated using (auth.uid() = user_id);
create policy "taste_delete_own" on public.taste_profile for delete to authenticated using (auth.uid() = user_id);

create trigger taste_set_updated_at
before update on public.taste_profile
for each row execute function public.set_updated_at();

-- STORAGE
insert into storage.buckets (id, name, public) values ('perfume-images', 'perfume-images', true);

create policy "perfume_images_public_read" on storage.objects for select to public using (bucket_id = 'perfume-images');
create policy "perfume_images_user_upload" on storage.objects for insert to authenticated with check (bucket_id = 'perfume-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "perfume_images_user_update" on storage.objects for update to authenticated using (bucket_id = 'perfume-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "perfume_images_user_delete" on storage.objects for delete to authenticated using (bucket_id = 'perfume-images' and (storage.foldername(name))[1] = auth.uid()::text);
