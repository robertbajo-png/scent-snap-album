## Mål
1. Lyft fram textsökning som likvärdig skanningsmetod på startsidan
2. Hitta ett foto till parfymen automatiskt så även textsökta scans får en snygg bild i biblioteket

## Del 1 – Textsökning som tredje knapp

### `src/routes/index.tsx`
Ersätt den lilla "Sök manuellt"-länken nederst med en likvärdig knapp i huvudgriden:
```
[ 📷  Öppna kamera     ]   primär (gold gradient)
[ 📤  Ladda upp bild   ]   outline
[ 🔍  Sök på namn      ]   outline – NY, öppnar dialogen
```
Steg 2 i "How it works" uppdateras: "Ta ett foto eller skriv namnet…"

### `src/lib/i18n.tsx`
Ny nyckel `scan.search_by_name` (sv: "Sök på namn", en: "Search by name").

### `src/components/ManualLookupDialog.tsx`
- Tydligare placeholder: "t.ex. Dior Sauvage, Baccarat Rouge 540"
- Kort hint under fältet
- All befintlig logik behålls

## Del 2 – Automatisk bildhämtning

### Strategi
När `lookup-perfume` returnerat brand + name letar vi upp en flaskbild via Googles bildsök (gratis, ingen API-nyckel behövs) och spar URL:en på samma sätt som fotoflödet.

### Ny edge-funktion `find-perfume-image`
- Input: `{ brand, name }`
- Hämtar `https://www.google.com/search?tbm=isch&q=<brand>+<name>+perfume+bottle` med en vanlig User-Agent header
- Parsar ut första-tredje bildträff från HTML (Googles inbäddade JSON `["https://...jpg",h,w]`)
- Filtrerar bort små thumbnails och Google-egna URL:er
- Returnerar `{ imageUrl: string | null }`
- CORS-headers, felhantering, korta timeouts

### `ManualLookupDialog.tsx` – flöde
1. Anropa `lookup-perfume` (befintligt)
2. Anropa nya `find-perfume-image` med brand+name
3. Försök ladda ner bilden från sandboxen och spara i Storage-bucketen `perfume-images` (samma bucket som fotoflödet)
   - Om nedladdning blockeras av CORS sparar vi bara den externa URL:en direkt i `image_url`
4. Insert i `scans` med `image_url` satt
5. Navigera till `/scent/$id`

Visar en sekundär laddtext: "Hittar parfymen…" → "Hämtar bild…"

### Fallback
Om bildsök misslyckas: spara raden ändå med `image_url = null` (precis som idag) – ingen blockering av huvudflödet.

## Tekniska detaljer

**Varför Google-skrapning och inte t.ex. Unsplash/Pexels?**
- Unsplash/Pexels har inte specifika parfymbilder per produkt
- Google ger faktiska flaskbilder för varumärket
- Ingen API-nyckel krävs, lagligt för enstaka publika bilder, ratelimit hanteras genom att vi bara kör en sökning per scan

**Lagring:**
- I första iterationen sparar vi bara den externa URL:en i `scans.image_url`
- Det visas direkt i `<img>` på `/scent/$id` och i historiken eftersom kolumnen redan används så
- Inga DB-migrationer behövs

**Säkerhet & robusthet:**
- Edge-funktionen validerar input (brand + name som strängar, max 100 tecken vardera)
- Timeout 8s på Google-anropet
- Returnerar `{ imageUrl: null }` istället för fel om inget hittas
- User-Agent satt till en modern Chrome-sträng

**Filer som skapas/ändras:**
- ny: `supabase/functions/find-perfume-image/index.ts`
- ändras: `src/routes/index.tsx`, `src/components/ManualLookupDialog.tsx`, `src/lib/i18n.tsx`

Inga databasändringar, ingen ny tabell, ingen ny secret.

## Resultat
Användaren skriver "Sauvage" → AI hittar parfymen → bilden hämtas automatiskt → resultatsidan visas med flaskbild, beskrivning och reaktionsknappar. Identiskt med fotoskanning sett från användarens sida.