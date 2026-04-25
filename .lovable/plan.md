# Plan: Android-release via Capacitor (server URL-läge)

Mål: få ScentSnap körbar i Android Studio idag, redo för Play Store inom 2 veckor, utan att riva upp SSR-arkitekturen.

## Strategi

Capacitor-appen laddar `https://scent-snap-album.lovable.app` direkt i WebView istället för en bundlad statisk `index.html`. Det löser blockeraren `dist/client/index.html saknas` (filen genereras aldrig — appen är SSR på Cloudflare Worker, inte SPA). En kodbas, samma backend, native skal runt om.

För Play Store-policy lägger vi till native värde via Google Play Billing i fas 2 så det inte är "bara en webview-wrapper".

## Fas 1 — Android körbar (idag)

### 1. Uppdatera `capacitor.config.ts`
- Lägg till `server.url = "https://scent-snap-album.lovable.app"`
- Lägg till `server.androidScheme = "https"` (krävs för att cookies/Supabase-auth ska funka)
- Behåll `webDir: "dist/client"` som fallback (Capacitor kräver att fältet finns men använder det inte när `server.url` är satt)
- Behåll splash screen och status bar-config

### 2. Lägg till en byggsteg-platshållare
Skapa tom `dist/client/index.html` via ett npm-script så `cap sync` inte klagar — den används aldrig i runtime eftersom `server.url` tar över.

### 3. Uppdatera `docs/android.md`
- Nytt build-flöde: `bunx cap sync android` (ingen `bun run build` krävs längre för Android-bundeln)
- Förklara att appen laddar live från `scent-snap-album.lovable.app`
- Notera att uppdateringar av webbappen syns direkt i Android utan ny Play Store-release (utom när native plugins ändras)

### 4. Snabbtest
Du kör `bunx cap sync android && bunx cap open android` på din Windows-maskin → Run i emulator → ska visa inloggningsskärmen från live-sajten.

## Fas 2 — Google Play Billing (vecka 2)

Görs i en separat tur när Fas 1 funkar i emulator. Översikt:

### 4. Lägg till Capacitor Play Billing-plugin
- `@capgo/capacitor-purchases` eller `cordova-plugin-purchase` (vi väljer i den turen baserat på Capacitor 8-kompatibilitet)
- Skapa premium-produkt i Google Play Console (`scentsnap_premium_monthly`)

### 5. Ny edge function `verify-play-purchase`
- Tar emot purchase token från Android-appen
- Verifierar mot Google Play Developer API
- Skriver till samma `subscriptions`-tabell som Stripe-flödet redan använder
- Kräver Google service account-nyckel som secret

### 6. UI-gren i `PaywallDialog`
- `Capacitor.isNativePlatform()` → visa "Köp via Google Play"-knapp som triggar Play Billing
- Annars (web) → behåll Stripe-knappen
- Gemensam `subscriptions`-tabell betyder att premium-status syns på båda plattformarna

## Tekniska detaljer

**Filer som ändras i Fas 1:**
- `capacitor.config.ts` — server.url + androidScheme
- `docs/android.md` — uppdaterat build-flöde
- `package.json` — lägg till `cap:sync` script som skapar tom `dist/client/index.html` + kör `cap sync android`

**Inga ändringar i:**
- TanStack Start-appen (alla routes, server functions, middleware)
- Edge functions
- Databasen
- Stripe-flödet (fortsätter funka för web)

**Capacitor server.url-konfiguration:**
```ts
server: {
  url: "https://scent-snap-album.lovable.app",
  androidScheme: "https",
  cleartext: false,
}
```

**Risker & mitigations:**
- *Auth-cookies*: löses med `androidScheme: "https"` så WebView delar origin korrekt med live-sajten
- *Offline*: appen kräver internet — visar standardfel om frånkopplad (acceptabelt eftersom alla features kräver backend ändå)
- *Play Store-policy*: Google kräver native värde — täcks av Play Billing i Fas 2 + redan implementerade native plugins (status bar, splash, hardware back, app lifecycle)
- *Lovable-deployer*: när du publicerar ny webbversion uppdateras Android-appen automatiskt nästa gång användaren öppnar den. Native-ändringar (plugins, ikoner) kräver dock ny `.aab` i Play Console.

## Vad du gör efter att jag implementerat Fas 1

1. `git pull`
2. `bun install`
3. `bun run cap:sync` (det nya scriptet)
4. `bunx cap open android`
5. Tryck Run ▶ i Android Studio → välj emulator eller ansluten telefon
6. Säg till mig när det funkar, så kör vi Fas 2
