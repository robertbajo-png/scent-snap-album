import { Sparkles } from "lucide-react";
import { isNativePlatform } from "@/lib/native";

/**
 * Banner shown on Android (Capacitor) only, while Google Play Billing
 * isn't wired up yet. Lets users know premium is on its way and that they
 * can upgrade on the web with the same account in the meantime.
 *
 * Renders nothing on web.
 */
export function AndroidPremiumBanner() {
  if (!isNativePlatform()) return null;

  return (
    <div className="mb-3 flex items-start gap-3 rounded-2xl border border-gold/30 bg-gradient-luxe/10 px-4 py-3">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.7} />
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight">
          Premium kommer snart till Android
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Köp via Google Play läggs till inom kort. Under tiden kan du
          uppgradera på webben med samma konto — premium aktiveras
          automatiskt här i appen.
        </p>
      </div>
    </div>
  );
}
