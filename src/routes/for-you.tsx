import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/for-you")({
  component: ForYouPage,
});

interface Recommendation {
  brand: string;
  name: string;
  description: string;
  why: string;
  top_accords: string[];
  gender: string;
}

function ForYouPage() {
  const { user, loading: authLoading } = useAuth();
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generate = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [{ data: scans }, { data: taste }] = await Promise.all([
        supabase
          .from("scans")
          .select("brand,name,accords,top_notes,heart_notes,base_notes,user_rating,is_favorite")
          .order("created_at", { ascending: false })
          .limit(15),
        supabase.from("taste_profile").select("*").eq("user_id", user.id).maybeSingle(),
      ]);

      const { data, error } = await supabase.functions.invoke("for-you", {
        body: { tasteProfile: taste, recentScans: scans ?? [] },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setRecs(data.recommendations ?? []);
      setHasGenerated(true);
    } catch (e: any) {
      toast.error(e?.message ?? "Kunde inte generera rekommendationer");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !hasGenerated && !loading) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!authLoading && !user) {
    return (
      <AppShell>
        <Logo />
        <div className="mt-20 text-center">
          <h1 className="font-display text-3xl">Personliga förslag</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Logga in för att få parfymer som matchar din smak.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex h-12 items-center rounded-2xl bg-gradient-luxe px-6 text-sm font-medium text-primary-foreground shadow-elegant"
          >
            Logga in
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Logo />
      <div className="mt-6 flex items-end justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gold">Kurerat åt dig</p>
          <h1 className="mt-1 font-display text-3xl">För dig</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={generate}
          disabled={loading}
          className="rounded-full border-border"
        >
          <RefreshCw className={"mr-1.5 h-3.5 w-3.5 " + (loading ? "animate-spin" : "")} />
          Uppdatera
        </Button>
      </div>

      {loading && recs.length === 0 ? (
        <div className="mt-12 grid place-items-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
          <p className="mt-3 text-sm text-muted-foreground">Komponerar dina förslag…</p>
        </div>
      ) : recs.length === 0 ? (
        <div className="mt-12 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-gold" />
          <p className="mt-4 text-sm text-muted-foreground">
            Scanna några parfymer först så får du bättre förslag.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {recs.map((r, i) => (
            <article
              key={i}
              className="overflow-hidden rounded-3xl border border-border/60 bg-card/70 backdrop-blur shadow-soft"
            >
              <div className="bg-gradient-luxe p-5 text-primary-foreground">
                <p className="text-[10px] uppercase tracking-[0.2em] opacity-70">{r.brand}</p>
                <h3 className="mt-1 font-display text-2xl leading-tight">{r.name}</h3>
                <p className="mt-1 text-xs opacity-80">{r.gender}</p>
              </div>
              <div className="p-5">
                <p className="text-sm text-foreground">{r.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {r.top_accords.map((a) => (
                    <span
                      key={a}
                      className="rounded-full border border-gold/30 bg-gold-soft/30 px-2.5 py-0.5 text-[11px] font-medium"
                    >
                      {a}
                    </span>
                  ))}
                </div>
                <div className="mt-4 rounded-2xl bg-accent/40 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-gold">Varför du</p>
                  <p className="mt-1 text-xs text-foreground/90">{r.why}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
