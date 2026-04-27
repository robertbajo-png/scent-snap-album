import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { Input } from "@/components/ui/input";
import type { ScanRow } from "@/lib/types";

export const Route = createFileRoute("/collection")({
  component: CollectionPage,
  head: () => ({
    meta: [
      { title: "My collection — ScentSnap" },
      { name: "description", content: "The perfumes you own, in one place." },
    ],
  }),
});

function CollectionPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [scans, setScans] = useState<ScanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("scans")
        .select("*")
        .eq("owned", true)
        .order("updated_at", { ascending: false });
      if (data) setScans(data as any);
      setLoading(false);
    })();
  }, [user, authLoading]);

  const filtered = scans.filter((s) => {
    if (!q) return true;
    const hay = `${s.brand} ${s.name} ${s.bottle_size ?? ""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  if (!authLoading && !user) {
    return (
      <AppShell>
        <Logo />
        <div className="mt-20 text-center">
          <h1 className="font-display text-3xl">{t("collection.signed_out_title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("collection.signed_out_sub")}</p>
          <Link
            to="/login"
            className="mt-6 inline-flex h-12 items-center rounded-2xl bg-gradient-luxe px-6 text-sm font-medium text-primary-foreground shadow-elegant"
          >
            {t("common.login")}
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Logo />

      <div className="mt-6 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gold/15 text-gold">
          <Package className="h-5 w-5" strokeWidth={1.7} />
        </div>
        <div>
          <h1 className="font-display text-3xl leading-tight">{t("collection.title")}</h1>
          <p className="text-xs text-muted-foreground">{t("collection.count", { n: scans.length })}</p>
        </div>
      </div>

      {scans.length > 0 && (
        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("history.search_placeholder")}
            className="h-12 rounded-2xl border-border bg-card/60 pl-11 backdrop-blur"
          />
        </div>
      )}

      <div className="mt-5 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-card/60" />
          ))
        ) : scans.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="font-display text-lg">{t("collection.empty_title")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t("collection.empty_sub")}</p>
            <Link
              to="/history"
              className="mt-5 inline-flex h-11 items-center rounded-2xl bg-gradient-luxe px-5 text-sm font-medium text-primary-foreground shadow-elegant"
            >
              {t("collection.empty_cta")}
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {t("history.empty_filter")}
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
                <p className="mt-1 text-[11px] text-gold">
                  {s.bottle_size?.trim() || t("collection.size_unknown")}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </AppShell>
  );
}
