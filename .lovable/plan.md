## Lägg till `?native=1`-flagga för att förhandsgranska Android-vyn i webbläsaren

Gör så att du kan tvinga appen att bete sig som om den körs i Capacitor-skalet, direkt här i Lovable-preview, genom att lägga till `?native=1` i URL:en.

### Vad ändras

**`src/lib/native.ts`** — uppdatera `isNativePlatform()`:
- Returnera `true` om `Capacitor.isNativePlatform()` är `true` **eller** om URL:en innehåller `?native=1` **eller** om `localStorage.getItem("force-native") === "1"`.
- Om `?native=1` ses i URL:en, sätt även `localStorage.force-native = "1"` så att flaggan håller i sig mellan navigeringar (TanStack Router byter ofta query-string mellan rutter).
- Stöd även `?native=0` för att återställa (rensar localStorage-flaggan).
- SSR-säker — kollar `typeof window` först.

### Hur du använder den

I preview, lägg till `?native=1` i URL:en en gång:
```
https://id-preview--…lovable.app/?native=1
```

Då ska du direkt se:
- "Premium kommer snart till Android"-bannern högst upp på `/` och `/me`
- "5 av 5 skanningar kvar idag" istället för 3
- Paywall-dialogen visar "kommer snart"-vyn istället för Stripe-checkout
- Inget uppgraderingskort på Min sida

För att gå tillbaka till webbläget: `?native=0` (eller rensa site data).

### Att tänka på

- Detta är ett dev-hjälpmedel — flaggan påverkar bara klientsidan (UI). Den ändrar inte kvotlogiken på servern eller någon faktisk Capacitor-funktion.
- Helt säker att lämna kvar i koden; en vanlig användare hittar aldrig `?native=1`-flaggan av en slump, och den bara *aktiverar* en mer begränsad vy (färre features), så det finns ingen säkerhetsrisk.
- I riktiga Android-appen fortsätter `Capacitor.isNativePlatform()` vara den sanna källan — flaggan är bara ett extra OR-villkor.
