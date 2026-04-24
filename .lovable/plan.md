## Mål

Lägg till en betalmodell på Scent Snap där:
- **Gratis**: 3 identifieringar per dygn (foto-skanning + namnsökning räknas tillsammans)
- **Premium**: Obegränsat antal identifieringar + tillgång till "For You"-rekommendationer
- **Pris**: 49 kr/månad eller 399 kr/år (sparar ca 32%)
- Betalningar hanteras av **Lovable Built-in Stripe Payments** (inget eget Stripe-konto behövs, sandbox direkt)

Krav: Lovable Pro-plan måste vara aktiv för att kunna aktivera betalningar.

---

## Användarflöde

```text
1. Inloggad gratisanvändare öppnar appen
   → Räknare visas: "2 av 3 sökningar kvar idag" (subtil, under hero)

2. Användaren skannar/söker → räknaren minskar

3. Vid 0 kvar och nytt försök:
   → Server returnerar 402 + paywall-modal triggas
   → Modalen visar: "Du har nått dagens gräns" + två planer + "Uppgradera"
   → Klick → Stripe Checkout (testläge initialt) → tillbaka till appen
   → Webhook sätter premium → räknaren ersätts med "Premium ∞"

4. Premiumanvändare:
   → Ingen räknare, obegränsat
   → "For You"-fliken är tillgänglig
   → /me visar Premium-badge + "Hantera prenumeration" (Stripe billing portal)

5. Gratisanvändare som klickar "For You":
   → Mjuk paywall: "For You är en Premium-funktion" + uppgradera-knapp
```

---

## Databasändringar

### Ny tabell `subscriptions`
Lagrar användarens prenumerationsstatus från Stripe.

```text
subscriptions
- user_id (uuid, PK, FK till auth.users)
- stripe_customer_id (text)
- stripe_subscription_id (text, nullable)
- plan (text: 'monthly' | 'yearly' | null)
- status (text: 'active' | 'trialing' | 'canceled' | 'past_due' | null)
- current_period_end (timestamptz, nullable)
- updated_at (timestamptz)
```

RLS:
- SELECT: egen rad (`auth.uid() = user_id`)
- INSERT/UPDATE: endast service role (via webhook)

### Ny SQL-funktion `get_daily_scan_count(user_id)`
Räknar antal scans skapade av användaren idag (i UTC). Används av server för kvotcheck. SECURITY DEFINER så den fungerar oavsett RLS.

### Ingen ändring i `scans`-tabellen
Vi räknar via `created_at >= today` direkt. Sparar oss en kolumn.

---

## Server-side – kvotvakt (NYTT)

Skapa **TanStack server function** `checkScanQuota` (i `src/lib/quota.functions.ts`):
- Använder `requireSupabaseAuth`-middleware
- Kollar `subscriptions` → om `status='active'` och `current_period_end > now()` → returnera `{ allowed: true, remaining: Infinity, premium: true }`
- Annars räkna scans idag → returnera `{ allowed: count < 3, remaining: 3 - count, premium: false }`

Anropas:
1. **Innan** `identify-perfume` (i `src/routes/index.tsx` `scan()`)
2. **Innan** `lookup-perfume` (i `ManualLookupDialog.tsx` `submit()`)
3. **Efter mount** för att visa räknaren på startsidan

Om `allowed: false` → öppna `<PaywallDialog />` istället för att fortsätta.

> Anmärkning: Klient-sidans check är UX. Den **riktiga** spärren är server-side i kvotfunktionen — användaren kan inte kringgå genom att manipulera klienten eftersom AI-anropen sker via samma serverfunktioner.

---

## Stripe-integration

### Aktivering
1. Kör `payments--enable_stripe_payments` (skapar testmiljö direkt)
2. Skapa två produkter via `batch_create_product`:
   - **Premium Monthly** – 49 SEK/månad, recurring
   - **Premium Yearly** – 399 SEK/år, recurring
3. Skattehantering: **Tax calculation only** (option 2) — Stripe räknar och samlar in svensk moms, vi hanterar deklaration själva (enklast i v1, kan uppgraderas till full compliance senare)

### Server routes som behövs
- `src/routes/api/checkout.ts` – Skapar Stripe Checkout Session, returnerar URL
- `src/routes/api/portal.ts` – Skapar Stripe Billing Portal-session (för "Hantera prenumeration")
- `src/routes/api/public/stripe-webhook.ts` – Tar emot Stripe-events:
  - `checkout.session.completed` → upsert till `subscriptions` (status=active)
  - `customer.subscription.updated` → uppdatera status + period_end
  - `customer.subscription.deleted` → status=canceled
  - Verifierar webhook-signatur med `STRIPE_WEBHOOK_SECRET`

---

## UI-ändringar

### `src/routes/index.tsx`
- Lägg till räknarchip ovanför hero-bilden:
  ```text
  [ ✨ 2 av 3 dagliga sökningar kvar ]    (gratis)
  [ ✨ Premium · obegränsat ]              (premium, gold)
  ```
- Före `scan()` och i `ManualLookupDialog`: kalla `checkScanQuota` först
- Om `!allowed` → visa `<PaywallDialog />` istället

### Ny komponent `src/components/PaywallDialog.tsx`
- Vacker dialog matchande appens stil (gold gradient, rundade hörn)
- Två plankort: Monthly (49 kr) / Yearly (399 kr, "Spara 32%")
- "Uppgradera"-knapp → kallar `/api/checkout` med valt plan-id → redirectar till Stripe
- Stänger automatiskt om användaren redan är premium

### `src/components/ScanQuotaBadge.tsx` (NYTT)
Liten chip-komponent som visar kvarvarande sökningar eller "Premium ∞". Används på startsidan och eventuellt i header.

### `src/routes/me.tsx`
- Lägg till sektion "Prenumeration" mellan stats och språkväljaren:
  - Gratis: "Free plan · 3 sökningar/dag" + "Uppgradera till Premium"-knapp
  - Premium: Gold-badge "✨ Premium" + plan + förnyas-datum + "Hantera prenumeration"-knapp (öppnar Stripe portal)

### `src/routes/for-you.tsx`
- Om inte premium → visa låst version med blur-overlay + "Lås upp For You med Premium"-knapp som öppnar `<PaywallDialog />`

### `src/lib/i18n.tsx`
Nya nycklar (sv + en):
- `paywall.title`, `paywall.subtitle`, `paywall.daily_limit_reached`
- `paywall.monthly`, `paywall.yearly`, `paywall.save_percent`
- `paywall.upgrade_cta`, `paywall.unlimited_scans`, `paywall.for_you_unlocked`
- `quota.remaining` ("{n} av 3 sökningar kvar idag"), `quota.premium_unlimited`
- `me.subscription`, `me.manage_subscription`, `me.upgrade_to_premium`, `me.premium_active`, `me.renews`
- `for_you.locked_title`, `for_you.locked_sub`

---

## Filer som skapas/ändras

**Nya filer:**
- `src/lib/quota.functions.ts` – server function `checkScanQuota` + hook `useScanQuota`
- `src/components/PaywallDialog.tsx`
- `src/components/ScanQuotaBadge.tsx`
- `src/routes/api/checkout.ts` – Stripe checkout endpoint
- `src/routes/api/portal.ts` – Stripe billing portal endpoint
- `src/routes/api/public/stripe-webhook.ts` – Stripe webhook handler

**Ändrade filer:**
- `src/routes/index.tsx` – kvotcheck före skanning + badge
- `src/components/ManualLookupDialog.tsx` – kvotcheck före lookup
- `src/routes/me.tsx` – prenumerationssektion
- `src/routes/for-you.tsx` – premium-lock
- `src/lib/i18n.tsx` – nya översättningar

**Migrations:**
- Skapa `subscriptions`-tabell med RLS
- Skapa `get_daily_scan_count`-funktion

---

## Implementationsordning (3 etapper)

**Etapp 1 – Aktivera Stripe & skapa produkter**
1. Kör `payments--enable_stripe_payments`
2. Skapa Monthly + Yearly-produkter
3. Verifiera att `STRIPE_SECRET_KEY` och `STRIPE_WEBHOOK_SECRET` finns

**Etapp 2 – Backend (databas + kvot + Stripe-routes)**
4. Migration: `subscriptions`-tabell + `get_daily_scan_count`
5. Skapa `quota.functions.ts`
6. Skapa de tre Stripe server routes (checkout, portal, webhook)
7. Testa webhook med Stripe CLI / sandbox-event

**Etapp 3 – Frontend (paywall + badge + UI)**
8. Skapa `PaywallDialog` och `ScanQuotaBadge`
9. Koppla in kvotcheck i `index.tsx` och `ManualLookupDialog.tsx`
10. Uppdatera `/me` med prenumerationssektion
11. Lås `/for-you` bakom premium
12. Lägg till alla i18n-nycklar

---

## Edge-case-hantering

- **Kvoten räknar bara lyckade sökningar?** Nej — vi räknar `scans`-rader. Om AI-anropet misslyckas blir det ingen rad → ingen kvotförbrukning. Snäll mot användaren.
- **Användare i annan tidszon?** "Idag" definieras i UTC i v1 (enklast). Kan flyttas till användarens tidszon senare om det blir feedback.
- **Premium upphör mitt i månaden?** Webhook hanterar `subscription.deleted` → status=canceled. Användaren får dock ha kvar premium tills `current_period_end`.
- **Avbryter prenumeration?** Stripe Billing Portal hanterar allt. Vi får webhook när det händer.

---

## Vad som INTE ingår (för framtiden)

- Trial-period (kan läggas till genom Stripe trial-config)
- Familjekonton / delade prenumerationer
- Kampanjkoder
- Statistik/export som premiumförmån (kan läggas till senare på begäran)
- Gå live med riktiga betalningar — sandbox först, sedan claim Stripe-konto i Lovables UI när du är redo

---

## Resultat

Användaren får 3 gratis identifieringar per dag, ser tydligt hur många som finns kvar, och möts av en snygg paywall vid 4:e försöket. Uppgradering sker sömlöst via Stripe Checkout, premium aktiveras automatiskt via webhook, och för-betalda användare får obegränsade sökningar plus AI-rekommendationer i "For You". Allt hanteras av Lovables inbyggda Stripe-integration utan att du behöver eget Stripe-konto för att börja testa.