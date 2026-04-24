import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { Input } from "@/components/ui/input";
import { formatRelative } from "@/lib/perfume";
import type { ScanRow } from "@/lib/types";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [scans, setScans] = useState<ScanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "fav">("all");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("scans")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setScans(data as any);
      setLoading(false);
    })();
  }, [user, authLoading]);

  const filtered = scans
    .filter((s) => (filter === "fav" ? s.is_favorite : true))
    .filter((s) => {
      if (!q) return true;
      const hay = `${s.brand} ${s.name}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });

  if (!authLoading && !user) {
    return (
      <AppShell>
        <Logo />
        <div className="mt-20 text-center">
          <h1 className="font-display text-3xl">Logga in för historik</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Spara dina scanningar och hitta dem igen senare.
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
      <div className="mt-6">
        <h1 className="font-display text-3xl">Din historik</h1>
        <p className="text-sm text-muted-foreground">{scans.length} scanningar</p>
      </div>

      <div className="relative mt-5">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Sök märke eller namn"
          className="h-12 rounded-2xl border-border bg-card/60 pl-11 backdrop-blur"
        />
      </div>

      <div className="mt-3 flex gap-2">
        {[
          { id: "all", label: "Alla" },
          { id: "fav", label: "Favoriter" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id as any)}
            className={
              "rounded-full px-4 py-1.5 text-xs font-medium transition " +
              (filter === t.id
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card/40 text-muted-foreground hover:text-foreground")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-card/60" />
          ))
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {scans.length === 0 ? "Inga scanningar än — börja på startsidan." : "Inga träffar."}
          </div>
        ) : (
          filtered.map((s) => (
            <Link
              key={s.id}
              to="/scent/$id"
              params={{ id: s.id }}
              className="flex gap-3 rounded-2xl border border-border/60 bg-card/60 p-3 backdrop-blur transition hover:shadow-soft"
            >
              {s.image_url ? (
                <img
                  src={s.image_url}
                  alt={`${s.brand} ${s.name}`}
                  loading="lazy"
                  className="h-20 w-20 flex-none rounded-xl object-cover"
                />
              ) : (
                <div className="grid h-20 w-20 flex-none place-items-center rounded-xl bg-gradient-luxe text-2xl font-display text-primary-foreground">
                  {s.brand?.[0] ?? "?"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.brand}</p>
                <p className="truncate font-display text-lg leading-tight">{s.name}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{formatRelative(s.created_at)}</p>
              </div>
              {s.is_favorite && <Heart className="h-4 w-4 flex-none fill-gold text-gold" />}
            </Link>
          ))
        )}
      </div>
    </AppShell>
  );
}
