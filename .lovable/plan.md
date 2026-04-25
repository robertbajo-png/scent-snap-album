## Mål
Lägg till ett admin-roll-system så att utvalda admins kan logga in (vanlig inloggning) och manuellt ge/ta bort Premium åt valfri användare — utan att gå via Stripe.

## Översikt

1. **Roller i databasen** (säker pattern, separat tabell):
   - Enum `app_role` med `admin` och `user`.
   - Tabell `user_roles (id, user_id, role, created_at)` med RLS.
   - Security definer-funktion `has_role(_user_id, _role)` för att slippa rekursiva RLS-problem.
   - RLS på `user_roles`: alla auth-användare kan läsa sin egen rad; bara admins (`has_role(auth.uid(),'admin')`) kan läsa alla / skriva.

2. **Premium via "manual grant"** istället för Stripe:
   - Ny tabell `manual_premium_grants (user_id PK, granted_by, granted_at, expires_at nullable, note)` med RLS (bara admin skriver, användaren själv + admin kan läsa).
   - Uppdatera `has_active_subscription(user_uuid, check_env)` så den ALSO returnerar `true` om det finns en rad i `manual_premium_grants` för användaren där `expires_at IS NULL OR expires_at > now()`. Detta gör att hela appen (useQuota, gating m.m.) automatiskt respekterar manuellt beviljat Premium utan vidare ändringar.

3. **Första admin**:
   - Migration som sätter in nuvarande inloggad användare (robert.bajo@gmail.com → user_id `5eb753fd-bfa3-49c7-84bd-dfae46d569ba`, syns i auth-loggarna) som admin. Övriga admins kan sedan utses från admin-UI:t.

4. **Admin-UI** (`/admin`):
   - Skyddad route. Render-guard: kollar `has_role(user.id, 'admin')` via RPC. Icke-admin → redirect till `/`.
   - Funktioner:
     - Sökfält: hitta användare på e-post (server function med `supabaseAdmin`, returnerar `{id, email, is_premium, has_grant, role}`).
     - Lista nuvarande Premium-användare (manuella grants + aktiva Stripe-prenumerationer).
     - Knappar per rad: **Grant Premium** (valfritt utgångsdatum), **Revoke Premium** (tar bort grant-raden), **Make admin / Remove admin**.
   - Alla mutationer går via TanStack `createServerFn` med `requireSupabaseAuth` + servern dubbelkollar `has_role(userId, 'admin')` innan något görs (admin-skydd både i UI och på servern).

5. **Liten UX-touch i `/me`**:
   - Om användaren är admin, visa en diskret "Admin"-länk till `/admin` i menyn.
   - Om Premium kommer från manual grant: visa "Premium (granted)" istället för "Manage subscription"-knappen (Stripe-portalen finns inte).

## Filer att skapa/ändra

**Nya filer:**
- `supabase/migrations/<ts>_admin_roles.sql` — enum, `user_roles`, `manual_premium_grants`, RLS, `has_role`, uppdaterad `has_active_subscription`, seed första admin.
- `src/routes/admin.tsx` — admin-sida (skyddad).
- `src/lib/admin.functions.ts` — server functions: `searchUsers`, `grantPremium`, `revokePremium`, `setAdminRole`, `listPremiumUsers`.
- `src/hooks/useIsAdmin.ts` — liten hook som kollar admin-status.

**Ändrade filer:**
- `src/routes/me.tsx` — admin-länk + anpassad text när Premium kommer från grant.
- `src/lib/i18n.tsx` — nya strängar (sv/en) för admin-sidan.

## Tekniska detaljer

```sql
create type public.app_role as enum ('admin','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role=_role)
$$;

create table public.manual_premium_grants (
  user_id uuid primary key,
  granted_by uuid not null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  note text
);
alter table public.manual_premium_grants enable row level security;
-- policies: select own OR admin; insert/update/delete admin only

-- update has_active_subscription to OR-in manual grant
```

Server-side admin-check (i varje server function):
```ts
const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
if (!isAdmin) throw new Error('Forbidden');
```

## Säkerhet
- Roller ALDRIG på `profiles`-tabellen.
- All admin-logik dubbelvalideras serverside med `has_role` — UI-guard räcker inte.
- `manual_premium_grants` RLS: bara admin kan skriva; användaren själv kan läsa sin egen rad (för transparens).
- Inga klientnycklar exponerade — `supabaseAdmin` används bara i server functions för att slå upp e-postadresser i `auth.users`.
