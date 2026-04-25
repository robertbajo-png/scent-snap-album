-- 1. Role enum + user_roles table
do $$ begin
  create type public.app_role as enum ('admin','user');
exception when duplicate_object then null; end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- security definer to avoid recursive RLS
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

drop policy if exists user_roles_select_own on public.user_roles;
create policy user_roles_select_own on public.user_roles
  for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

drop policy if exists user_roles_admin_all on public.user_roles;
create policy user_roles_admin_all on public.user_roles
  for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- 2. Manual premium grants
create table if not exists public.manual_premium_grants (
  user_id uuid primary key,
  granted_by uuid not null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  note text
);

alter table public.manual_premium_grants enable row level security;

drop policy if exists grants_select_own_or_admin on public.manual_premium_grants;
create policy grants_select_own_or_admin on public.manual_premium_grants
  for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

drop policy if exists grants_admin_all on public.manual_premium_grants;
create policy grants_admin_all on public.manual_premium_grants
  for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- 3. Update has_active_subscription to also honor manual grants
create or replace function public.has_active_subscription(user_uuid uuid, check_env text default 'sandbox')
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from public.subscriptions
      where user_id = user_uuid
        and environment = check_env
        and (
          (status in ('active','trialing') and (current_period_end is null or current_period_end > now()))
          or (status = 'canceled' and current_period_end > now())
        )
    )
    or exists (
      select 1 from public.manual_premium_grants
      where user_id = user_uuid
        and (expires_at is null or expires_at > now())
    );
$$;

-- 4. Seed first admin
insert into public.user_roles (user_id, role)
values ('5eb753fd-bfa3-49c7-84bd-dfae46d569ba', 'admin')
on conflict (user_id, role) do nothing;
