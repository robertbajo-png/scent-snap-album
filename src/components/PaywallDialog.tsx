import { useState } from "react";
import { Sparkles, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";

interface PaywallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional headline override (e.g. "Du har använt dina 3 gratis-skanningar") */
  reason?: string;
}

type Plan = "monthly" | "yearly";

const PLANS: Record<Plan, { priceId: string; label: string; price: string; sub: string; badge?: string }> = {
  monthly: {
    priceId: "premium_monthly",
    label: "Månad",
    price: "49 kr",
    sub: "/månad",
  },
  yearly: {
    priceId: "premium_yearly",
    label: "År",
    price: "399 kr",
    sub: "/år",
    badge: "Spara 32%",
  },
};

const FEATURES = [
  "Obegränsat med skanningar",
  "Full skanningshistorik",
  "AI-rekommendationer för dig",
  "Smakprofil & favoriter",
];

export function PaywallDialog({ open, onOpenChange, reason }: PaywallDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan>("yearly");
  const [showCheckout, setShowCheckout] = useState(false);
  const [starting, setStarting] = useState(false);

  const handleSubscribe = () => {
    if (!user) {
      onOpenChange(false);
      navigate({ to: "/login" });
      return;
    }
    setStarting(true);
    setShowCheckout(true);
    setStarting(false);
  };

  const handleClose = (next: boolean) => {
    if (!next) {
      setShowCheckout(false);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {showCheckout ? (
          <div className="max-h-[85vh] overflow-y-auto">
            <PaymentTestModeBanner />
            <div className="p-4">
              <StripeEmbeddedCheckout
                priceId={PLANS[plan].priceId}
                customerEmail={user?.email ?? undefined}
                userId={user?.id ?? undefined}
              />
            </div>
          </div>
        ) : (
          <div className="p-6">
            <DialogHeader>
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-gradient-luxe text-primary-foreground">
                <Sparkles className="h-6 w-6" />
              </div>
              <DialogTitle className="text-center font-display text-2xl mt-3">
                Uppgradera till Premium
              </DialogTitle>
              <DialogDescription className="text-center">
                {reason ?? "Få obegränsat med skanningar och full tillgång."}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {(Object.keys(PLANS) as Plan[]).map((key) => {
                const p = PLANS[key];
                const selected = plan === key;
                return (
                  <button
                    key={key}
                    onClick={() => setPlan(key)}
                    className={`relative rounded-2xl border p-4 text-left transition ${
                      selected
                        ? "border-primary bg-primary/5 shadow-elegant"
                        : "border-border bg-card/50 hover:bg-card"
                    }`}
                  >
                    {p.badge && (
                      <span className="absolute -top-2 right-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-background">
                        {p.badge}
                      </span>
                    )}
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {p.label}
                    </p>
                    <p className="mt-1 font-display text-2xl">{p.price}</p>
                    <p className="text-xs text-muted-foreground">{p.sub}</p>
                  </button>
                );
              })}
            </div>

            <ul className="mt-5 space-y-2">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Button
              size="lg"
              disabled={starting}
              onClick={handleSubscribe}
              className="mt-6 h-12 w-full rounded-2xl bg-gradient-luxe text-primary-foreground shadow-elegant hover:opacity-90"
            >
              {starting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Förbereder…
                </>
              ) : (
                <>Starta Premium</>
              )}
            </Button>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Avsluta när som helst. Återbetalning ej möjlig efter köp.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
