## Vad vi bygger

En **opt-in publik parfymhylla** så att andra kan se vad en användare äger, vill ha och gillar — utan att exponera någon personlig info. Plus en ny status **"Har testat"** vid sidan av befintliga.

### Funktioner

1. **Username** (separat från display_name och email) — krävs för publik profil, unikt, lowercase a–z/0–9/`_`/`-`.
2. **Toggle "Gör min parfymhylla publik"** under `/me`. Default = privat.
3. **Publik profilsida** på `/u/$username` som vem som helst (även utloggad) kan besöka.
4. **Ny status "Har testat"** (`tried`) — utöver Äger / Vill ha / Favorit / Gillar / Ogillar.

### Statusmodell — så här mappar vi mot dagens schema

Idag finns två oberoende fält per scan:
- `owned` (boolean) → **Äger**
- `reaction` (`like` | `want` | `dislike` | null) → **Gillar / Vill ha / Ogillar**
- `is_favorite` (boolean) sätts idag automatiskt när reaction = like/want → **Favorit**

Vi lägger till:
- `tried` (boolean, default false) → **Har testat**

Det betyder att en parfym kan ha flera statusar samtidigt (t.ex. "Äger" + "Favorit" + "Har testat"), vilket matchar verkligheten. Befintlig data påverkas inte.

### Vad publika profilen visar

```text
/u/{username}
┌─────────────────────────────────┐
│  @username                      │  ← bara username, ingen email/namn
│  "X parfymer i hyllan"          │
├─────────────────────────────────┤
│  ÄGER (n)                       │
│  [parfym] [parfym] [parfym] …  │
│                                 │
│  VILL HA (n)                    │
│  [parfym] [parfym] …            │
│                                 │
│  TOP 5 FAVORITER                │
│  [parfym] [parfym] …            │
└─────────────────────────────────┘
```

Visas **aldrig**: email, display_name, riktigt namn, plats, datum för konto, betyg, anteckningar, ogillade parfymer.

### Säkerhet (RLS)

Detta är känsligt — en bugg = läcka. Mönster:

- `profiles` får ny kolumn `username` (text, unique, nullable) och `is_public` (boolean, default false).
- `scans`-tabellen behåller sina nuvarande `scans_select_own`-policies oförändrade.
- Vi skapar en **SECURITY DEFINER-funktion** `get_public_collection(_username text)` som returnerar endast tillåtna kolumner (brand, name, image_url, owned, reaction, is_favorite, tried) för användare där `is_public = true`. Funktionen exponerar ingen email/display_name/user_id.
- Vi skapar en motsvarande `get_public_profile(_username text)` som returnerar `{ username, owned_count, want_count, favorite_count }`.
- Klienten anropar dessa via `supabase.rpc(...)` — **aldrig** direkt SELECT på `scans` eller `profiles` för annan användare.

### Filer som ändras / skapas

**Migration (ny)**
- Lägg till `profiles.username` (text, unique, nullable, citext-likt mönster via check-constraint på regex `^[a-z0-9_-]{3,20}$`).
- Lägg till `profiles.is_public` (boolean, default false, not null).
- Lägg till `scans.tried` (boolean, default false, not null).
- Skapa `public.get_public_profile(_username text)` (SECURITY DEFINER, stable).
- Skapa `public.get_public_collection(_username text)` (SECURITY DEFINER, stable, returnerar bara icke-känsliga kolumner).
- Index på `lower(username)` och på `(user_id, owned)`/`(user_id, reaction)` för snabb publik query.

**Frontend**
- `src/routes/me.tsx`: ny sektion "Publik profil" med
  - input för username (validering + check om upptagen),
  - toggle "Gör min parfymhylla publik",
  - länk "Visa min publika profil →" när aktiv.
- `src/routes/u.$username.tsx` (ny): publik profilsida, ingen auth krävs, använder rpc.
- `src/routes/scent.$id.tsx`: lägg till "Har testat"-toggle bredvid ägar-toggeln.
- `src/components/ReactionPicker.tsx`: oförändrad (reaction är som idag).
- `src/lib/types.ts`: lägg till `tried: boolean` på `ScanRow`.
- `src/lib/i18n.tsx`: nya nycklar i **både sv och en**:
  - `status.tried`, `me.public_profile_title`, `me.public_profile_desc`, `me.username_label`, `me.username_taken`, `me.username_invalid`, `me.public_toggle`, `me.view_public`, `public.owns`, `public.wants`, `public.favorites`, `public.empty`, `public.private`, `public.not_found`.

### Tekniska detaljer

- **Username-validering**: regex `^[a-z0-9_-]{3,20}$`, unique index `lower(username)`. UI normaliserar till lowercase.
- **Toggle-logik på `/me`**: man kan inte sätta `is_public=true` utan att först välja username. UI gråar ut toggeln tills username är satt och sparat.
- **Publik route**: `src/routes/u.$username.tsx` har `head()` med `<title>@username — ScentSnap</title>` och `og:title`. Om användaren saknas eller `is_public=false` → snäll "Den här profilen är privat"-vy (vi avslöjar inte vilket av de två som gäller, för att inte läcka existens).
- **Edge case**: när användare ändrar `is_public` från true → false ska den publika sidan omedelbart sluta visa data (RPC returnerar tomt). Inget cache-problem eftersom vi inte cachar.
- **Inget username i URL-länkar förrän publik**: en privat profil har ingen publik URL.

### Vad vi INTE gör nu (kan komma senare)

- Följa-funktion / följare-listor.
- Söka efter andra användare.
- Kommentarer eller likes på andras hyllor.
- Delningslänkar med preview-bild (kan adderas via og:image på `/u/$username` senare).
